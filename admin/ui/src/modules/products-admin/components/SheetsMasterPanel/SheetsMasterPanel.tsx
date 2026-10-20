import { workbookId } from "../../integrations/WorkbookIdentity";
import { useRef, useState } from "react";
import { z } from "zod";
import { jungCoreAdminProducts } from "../../integrations/JungCoreAdminProducts";
import "./SheetsMasterPanel.css";
function workbookLink(input: string): string | undefined {
  try {
    return (
      "https://docs.google.com/spreadsheets/d/" + workbookId(input) + "/edit"
    );
  } catch {
    return undefined;
  }
}
const resultSchema = z.object({
  changeSetId: z.string(),
  fingerprint: z.string().optional(),
  requiresPreparation: z.boolean().optional(),
  metadataWarning: z.string().optional(),
  mode: z.string().optional(),
  destructive: z.boolean().optional(),
  deletions: z
    .array(
      z.object({ productId: z.string(), code: z.string().nullable().optional(), sku: z.string().nullable().optional(), name: z.string() }),
    )
    .optional(),
  summary: z.object({
    created: z.number(),
    updated: z.number(),
    unchanged: z.number(),
    errors: z.number(),
    pending: z.number(),
    deleted: z.number().default(0),
  }),
  rows: z.array(
    z.object({
      gid: z.number(),
      rowNumber: z.number(),
      status: z.string(),
      message: z.string().optional(),
    }),
  ),
});
export default function SheetsMasterPanel({
  onSynced,
}: {
  onSynced: () => Promise<unknown> | void;
}) {
  const [input, setInput] = useState(
    () =>
      String(import.meta.env.VITE_JUNG_CORE_SHEETS_WORKBOOK_ID ?? "").trim() ||
      localStorage.getItem("jung-core-master-workbook") ||
      "",
  );
  const [result, setResult] = useState<z.infer<typeof resultSchema> | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const running = useRef(false);

  const safeToApply = Boolean(
    result &&
    result.mode === "WOOLY_INCREMENTAL_SYNC" &&
    result.destructive === false &&
    Array.isArray(result.deletions) &&
    result.deletions.length === 0 &&
    result.summary.deleted === 0 &&
    result.requiresPreparation === false &&
    result.changeSetId.trim() !== ""
  );
  async function run(action: "preview" | "prepare" | "apply") {
    if (busy || running.current) return;
    if (action === "apply" && (
      !safeToApply ||
      (!confirmed && !(receipt && Boolean(result?.metadataWarning)))
    )) {
      setError("Importación bloqueada: revisa y confirma una vista previa incremental segura.");
      return;
    }
    running.current = true;
    setBusy(true);
    setError("");
    if (action !== "apply") {
      setConfirmed(false);
      setResult(null);
      setReceipt(false);
    }
    try {
      const id = workbookId(input),
        brand = await jungCoreAdminProducts.options();
      const base =
        "/catalog-bulk/brands/" +
        encodeURIComponent(brand.id) +
        "/google-sheets/" +
        encodeURIComponent(id) +
        "/temporary-master/";
      localStorage.setItem("jung-core-master-workbook", id);
      if (action === "prepare") {
        await jungCoreAdminProducts.request(base + "prepare", {
          fingerprint: result?.fingerprint,
        });
        setResult(
          resultSchema.parse(
            await jungCoreAdminProducts.request(base + "preview", {}),
          ),
        );
        setReceipt(false);
      } else {
        const data = resultSchema.parse(
          await jungCoreAdminProducts.request(
            base + action,
            action === "apply" ? { changeSetId: result?.changeSetId } : {},
          ),
        );
        setResult(data);
        setReceipt(action === "apply");
        if (action === "apply") {
          setConfirmed(false);
          await onSynced();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo sincronizar");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="sheets-master-panel"
      aria-label="Sincronización Google Sheets a CORE"
    >
      <div className="sheets-master-panel__heading">
        <div>
          <strong>Sincronización de productos</strong>
          <small>Google Sheets → JUNG CORE</small>
        </div>
        <span className="sheets-master-panel__badge">
          Sincronización incremental
        </span>
      </div>
      <p>
        Sincronización incremental de WOOLY - Catalogo Maestro.
        Solo se crean o actualizan productos válidos; los productos ausentes
        de Sheets se conservan en CORE.
      </p>
      <p>
        Campos mínimos: Código, Nombre y Precio 1u.
        Las imágenes son opcionales y la publicación se realiza desde Admin.
      </p>      {workbookLink(input) ? (
        <p>
          <a href={workbookLink(input)} target="_blank" rel="noreferrer">
            Abrir WOOLY - Catalogo Maestro
          </a>
        </p>
      ) : null}
      <label>
        Workbook operativo
        <input
          aria-label="Workbook operativo"
          value={input}
          disabled={busy}
          onChange={(e) => {
            setInput(e.target.value);
            setResult(null);
            setReceipt(false);
            setConfirmed(false);
          }}
        />
      </label>
      <div className="sheets-master-panel__actions">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("preview")}
        >
          Revisar cambios
        </button>
        {result?.requiresPreparation ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("prepare")}
          >
            Preparar edición comercial temporal
          </button>
        ) : result ? (
          <>
            {!safeToApply ? (
              <p role="alert">
                Importación bloqueada: CORE debe devolver una vista previa incremental,
                sin eliminaciones y con la preparación completada.
              </p>
            ) : null}
            {!receipt && safeToApply ? (
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={busy}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                Confirmo que revisé los cambios y deseo importar los productos válidos.
              </label>
            ) : null}
            <button
              type="button"
              disabled={
                busy ||
                !safeToApply ||
                (!receipt && !confirmed) ||
                (receipt && !result.metadataWarning)
              }
              onClick={() => void run("apply")}
            >
              {receipt
                ? "Reintentar confirmación de metadata"
                : "Confirmar importación"}
            </button>
          </>
        ) : null}
      </div>
      {busy ? <p role="status">Procesando…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {result ? (
        <div className="sheets-master-panel__results">
          <p role="status">
            {receipt ? "Resultado" : "Vista previa"}: Creados:{" "}
            {result.summary.created} · Actualizados: {result.summary.updated} ·
            Sin cambios: {result.summary.unchanged} · Errores:{" "}
            {result.summary.errors} · Pendientes: {result.summary.pending} ·{" "}
            {receipt ? "Eliminaciones" : "Eliminaciones"}:{" "}
            {result.summary.deleted}
          </p>
          {result.summary.deleted > 0 ? (
            <p role="alert">
              Snapshot completo destructivo: {result.summary.deleted} productos
              Wooly ausentes de Google Sheets{" "}
              {receipt ? "fueron eliminados" : "se eliminarán al sincronizar"}.
              Las otras marcas y los archivos R2 se conservan.
            </p>
          ) : null}
          {result.deletions?.length ? (
            <details>
              <summary>Productos eliminados por ausencia</summary>
              <ul>
                {result.deletions.map((product) => (
                  <li key={product.productId}>
                    {product.code ?? "Sin código"} — {product.name}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {result.metadataWarning ? (
            <p role="alert">{result.metadataWarning}</p>
          ) : null}
          <details className="sheets-master-panel__details">
            <summary>Revisar resultados por fila</summary>
            <ul>
              {result.rows.map((row) => (
                <li key={row.gid + ":" + row.rowNumber}>
                  Pestaña {row.gid}, fila {row.rowNumber}: {row.status}
                  {row.message ? " — " + row.message : ""}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
    </section>
  );
}
