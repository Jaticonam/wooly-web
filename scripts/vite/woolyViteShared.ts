import path from "node:path";

import { loadEnv } from "vite";
import type { ProxyOptions } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

/*
 * W12-02: configuración Vite compartida por Wooly Público (ui/)
 * y Wooly Admin (admin/ui/).
 *
 * - Un solo origen de alias para los paquetes compartidos.
 * - Un solo proxy de desarrollo hacia JUNG CORE (:3000),
 *   idéntico al previo a la migración (C2C.9A / 2C.1 Shadow).
 * - Las credenciales se leen solo en el proceso Node de Vite;
 *   nunca entran al bundle React.
 */

export const REPO_ROOT = path.resolve(__dirname, "..", "..");

export function woolyAliases(appSrc: string) {
  return {
    "@": appSrc,
    "@wooly/contracts": path.resolve(REPO_ROOT, "packages/contracts/src"),
    "@wooly/shared": path.resolve(REPO_ROOT, "packages/shared/src"),
  };
}

export const WOOLY_DEDUPE = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "@tanstack/react-query",
  "@tanstack/query-core",
];

export function woolyPostcss(appDir: string) {
  return {
    plugins: [
      tailwindcss({
        config: path.resolve(appDir, "tailwind.config.ts"),
      }),
      autoprefixer(),
    ],
  };
}

export function jungCoreDevProxy(mode: string): Record<string, ProxyOptions> {
  const jungCoreShadowReadKey =
    mode === "development"
      ? process.env.JUNG_CORE_READ_KEY?.trim()
      : undefined;

  const jungCoreShadowHeaders: Record<string, string> =
    jungCoreShadowReadKey
      ? {
          "x-jung-core-read-key":
            jungCoreShadowReadKey,
        }
      : {};

  const masterWriteKey =
    mode === "development"
      ? process.env.JUNG_CORE_WRITE_KEY?.trim() ||
        loadEnv(mode, REPO_ROOT, "JUNG_CORE_WRITE_KEY").JUNG_CORE_WRITE_KEY?.trim()
      : undefined;

  const jungCoreDevTarget =
    process.env.JUNG_CORE_DEV_ORIGIN?.trim() ||
    "http://127.0.0.1:3000";

  return {
    /*
     * C2C.9A:
     * Wooly local consume CORE :3000 sin exponer
     * CORS ni credenciales al navegador.
     *
     * Ejemplo:
     * /jung-core/products -> http://127.0.0.1:3000/products
     */
    "/jung-core": {
      target: jungCoreDevTarget,
      configure(proxy) {
        proxy.on("proxyReq", (proxyRequest, request) => {
          if (masterWriteKey && request.method === "POST" && /^\/catalog-bulk\/brands\/[^/]+\/google-sheets\/[^/]+\/temporary-master\/(preview|prepare|apply)$/.test(proxyRequest.path)) proxyRequest.setHeader("x-jung-core-write-key", masterWriteKey);
        });
      },
      changeOrigin: true,
      rewrite: (requestPath) =>
        requestPath.replace(/^\/jung-core/, ""),
    },

    ...(
      mode === "development"
        ? {
            /*
             * 2C.1 Shadow:
             *
             * La credencial se lee exclusivamente
             * en el proceso Node de Vite.
             *
             * Nunca entra al bundle React.
             */
            "/jung-core-shadow": {
              target:
                "http://127.0.0.1:3000",

              changeOrigin:
                true,

              headers:
                jungCoreShadowHeaders,

              rewrite:
                () =>
                  "/internal/catalog/snapshots/wooly",
            },
          }
        : {}
    ),
  };
}

export const WOOLY_ADMIN_DEV_PORT = 8001;
