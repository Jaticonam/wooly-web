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
  writesGoogleSheets: z.boolean().optional(),
  sourceMetadataIgnored: z.boolean().optional(),
  applyAvailable: z.boolean().optional(),
  metadataAcknowledged: z.boolean().optional(),
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
    deleted: z.number().int().nonnegative().optional(),
  }),
  rows: z.array(
    z.object({
      gid: z.number(),
      rowNumber: z.number(),
      status: z.string(),
      code: z.string().nullable().optional(),
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

  const previewTarget = useRef<{ brandId: string; workbook: string } | null>(null);
  const safePreview = Boolean(
    result && !receipt &&
    result.mode === "COMMERCIAL_TRANSFER" &&
    result.writesGoogleSheets === false &&
    result.sourceMetadataIgnored === true &&
    result.destructive === false &&
    (result.deletions?.length ?? 0) === 0 &&
    (result.summary.deleted ?? 0) === 0 &&
    result.requiresPreparation !== true &&
    typeof result.applyAvailable === "boolean" &&
    result.changeSetId.trim() !== "" &&
    result.fingerprint?.trim()
  );
  const safeToApply = Boolean(safePreview && result?.applyAvailable === true &&
    result.summary.created + result.summary.updated > 0);

  async function run(action: "preview" | "apply") {
    if (busy || running.current) return;
    if (action === "apply" && (!safeToApply || !confirmed || !previewTarget.current || !result)) {
      setError("Importación bloqueada: revisa y confirma una vista previa comercial segura.");
      return;
    }
    running.current = true;
    setBusy(true);
    setError("");
    setConfirmed(false);
    const reserved = result?.changeSetId;
    const previousTarget = previewTarget.current;
    setResult(null);
    setReceipt(false);
    previewTarget.current = null;
    try {
      const id = workbookId(input);
      let target: { brandId: string; workbook: string };
      if (action === "preview") {
        const brand = await jungCoreAdminProducts.options();
        target = { brandId: brand.id, workbook: id };
      } else {
        if (!previousTarget || previousTarget.workbook !== id || !reserved) {
          throw new Error("El documento cambió. Revisa nuevamente antes de importar.");
        }
        target = previousTarget;
      }
      const base =
        "/catalog-bulk/brands/" + encodeURIComponent(target.brandId) +
        "/google-sheets/" + encodeURIComponent(target.workbook) +
        "/temporary-master/commercial-transfer/";
      localStorage.setItem("jung-core-master-workbook", id);
      const data = resultSchema.parse(await jungCoreAdminProducts.request(
        base + action,
        action === "apply" ? { sheetName: "*", changeSetId: reserved } : { sheetName: "*" },
      ));
      if (action === "preview") {
        previewTarget.current = target;
        setResult(data);
      } else {
        if (data.changeSetId !== reserved || data.mode !== "WOOLY_INCREMENTAL_SYNC" ||
            data.metadataAcknowledged !== false || !Array.isArray(data.deletions) ||
            data.deletions.length !== 0 || data.summary.deleted !== 0) {
          throw new Error("Respuesta de Apply inesperada. Revisa CORE antes de volver a importar.");
        }
        setResult(data);
        setReceipt(true);
        await onSynced();
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
        Esta transferencia no escribe en Google Sheets ni publica productos.
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
            previewTarget.current = null;
            setError("");
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
        {result ? (
          <>
            {!receipt && !safePreview ? (
              <p role="alert">
                Importación bloqueada: CORE debe devolver una vista previa comercial segura,
                sin eliminaciones ni escrituras en Sheets.
              </p>
            ) : null}
            {!receipt && safePreview && !safeToApply ? (
              <p>No hay altas ni actualizaciones válidas para aplicar.</p>
            ) : null}
            {!receipt && safeToApply ? (
              <label>
                <input type="checkbox" checked={confirmed} disabled={busy}
                  onChange={(event) => setConfirmed(event.target.checked)} />
                Confirmo que revisé los cambios y deseo importar los productos válidos.
              </label>
            ) : null}
            <button type="button" disabled={busy || receipt || !safeToApply || !confirmed}
              onClick={() => void run("apply")}>
              {receipt ? "Importación completada" : "Confirmar importación"}
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
            {result.summary.deleted ?? 0}
          </p>
          {(result.summary.deleted ?? 0) > 0 ? (
            <p role="alert">
              Snapshot completo destructivo: {result.summary.deleted} productos afectados.
              Importación bloqueada.
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
                  {row.code ? " — " + row.code : ""}
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
