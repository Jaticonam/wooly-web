#!/usr/bin/env node
/*
 * P4-SEC-03 — Verificación local del puente PHP `ui/public/jung-core/index.php`.
 *
 * Mecanismo seguro (sin producción, sin JUNG CORE real, sin red externa):
 *   1. Genera una CA de prueba efímera y un certificado para
 *      core.jungnegocios.com (requiere `openssl` en PATH).
 *   2. Levanta un "CORE" falso TLS en 127.0.0.1 que registra cada solicitud
 *      y responde con bytes HTTP escritos a mano (permite cabeceras
 *      duplicadas o malformadas).
 *   3. Levanta un proxy CONNECT local que SOLO acepta
 *      core.jungnegocios.com:443 y lo tuneliza al CORE falso; cualquier otro
 *      destino recibe 403 y la prueba falla.
 *   4. Ejecuta el index.php real, sin modificar, con `php -S` y
 *      https_proxy apuntando al proxy local, confiando solo en la CA de prueba.
 *
 * Uso: node scripts/jung-core-bridge/verify-bridge-http-compat.mjs
 * Requiere: php (>= 8.1, extensión curl) y openssl.
 * Este script no forma parte de `npm test` (no se ejecuta en CI ni en deploy).
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import tls from "node:tls";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const bridge = process.env.WOOLY_BRIDGE_PHP
  ? path.resolve(process.env.WOOLY_BRIDGE_PHP)
  : path.resolve(here, "../../ui/public/jung-core/index.php");
const UPSTREAM_HOST = "core.jungnegocios.com";

const results = [];
const check = (name, condition, detail = "") => {
  results.push({ name, ok: Boolean(condition), detail });
};

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed: ${r.stderr || r.error}`);
  }
  return r.stdout;
}

function makeCertificates(dir) {
  const p = (f) => path.join(dir, f);
  writeFileSync(
    p("leaf.ext"),
    `subjectAltName=DNS:${UPSTREAM_HOST}\nbasicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n`,
  );
  run("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
    "-subj", "/CN=WOOLY P4-SEC-03 test CA", "-keyout", p("ca.key"), "-out", p("ca.pem")]);
  run("openssl", ["req", "-newkey", "rsa:2048", "-nodes", "-subj", `/CN=${UPSTREAM_HOST}`,
    "-keyout", p("leaf.key"), "-out", p("leaf.csr")]);
  run("openssl", ["x509", "-req", "-in", p("leaf.csr"), "-CA", p("ca.pem"), "-CAkey", p("ca.key"),
    "-CAcreateserial", "-days", "1", "-extfile", p("leaf.ext"), "-out", p("leaf.pem")]);
  return { ca: p("ca.pem"), key: readFileSync(p("leaf.key")), cert: readFileSync(p("leaf.pem")) };
}

/* ---------- CORE falso (HTTP/1.1 manual sobre TLS) ---------- */
const coreRequests = [];
const CORE_BODY_429 = '{"success":false,"errorCode":"CATALOG_PUBLICATION_RATE_LIMITED","message":"Demasiadas solicitudes. Intente más tarde.","statusCode":429}';

function coreResponse(target) {
  const url = new URL(target, "https://core.invalid");
  const scenario = url.searchParams.get("case") ?? "echo";
  const ra = url.searchParams.getAll("ra");
  const status = Number(url.searchParams.get("status") ?? (scenario === "echo" ? 200 : 429));
  const lines = [`HTTP/1.1 ${status} X`, "Content-Type: application/json; charset=utf-8"];
  let body;
  if (scenario === "echo") {
    body = JSON.stringify({ ok: true, seen: coreRequests.at(-1) });
  } else {
    body = CORE_BODY_429;
    for (const value of ra) lines.push(`Retry-After: ${value}`);
    // Retorno de carro aislado dentro del valor (intento de inyección).
    if (url.searchParams.get("raw") === "cr") lines.push("Retry-After: 30\rX-Injected: 1");
    // Cabecera adicional real tras un Retry-After válido.
    if (url.searchParams.get("raw") === "extra") lines.push("Retry-After: 30", "X-Injected: 1");
  }
  lines.push("X-Internal-Debug: core-secret", "X-Powered-By: Express",
    "Access-Control-Allow-Origin: https://evil.example", "Set-Cookie: s=1; Path=/; HttpOnly");
  const bytes = Buffer.from(body, "utf8");
  lines.push(`Content-Length: ${bytes.length}`, "Connection: close");
  return Buffer.concat([Buffer.from(lines.join("\r\n") + "\r\n\r\n", "latin1"), bytes]);
}

