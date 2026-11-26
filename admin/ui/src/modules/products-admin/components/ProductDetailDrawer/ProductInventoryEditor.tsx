import { useRef, useState, type FormEvent } from "react";
import { z } from "zod";

import {
  loadAdminProductDetail,
  loadBrandAdminConfiguration,
  updateAdminProductInventoryBalance,
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

      <InventoryBalanceEditor
        brandId={brandId}
        productId={productId}
        onUpdated={async inventory => {
          setSnapshot(current => current
            ? { ...current, balances: inventory.balances }
            : current);
          await onSaved();
        }}
      />
    </section>
  );
}

const inventoryLocationSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string(),
  status: z.string(),
  countsForPublicCatalog: z.boolean(),
});

type InventoryLocation = z.infer<typeof inventoryLocationSchema>;

type BalanceSession = {
  inventory: Inventory;
  locations: InventoryLocation[];
};

function InventoryBalanceEditor({
  brandId,
  productId,
  onUpdated,
}: {
  brandId: string;
  productId: string;
  onUpdated: (inventory: Inventory) => Promise<void>;
}) {
  const [session, setSession] =
    useState<BalanceSession | null>(null);

  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef(false);

  const location = session?.locations.find(
    item => item.id === locationId,
  );

  const balance = session?.inventory.balances.find(
    item => item.locationId === locationId,
  );

  const reserved = balance?.reserved ?? 0;

  function selectLocation(
    id: string,
    inventory: Inventory,
  ) {
    setLocationId(id);

    const current = inventory.balances.find(
      item => item.locationId === id,
    );

    setQuantity(current ? String(current.onHand) : "");
  }

  async function start() {
    if (pending.current) return;

    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const [detail, config] = await Promise.all([
        loadAdminProductDetail(brandId, productId),
        loadBrandAdminConfiguration(brandId),
      ]);

      if (!config.success || config.data.brandId !== brandId) {
        throw new Error("Configuracion de marca invalida.");
      }

      const inventory = readInventory(detail, productId);

      const locations = z.array(inventoryLocationSchema)
        .parse(config.data.inventoryLocations)
        .filter(item => item.status === "ACTIVE");

      if (locations.length === 0) {
        throw new Error("No existen almacenes activos en CORE.");
      }

      setSession({ inventory, locations });

      selectLocation(
        locations.length === 1 ? locations[0].id : "",
        inventory,
      );

    } catch (cause) {
      setError(cause instanceof Error
        ? cause.message
        : "No se pudo cargar existencias.");

    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function save() {
    if (!session || !location || pending.current) return;

    setError("");
    setMessage("");

    const onHand = Number(quantity);

    if (
      !/^\d+$/.test(quantity.trim()) ||
      !Number.isInteger(onHand) ||
      onHand < reserved ||
      onHand > 2147483647
    ) {
      setError(
        "Introduce una cantidad entera no inferior a las reservas.",
      );
      return;
    }

    if (balance && balance.onHand === onHand) {
      setMessage("No hay cambios de existencias.");
      return;
    }

    pending.current = true;
    setBusy(true);

    let attempted = false;
    let confirmed = false;

    try {
      const expected = balance ? {
        onHand: balance.onHand,
        reserved: balance.reserved,
        updatedAt: balance.updatedAt,
      } : null;

      attempted = true;

      const response =
        await updateAdminProductInventoryBalance(
          brandId,
          productId,
          location.code,
          { onHand, expected },
        );

      const saved = readInventory(response, productId);

      const actual = saved.balances.find(
        item => item.locationId === location.id,
      );

      if (
        !actual ||
        actual.locationCode !== location.code ||
        actual.onHand !== onHand ||
        actual.reserved !== reserved ||
        actual.available !== Math.max(0, onHand - reserved)
      ) {
        throw new Error(
          "CORE no confirmo el saldo esperado.",
        );
      }

      confirmed = true;

      setSession({
        ...session,
        inventory: saved,
      });

      setQuantity(String(actual.onHand));
      setMessage("Existencias confirmadas por CORE TEST.");

      await onUpdated(saved);

    } catch (cause) {
      const detail = cause instanceof Error
        ? cause.message
        : "Error inesperado.";

      if (attempted) {
        setSession(null);

        setError(confirmed
          ? `Guardado confirmado. Recarga el listado. ${detail}`
          : `Resultado no confirmado. Consulta las existencias antes de reintentar. ${detail}`);
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
      className="create-product-panel__section"
      aria-label="Edicion de existencias"
    >
      <h3>Existencias comerciales</h3>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {!session ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void start()}
        >
          {busy ? "Consultando..." : "Editar existencias"}
        </button>
      ) : (
        <>
          <div className="create-product-panel__grid">
            <label className="create-product-panel__field">
              Almacen
              <select
                value={locationId}
                disabled={busy}
                onChange={event => selectLocation(
                  event.target.value,
                  session.inventory,
                )}
              >
                <option value="">Seleccionar almacen</option>

                {session.locations.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            {location && (
              <>
                <label className="create-product-panel__field">
                  Existencias fisicas
                  <input
                    type="number"
                    min={reserved}
                    max={2147483647}
                    step={1}
                    value={quantity}
                    disabled={busy}
                    onChange={event =>
                      setQuantity(event.target.value)}
                  />
                </label>

                <div>
                  <strong>Reservadas: </strong>
                  {balance ? balance.reserved : "Sin saldo"}
                </div>

                <div>
                  <strong>Disponibles en CORE: </strong>
                  {balance ? balance.available : "Sin saldo"}
                </div>
              </>
            )}
          </div>

          {location && !balance && (
            <p>Este almacen aun no tiene saldo registrado.</p>
          )}

          {location && !location.countsForPublicCatalog && (
            <p>Este almacen no contabiliza para el catalogo publico.</p>
          )}

          <div className="create-product-panel__actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setSession(null);
                setError("");
                setMessage("");
              }}
            >
              Cerrar existencias
            </button>

            <button
              type="button"
              disabled={
                busy ||
                !location ||
                quantity.trim() === ""
              }
              onClick={() => void save()}
            >
              {busy ? "Guardando..." : "Guardar existencias"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}