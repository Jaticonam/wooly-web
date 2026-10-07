import { workbookId } from "../../integrations/WorkbookIdentity";
import { useState } from "react";
import { z } from "zod";
import { jungCoreAdminProducts } from "../../integrations/JungCoreAdminProducts";
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
      z.object({ productId: z.string(), sku: z.string(), name: z.string() }),
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
  async function run(action: "preview" | "prepare" | "apply") {
    setBusy(true);
    setError("");
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
        if (action === "apply") await onSynced();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo sincronizar");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Sincronización Google Sheets a CORE">
      <p>
        Workbook: WOOLY - Catalogo Maestro. Captura productos, revisa cambios,
        sincroniza el snapshot completo desde Google Sheets y consulta los
        resultados. En modo bootstrap, los productos Wooly ausentes de la hoja
        se eliminan de CORE. Una hoja vacía deja el catálogo Wooly vacío.
      </p>
      {workbookLink(input) ? (
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
          }}
        />
      </label>
      <div>
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
          <button
            type="button"
            disabled={busy || (receipt && !result.metadataWarning)}
            onClick={() => void run("apply")}
          >
            {receipt
              ? "Reintentar confirmación de metadata"
              : "Sincronizar desde Google Sheets"}
          </button>
        ) : null}
      </div>
      {busy ? <p role="status">Procesando…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {result ? (
        <>
          <p role="status">
            {receipt ? "Resultado" : "Vista previa"}: Creados:{" "}
            {result.summary.created} · Actualizados: {result.summary.updated} ·
            Sin cambios: {result.summary.unchanged} · Errores:{" "}
            {result.summary.errors} · Pendientes: {result.summary.pending} ·{" "}
            {receipt ? "Eliminados por ausencia" : "Eliminar por ausencia"}:{" "}
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
                    {product.sku} — {product.name}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {result.metadataWarning ? (
            <p role="alert">{result.metadataWarning}</p>
          ) : null}
          <details>
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
        </>
      ) : null}
    </section>
  );
}