function startFakeCore({ key, cert }) {
  const server = tls.createServer({ key, cert }, (socket) => {
    let buf = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const end = buf.indexOf("\r\n\r\n");
      if (end < 0) return;
      const head = buf.subarray(0, end).toString("latin1").split("\r\n");
      const [method, target] = head[0].split(" ");
      const headers = {};
      for (const line of head.slice(1)) {
        const i = line.indexOf(":");
        const name = line.slice(0, i).trim().toLowerCase();
        (headers[name] ??= []).push(line.slice(i + 1).trim());
      }
      const length = Number(headers["content-length"]?.[0] ?? 0);
      if (buf.length < end + 4 + length) return;
      const body = buf.subarray(end + 4, end + 4 + length).toString("utf8");
      coreRequests.push({ method, target, headers, body });
      socket.end(coreResponse(target));
      buf = Buffer.alloc(0);
    });
    socket.on("error", () => {});
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

/* ---------- Proxy CONNECT restringido ---------- */
const connectTargets = [];
function startProxy(corePort) {
  const server = http.createServer((_req, res) => { res.writeHead(403); res.end(); });
  server.on("connect", (req, client) => {
    connectTargets.push(req.url);
    if (req.url !== `${UPSTREAM_HOST}:443`) {
      client.end("HTTP/1.1 403 Forbidden\r\n\r\n");
      return;
    }
    const upstream = net.connect(corePort, "127.0.0.1", () => {
      client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      upstream.pipe(client);
      client.pipe(upstream);
    });
    upstream.on("error", () => client.destroy());
    client.on("error", () => upstream.destroy());
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

/* ---------- php -S con el index.php real ---------- */
function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}

async function startPhp(ca, proxyPort) {
  const port = await freePort();
  const proxy = `http://127.0.0.1:${proxyPort}`;
  const env = { ...process.env, https_proxy: proxy, HTTPS_PROXY: proxy, http_proxy: proxy,
    HTTP_PROXY: proxy, ALL_PROXY: proxy, all_proxy: proxy, no_proxy: "", NO_PROXY: "" };
  const child = spawn("php", ["-d", `curl.cainfo=${ca}`, "-d", `openssl.cafile=${ca}`,
    "-d", "display_errors=stderr", "-S", `127.0.0.1:${port}`, bridge],
    { env, stdio: ["ignore", "ignore", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (d) => { stderr += d; });
  for (let i = 0; i < 50; i++) {
    const up = await new Promise((resolve) => {
      const s = net.connect(port, "127.0.0.1", () => { s.end(); resolve(true); });
      s.on("error", () => resolve(false));
    });
    if (up) return { child, port, stderr: () => stderr };
    await new Promise((r) => setTimeout(r, 100));
  }
  child.kill();
  throw new Error(`php -S did not start: ${stderr}`);
}

/* Solicitud HTTP cruda para poder enviar cabeceras manipuladas. */
function rawRequest(port, { method = "GET", target, headers = [], body = "" }) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1", () => {
      const payload = Buffer.from(body, "utf8");
      const head = [`${method} ${target} HTTP/1.1`, `Host: 127.0.0.1:${port}`, ...headers,
        ...(payload.length || method === "POST" ? [`Content-Length: ${payload.length}`] : []),
        "Connection: close"];
      socket.write(Buffer.concat([Buffer.from(head.join("\r\n") + "\r\n\r\n", "latin1"), payload]));
    });
    let data = Buffer.alloc(0);
    socket.on("data", (c) => { data = Buffer.concat([data, c]); });
    socket.on("error", reject);
    socket.on("end", () => {
      const end = data.indexOf("\r\n\r\n");
      const lines = data.subarray(0, end).toString("latin1").split("\r\n");
      const status = Number(lines[0].split(" ")[1]);
      const hdrs = {};
      for (const line of lines.slice(1)) {
        const i = line.indexOf(":");
        const name = line.slice(0, i).trim().toLowerCase();
        (hdrs[name] ??= []).push(line.slice(i + 1).trim());
      }
      let rest = data.subarray(end + 4);
      if (hdrs["transfer-encoding"]?.[0] === "chunked") {
        const parts = [];
        let off = 0;
        while (off < rest.length) {
          const nl = rest.indexOf("\r\n", off);
          const size = parseInt(rest.subarray(off, nl).toString(), 16);
          if (!size) break;
          parts.push(rest.subarray(nl + 2, nl + 2 + size));
          off = nl + 2 + size + 2;
        }
        rest = Buffer.concat(parts);
      }
      resolve({ status, headers: hdrs, body: rest.toString("utf8") });
    });
  });
}

