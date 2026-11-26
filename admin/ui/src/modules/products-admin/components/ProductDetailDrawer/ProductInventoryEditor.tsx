import { useRef, useState, type FormEvent } from "react";
import { z } from "zod";

import {
  loadAdminProductDetail,
  updateAdminProductInventoryPolicy,
  type AdminInventoryOverride,
} from "@/modules/admin-auth/services/AdminAuthClient";

import "../CreateProductPanel/CreateProductPanel.css";

const overrideSchema = z.enum([
  "AUTO",
  "PREORDER",
  "COMING_SOON",
  "OUT_OF_STOCK",
]).nullable();

const inventorySchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    inventory: z.object({
      tracked: z.boolean().nullable(),
      availabilityOverride: overrideSchema,
      balances: z.array(z.object({
        locationId: z.string(),
        locationCode: z.string(),
        locationName: z.string(),
        locationStatus: z.string(),
        countsForPublicCatalog: z.boolean(),
        onHand: z.number(),
        reserved: z.number(),
        available: z.number(),
        updatedAt: z.string(),
      })),
    }),
  }),
});

type Inventory = z.infer<
  typeof inventorySchema
>["data"]["inventory"];

interface Props {
  brandId: string;
  productId: string;
  onSaved: () => Promise<void>;
}

function readInventory(
  value: unknown,
  productId: string,
): Inventory {
  const product = inventorySchema.parse(value).data;

  if (product.id !== productId) {
    throw new Error("CORE devolvio otro producto.");
  }

  return product.inventory;
}

export default function ProductInventoryEditor({
  brandId,
  productId,
  onSaved,
}: Props) {
  const [snapshot, setSnapshot] = useState<Inventory | null>(null);
  const [tracked, setTracked] = useState("");
  const [override, setOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef(false);

  async function start() {
    if (pending.current) return;

    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const inventory = readInventory(
        await loadAdminProductDetail(brandId, productId),
        productId,
      );

      setTracked(inventory.tracked === null
        ? ""
        : String(inventory.tracked));

      setOverride(inventory.availabilityOverride ?? "");
      setSnapshot(inventory);
    } catch (cause) {
      setError(cause instanceof Error
        ? cause.message
        : "Inventario no disponible.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!snapshot || pending.current) return;

    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    let attempted = false;
    let confirmed = false;

    try {
      if (tracked !== "true" && tracked !== "false") {
        throw new Error("Define el seguimiento de inventario.");
      }

      const input = {
        tracked: tracked === "true",
        availabilityOverride: overrideSchema.parse(
          override || null,
        ) as AdminInventoryOverride,
      };

      if (
        input.tracked === snapshot.tracked &&
        input.availabilityOverride === snapshot.availabilityOverride
      ) {
        setMessage("No hay cambios de inventario.");
        return;
      }

      const current = readInventory(
        await loadAdminProductDetail(brandId, productId),
        productId,
      );

      if (
        current.tracked !== snapshot.tracked ||
        current.availabilityOverride !== snapshot.availabilityOverride
      ) {
        setSnapshot(null);
        throw new Error(
          "La politica de inventario cambio. Vuelve a abrir el editor.",
        );
      }

      attempted = true;

      const saved = readInventory(
        await updateAdminProductInventoryPolicy(
          brandId,
          productId,
          input,
        ),
        productId,
      );

      if (
        saved.tracked !== input.tracked ||
        saved.availabilityOverride !== input.availabilityOverride
      ) {
        throw new Error("CORE no confirmo la politica solicitada.");
      }

      confirmed = true;
      setSnapshot(null);
      setMessage("Politica de inventario confirmada por CORE TEST.");

      await onSaved();
    } catch (cause) {
      const detail = cause instanceof Error
        ? cause.message
        : "Error inesperado.";

      if (attempted) {
        setSnapshot(null);
        setError(confirmed
          ? `Guardado confirmado. Actualiza el listado. ${detail}`
          : `Resultado no confirmado. Reabre el editor. ${detail}`);
      } else {
        setError(detail);
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <section
      className="create-product-panel"
      aria-label="Inventario comercial"
    >
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {!snapshot ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void start()}
        >
          {busy ? "Cargando inventario..." : "Gestionar inventario"}
        </button>
      ) : (
        <form
          className="create-product-panel"
          onSubmit={save}
          aria-busy={busy}
        >
          <fieldset
            className="create-product-panel__section"
            disabled={busy}
          >
            <legend>Politica de inventario</legend>

            <div className="create-product-panel__grid">
              <label className="create-product-panel__field">
                Seguimiento de inventario
                <select
                  value={tracked}
                  required
                  onChange={event => setTracked(event.target.value)}
                >
                  <option value="">Sin configurar</option>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>

              <label className="create-product-panel__field">
                Disponibilidad comercial
                <select
                  value={override}
                  onChange={event => setOverride(event.target.value)}
                >
                  <option value="">Sin configuracion explicita</option>
                  <option value="AUTO">Automatica</option>
                  <option value="PREORDER">Preventa</option>
                  <option value="COMING_SOON">Proximamente</option>
                  <option value="OUT_OF_STOCK">Agotado</option>
                </select>
              </label>
            </div>
          </fieldset>

          <section className="create-product-panel__section">
            <h3>Existencias por ubicacion</h3>
            <p>Solo lectura. Cantidades reportadas por CORE.</p>

            {snapshot.balances.length === 0 ? (
              <p>Sin balances registrados en CORE.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table aria-label="Balances de inventario">
                  <thead>
                    <tr>
                      <th>Ubicacion</th>
                      <th>Fisico</th>
                      <th>Reservado</th>
                      <th>Disponible</th>
                    </tr>
                  </thead>

                  <tbody>
                    {snapshot.balances.map(balance => (
                      <tr key={balance.locationId}>
                        <td>
                          {balance.locationName}
                          <small>
                            {" - "}{balance.locationCode}
                            {" - "}{balance.locationStatus}
                            {balance.countsForPublicCatalog
                              ? " - Catalogo publico"
                              : " - No contabiliza para catalogo"}
                          </small>
                        </td>
                        <td>{balance.onHand}</td>
                        <td>{balance.reserved}</td>
                        <td>{balance.available}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="create-product-panel__actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setSnapshot(null);
                setError("");
                setMessage("");
              }}
            >
              Cancelar inventario
            </button>

            <button
              type="submit"
              disabled={busy || tracked === ""}
            >
              {busy
                ? "Guardando inventario..."
                : "Guardar politica"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}