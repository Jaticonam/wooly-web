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
const exportCount = z.number().int().nonnegative();
const exportCell = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const exportSchema = z.object({
  mode: z.literal("COMMERCIAL_EXPORT"),
  fingerprint: z.string().min(1),
  destructive: z.literal(false),
  writesCoreProducts: z.literal(false),
  applyAvailable: z.boolean().optional(),
  verified: z.boolean().optional(),
  receiptId: z.string().optional(),
  summary: z.object({
    created: exportCount, updated: exportCount, unchanged: exportCount,
    conflicts: exportCount, preserved: exportCount, deleted: z.literal(0),
  }),
  rows: z.array(z.object({
    code: z.string(), category: z.string(), rowNumber: z.number().optional(),
    status: z.enum(["CREATE", "UPDATE", "UNCHANGED", "CONFLICT", "PRESERVED"]),
    message: z.string().optional(),
    changes: z.array(z.object({ field: z.string(), from: exportCell, to: exportCell })).optional(),
  })),
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
  const [exportResult, setExportResult] = useState<z.infer<typeof exportSchema> | null>(null);
  const [exportConfirmed, setExportConfirmed] = useState(false);
  const [exportReceipt, setExportReceipt] = useState(false);
  const exportTarget = useRef<{ brandId: string; workbook: string } | null>(null);
  const exportAvailable = Boolean(exportResult && !exportReceipt &&
    exportResult.applyAvailable === true &&
    exportResult.summary.created + exportResult.summary.updated > 0);

  function clearExport() {
    setExportResult(null);
    setExportConfirmed(false);
    setExportReceipt(false);
    exportTarget.current = null;
  }

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
    clearExport();
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
  async function runExport(action: "preview" | "apply") {
    if (busy || running.current) return;
    if (action === "apply" && (!exportAvailable || !exportConfirmed || !exportTarget.current || !exportResult)) {
      setError("Exportación bloqueada: revisa y confirma los cambios.");
      return;
    }
    running.current = true;
    setBusy(true);
    setError("");
    setResult(null);
    setConfirmed(false);
    setReceipt(false);
    previewTarget.current = null;
    const fingerprint = exportResult?.fingerprint;
    const previous = exportTarget.current;
    clearExport();
    try {
      const id = workbookId(input);
      let target: { brandId: string; workbook: string };
      if (action === "preview") {
        const brand = await jungCoreAdminProducts.options();
        target = { brandId: brand.id, workbook: id };
      } else {
        if (!previous || previous.workbook !== id || !fingerprint) throw new Error("Revisa nuevamente el documento.");
        target = previous;
      }
      const endpoint = "/catalog-bulk/brands/" + encodeURIComponent(target.brandId) +
        "/google-sheets/" + encodeURIComponent(target.workbook) + "/temporary-master/commercial-export/" + action;
      const data = exportSchema.parse(await jungCoreAdminProducts.request(endpoint,
        action === "apply" ? { fingerprint } : {}));
      if (action === "preview") {
        if (typeof data.applyAvailable !== "boolean" || data.verified !== undefined)
          throw new Error("Respuesta de revisión de exportación inválida.");
        exportTarget.current = target;
      } else {
        if (data.fingerprint !== fingerprint || data.verified !== true || !data.receiptId)
          throw new Error("No se pudo confirmar la exportación. Revisa la hoja antes de reintentar.");
        setExportReceipt(true);
      }
      setExportResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo exportar. Revisa antes de reintentar.");
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
          <small>Google Sheets ↔ JUNG CORE</small>
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
            clearExport();
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
      <div className="sheets-master-panel__actions">
        <button type="button" disabled={busy} onClick={() => void runExport("preview")}>
          Revisar exportación
        </button>
        {exportResult && !exportReceipt ? (
          <>
            {!exportAvailable ? <p>No hay cambios seguros para exportar.</p> : (
              <label>
                <input type="checkbox" checked={exportConfirmed} disabled={busy}
                  onChange={(event) => setExportConfirmed(event.target.checked)} />
                Confirmo los cambios a Google Sheets y que nadie está editando el documento.
              </label>
            )}
            <button type="button" disabled={busy || !exportAvailable || !exportConfirmed}
              onClick={() => void runExport("apply")}>Confirmar exportación</button>
          </>
        ) : null}
      </div>
      <p>CORE → Sheets: sólo productos y precios, sin eliminar filas ni reemplazar cambios pendientes.
        Disponible en el entorno TEST autorizado.</p>
      {exportResult ? (
        <div className="sheets-master-panel__results">
          <p role="status">
            {exportReceipt ? "Exportación verificada" : "Vista previa de exportación"}:
            Altas: {exportResult.summary.created} · Actualizados: {exportResult.summary.updated} ·
            Sin cambios: {exportResult.summary.unchanged} · Conflictos: {exportResult.summary.conflicts} ·
            Conservados: {exportResult.summary.preserved} · Eliminaciones: 0
          </p>
          <details className="sheets-master-panel__details" open>
            <summary>Revisar cambios de exportación</summary>
            <ul>
              {exportResult.rows.filter(row => row.status !== "UNCHANGED").map((row, index) => (
                <li key={row.category + ":" + row.rowNumber + ":" + row.code + ":" + index}>
                  {row.category} — {row.code || "Sin código"} — {({
                    CREATE: "Alta", UPDATE: "Actualizar", UNCHANGED: "Sin cambios",
                    CONFLICT: "Conflicto", PRESERVED: "Conservado",
                  })[row.status]}
                  {row.message ? " — " + row.message : ""}
                  {row.changes?.length ? <ul>{row.changes.map(change =>
                    <li key={change.field}>{change.field}: {String(change.from ?? "—")} → {String(change.to ?? "—")}</li>
                  )}</ul> : null}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
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