/* ---------- Casos ---------- */
async function main() {
  const php = spawnSync("php", ["-r", "echo function_exists('curl_init') ? 'ok' : 'nocurl';"], { encoding: "utf8" });
  if (php.status !== 0 || php.stdout !== "ok") {
    console.error("BLOCK: php con extensión curl no disponible; el puente no puede verificarse aquí.");
    process.exit(2);
  }
  const dir = mkdtempSync(path.join(tmpdir(), "wooly-bridge-"));
  const certs = makeCertificates(dir);
  const core = await startFakeCore(certs);
  const proxy = await startProxy(core.address().port);
  const server = await startPhp(certs.ca, proxy.address().port);
  const lint = spawnSync("php", ["-l", bridge], { encoding: "utf8" });
  check("php -l index.php", lint.status === 0, lint.stdout.trim());

  try {
    const send = (opts) => rawRequest(server.port, opts);
    const lastCore = () => coreRequests.at(-1);

    // 1. Origin válido se reenvía exacto.
    let n = coreRequests.length;
    let r = await send({ method: "POST", target: "/jung-core/catalog-commercial/brands/b1/catalog-publications?case=echo",
      headers: ["Origin: https://admin.wooly.example", "Content-Type: application/json", "Cookie: jung_admin=abc"],
      body: '{"requestId":"x"}' });
    check("1. Origin válido llega a CORE sin cambios", r.status === 200 && coreRequests.length === n + 1 &&
      JSON.stringify(lastCore().headers.origin) === JSON.stringify(["https://admin.wooly.example"]),
      JSON.stringify(lastCore()?.headers.origin));
    check("1b. Cookie, Content-Type y cuerpo se conservan",
      lastCore().headers.cookie?.[0] === "jung_admin=abc" && lastCore().headers["content-type"]?.[0] === "application/json" &&
      lastCore().body === '{"requestId":"x"}');

    r = await send({ method: "POST", target: "/jung-core/x?case=echo", headers: ["Origin: http://localhost:8080"], body: "{}" });
    check("1c. Origin con puerto se reenvía", lastCore().headers.origin?.[0] === "http://localhost:8080");

    r = await send({ method: "POST", target: "/jung-core/x?case=echo", headers: ["Origin: null"], body: "{}" });
    check("1d. Origin opaco 'null' se reenvía literal (CORE lo rechaza)", r.status === 200 && lastCore().headers.origin?.[0] === "null");

    // 2. Origin ausente no se inventa (ni desde Host / X-Forwarded-Host).
    r = await send({ method: "POST", target: "/jung-core/x?case=echo",
      headers: ["X-Forwarded-Host: admin.wooly.example", "X-Forwarded-Proto: https", "Referer: https://admin.wooly.example/admin"],
      body: "{}" });
    check("2. Sin Origin, CORE no recibe Origin", r.status === 200 && lastCore().headers.origin === undefined,
      JSON.stringify(lastCore().headers.origin));
    check("2b. X-Forwarded-Host/Referer no se reenvían",
      lastCore().headers["x-forwarded-host"] === undefined && lastCore().headers.referer === undefined);
    r = await send({ method: "GET", target: "/jung-core/public/x?case=echo" });
    check("2c. GET sin Origin sigue sin Origin", r.status === 200 && lastCore().headers.origin === undefined);

    // 3. Origin manipulado se rechaza sin contactar CORE.
    const badOrigins = [
      "https://admin.wooly.example/admin", "https://admin.wooly.example?x=1", "https://u:p@admin.wooly.example",
      "javascript:alert(1)", "ftp://admin.wooly.example", "https://a.example, https://b.example",
      "https://a.example\tx", "https://a.example\x01", "https://-bad-.example", "https://a.example:99999",
      "https://a.example:", "https://a.example#f", "//admin.wooly.example", "https://" + "a".repeat(2100) + ".example",
    ];
    for (const bad of badOrigins) {
      n = coreRequests.length;
      r = await send({ method: "POST", target: "/jung-core/x?case=echo", headers: [`Origin: ${bad}`], body: "{}" });
      check(`3. Origin manipulado rechazado: ${JSON.stringify(bad.slice(0, 40))}`,
        r.status === 400 && coreRequests.length === n && /Invalid Origin header/.test(r.body), `status=${r.status}`);
    }
    n = coreRequests.length;
    r = await send({ method: "POST", target: "/jung-core/x?case=echo", headers: ["Origin: https://a.example", "Origin: https://b.example"], body: "{}" });
    // Apache/LiteSpeed combinan duplicados con "," (→ 400); `php -S` conserva
    // solo el último. En ambos casos CORE nunca recibe un Origin combinado
    // ni fabricado.
    check("3b. Origin duplicado: rechazado o un único valor enviado por el cliente",
      (r.status === 400 && coreRequests.length === n) ||
      (r.status === 200 && lastCore().headers.origin?.length === 1 &&
        ["https://a.example", "https://b.example"].includes(lastCore().headers.origin[0])),
      `status=${r.status} origin=${JSON.stringify(lastCore()?.headers.origin)}`);
    n = coreRequests.length;
    r = await send({ method: "POST", target: "/jung-core/x?case=echo", headers: ["Origin: https://a.example,https://b.example"], body: "{}" });
    check("3c. Origin combinado por el servidor web rechazado", r.status === 400 && coreRequests.length === n, `status=${r.status}`);

    // Restricciones previas intactas.
    r = await send({ method: "DELETE", target: "/jung-core/x" });
    check("3d. Métodos no permitidos siguen en 405", r.status === 405 && r.headers.allow?.[0] === "GET, HEAD, OPTIONS, POST, PUT");
    r = await send({ method: "GET", target: "/otra/ruta" });
    check("3e. Rutas fuera de /jung-core siguen en 400", r.status === 400);

    // Upstream no controlable por el cliente.
    n = connectTargets.length;
    r = await send({ method: "GET", target: "/jung-core/x?case=echo", headers: ["X-Forwarded-Host: evil.example", "Origin: https://evil.example"] });
    check("3f. Destino upstream fijo (core.jungnegocios.com)",
      connectTargets.slice(n).every((t) => t === `${UPSTREAM_HOST}:443`) && connectTargets.length > n);

    // 4. Retry-After válido se conserva con estado y cuerpo originales.
    r = await send({ method: "POST", target: "/jung-core/x?case=rate&ra=60", headers: ["Origin: https://admin.wooly.example"], body: "{}" });
    check("4. Retry-After válido reenviado", r.status === 429 && JSON.stringify(r.headers["retry-after"]) === '["60"]',
      JSON.stringify(r.headers["retry-after"]));
    check("4b. Cuerpo de error 429 sin modificar", r.body === CORE_BODY_429);
    check("4c. Cache-Control: no-store se mantiene", r.headers["cache-control"]?.includes("no-store"));
    check("4d. Content-Type de CORE se conserva", r.headers["content-type"]?.[0] === "application/json; charset=utf-8");
    r = await send({ method: "GET", target: "/jung-core/public/x?case=rate&ra=%2001%20" });
    check("4e. Valor con ceros/espacios se normaliza a entero", r.status === 429 && r.headers["retry-after"]?.[0] === "1");
    r = await send({ method: "GET", target: "/jung-core/public/x?case=rate&status=503&ra=120" });
    check("4f. Retry-After en 503 reenviado", r.status === 503 && r.headers["retry-after"]?.[0] === "120");

    // 5. Valores inválidos no se reenvían.
    for (const [label, query] of [["abc", "ra=abc"], ["-1", "ra=-1"], ["0", "ra=0"], ["1.5", "ra=1.5"],
      ["excesivo", "ra=86401"], ["fecha HTTP", "ra=" + encodeURIComponent("Wed, 21 Oct 2026 07:28:00 GMT")],
      ["duplicado", "ra=10&ra=20"], ["CR inyectado", "raw=cr"], ["ausente", ""]]) {
      r = await send({ method: "GET", target: `/jung-core/public/x?case=rate&${query}` });
      check(`5. Retry-After inválido no reenviado: ${label}`,
        (
          label === "CR inyectado"
            ? (
                (r.status === 429 && r.body === CORE_BODY_429) ||
                (r.status === 502 && r.body === JSON.stringify({
                  success: false,
                  message: "Could not reach JUNG CORE."
                }))
              )
            : (r.status === 429 && r.body === CORE_BODY_429)
        ) &&
        r.headers["retry-after"] === undefined &&
        r.headers["x-injected"] === undefined,
        JSON.stringify(r.headers["retry-after"]));
    }
    r = await send({ method: "GET", target: "/jung-core/public/x?case=rate&raw=extra" });
    check("5a. Cabecera extra tras Retry-After válido no se transmite",
      r.status === 429 && r.headers["retry-after"]?.[0] === "30" && r.headers["x-injected"] === undefined);
    r = await send({ method: "GET", target: "/jung-core/public/x?case=rate&status=200&ra=10" });
    check("5b. Retry-After en 200 no reenviado", r.status === 200 && r.headers["retry-after"] === undefined);

    // Cabeceras internas no se transmiten.
    r = await send({ method: "GET", target: "/jung-core/public/x?case=rate&ra=5" });
    check("5c. Cabeceras internas de CORE no se transmiten",
      r.headers["x-internal-debug"] === undefined && r.headers["access-control-allow-origin"] === undefined &&
      !(r.headers["x-powered-by"] ?? []).includes("Express"));
    check("5d. Set-Cookie de CORE se mantiene", r.headers["set-cookie"]?.[0] === "s=1; Path=/; HttpOnly");
    r = await send({ method: "HEAD", target: "/jung-core/public/x?case=rate&ra=7" });
    check("5e. HEAD conserva 429 y Retry-After", r.status === 429 && r.headers["retry-after"]?.[0] === "7");

    check("Sin destinos CONNECT distintos de CORE falso", connectTargets.every((t) => t === `${UPSTREAM_HOST}:443`),
      JSON.stringify([...new Set(connectTargets)]));
  } finally {
    server.child.kill();
    core.close();
    proxy.close();
    rmSync(dir, { recursive: true, force: true });
  }

  const failed = results.filter((x) => !x.ok);
  for (const x of results) console.log(`${x.ok ? "PASS" : "FAIL"}  ${x.name}${x.ok || !x.detail ? "" : `  (${x.detail})`}`);
  console.log(`\n${results.length - failed.length}/${results.length} verificaciones del puente PHP superadas.`);
  if (failed.length && server.stderr()) console.error(server.stderr());
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
