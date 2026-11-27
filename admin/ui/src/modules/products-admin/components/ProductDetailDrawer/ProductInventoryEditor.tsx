import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { z } from "zod";

import {
  loadAdminProductDetail,
  loadBrandAdminConfiguration,
  updateAdminProductInventoryBalance,
  updateAdminProductInventoryPolicy,
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

const locationSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string(),
  status: z.string(),
  countsForPublicCatalog: z.boolean(),
});

type Inventory = z.infer<typeof inventorySchema>["data"]["inventory"];
type Balance = Inventory["balances"][number];
type Location = z.infer<typeof locationSchema>;

interface Session {
  inventory: Inventory;
  locations: Location[];
}

interface Props {
  brandId: string;
  productId: string;
  onSaved: () => Promise<void>;
}

function readInventory(value: unknown, productId: string): Inventory {
  const product = inventorySchema.parse(value).data;

  if (product.id !== productId) {
    throw new Error("CORE devolvio otro producto.");
  }

  return {
    ...product.inventory,
    availabilityOverride:
      product.inventory.availabilityOverride === "AUTO"
        ? null
        : product.inventory.availabilityOverride,
  };
}

async function getInventory(
  brandId: string,
  productId: string,
): Promise<Inventory> {
  return readInventory(
    await loadAdminProductDetail(brandId, productId),
    productId,
  );
}

async function getSession(
  brandId: string,
  productId: string,
): Promise<Session> {
  const [inventory, config] = await Promise.all([
    getInventory(brandId, productId),
    loadBrandAdminConfiguration(brandId),
  ]);

  if (!config.success || config.data.brandId !== brandId) {
    throw new Error("Configuracion de marca invalida.");
  }

  return {
    inventory,
    locations: z.array(locationSchema)
      .parse(config.data.inventoryLocations)
      .filter(item => item.status === "ACTIVE"),
  };
}

function samePolicy(a: Inventory, b: Inventory): boolean {
  return a.tracked === b.tracked &&
    a.availabilityOverride === b.availabilityOverride;
}

function sameBalance(
  a: Balance | undefined,
  b: Balance | undefined,
): boolean {
  if (!a || !b) return a === b;

  return a.locationId === b.locationId &&
    a.locationCode === b.locationCode &&
    a.onHand === b.onHand &&
    a.reserved === b.reserved &&
    a.updatedAt === b.updatedAt;
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Error inesperado.";
}

export default function ProductInventoryEditor({
  brandId,
  productId,
  onSaved,
}: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [tracked, setTracked] = useState("");
  const [override, setOverride] = useState("AUTO");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(true);
  const [needsReload, setNeedsReload] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef(false);

  const location = session?.locations.find(
    item => item.id === locationId,
  );

  const balance = session?.inventory.balances.find(
    item => item.locationId === locationId,
  );

  const stockDirty = Boolean(
    location &&
    quantity.trim() !== "" &&
    (!balance || Number(quantity) !== balance.onHand),
  );

  const requestedOverride = override === "AUTO"
    ? null
    : overrideSchema.parse(override);

  // Registrar existencias explicitamente implica seguimiento
  // cuando CORE aun no tiene una politica definida.
  const requestedTracked = tracked === ""
    ? (stockDirty || requestedOverride !== null ? true : null)
    : tracked === "true";

  const policyDirty = Boolean(
    session &&
    (
      requestedTracked !== session.inventory.tracked ||
      requestedOverride !== session.inventory.availabilityOverride
    ),
  );

  const dirty = stockDirty || policyDirty;

  const applySession = useCallback((
    next: Session,
    preferredLocation = "",
  ) => {
    const selected = next.locations.some(
      item => item.id === preferredLocation,
    )
      ? preferredLocation
      : next.locations.length === 1
        ? next.locations[0].id
        : "";

    const selectedBalance = next.inventory.balances.find(
      item => item.locationId === selected,
    );

    setSession(next);
    setTracked(next.inventory.tracked === null
      ? ""
      : String(next.inventory.tracked));
    setOverride(next.inventory.availabilityOverride ?? "AUTO");
    setLocationId(selected);
    setQuantity(selectedBalance ? String(selectedBalance.onHand) : "");
    setNeedsReload(false);
  }, []);

  const reload = useCallback(async (
    active: () => boolean = () => true,
  ) => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const next = await getSession(brandId, productId);

      if (active()) applySession(next);
    } catch (cause) {
      if (active()) {
        setNeedsReload(true);
        setError(errorMessage(cause));
      }
    } finally {
      if (active()) setBusy(false);
    }
  }, [brandId, productId, applySession]);

  useEffect(() => {
    let active = true;
    setSession(null);

    void reload(() => active);

    return () => {
      active = false;
    };
  }, [reload]);

  function selectLocation(id: string) {
    if (!session || stockDirty) return;

    const current = session.inventory.balances.find(
      item => item.locationId === id,
    );

    setLocationId(id);
    setQuantity(current ? String(current.onHand) : "");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || pending.current || needsReload || !dirty) return;

    setError("");
    setMessage("");

    if (policyDirty && requestedTracked === null) {
      setError("Define el seguimiento de inventario.");
      return;
    }

    if (requestedTracked === false && requestedOverride !== null) {
      setError("Activa el seguimiento para configurar esta disponibilidad.");
      return;
    }

    const onHand = Number(quantity);

    if (stockDirty && (
      !location ||
      !/^\d+$/.test(quantity.trim()) ||
      !Number.isInteger(onHand) ||
      onHand < (balance?.reserved ?? 0) ||
      onHand > 2147483647
    )) {
      setError("Introduce una cantidad entera no inferior a las reservas.");
      return;
    }

    pending.current = true;
    setBusy(true);

    const confirmed: string[] = [];
    let attempted = false;

    try {
      let current = await getInventory(brandId, productId);

      if (!samePolicy(current, session.inventory)) {
        throw new Error("La politica cambio. Recarga el inventario.");
      }

      if (stockDirty && !sameBalance(
        balance,
        current.balances.find(item => item.locationId === locationId),
      )) {
        throw new Error("Las existencias cambiaron. Recarga el inventario.");
      }

      if (policyDirty && requestedTracked !== null) {
        attempted = true;

        await updateAdminProductInventoryPolicy(
          brandId,
          productId,
          {
            tracked: requestedTracked,
            availabilityOverride: requestedOverride,
          },
        );

        current = await getInventory(brandId, productId);

        if (
          current.tracked !== requestedTracked ||
          current.availabilityOverride !== requestedOverride
        ) {
          throw new Error("CORE no confirmo la politica solicitada.");
        }

        confirmed.push("politica");
      }

      if (stockDirty && location) {
        const latest = current.balances.find(
          item => item.locationId === location.id,
        );

        if (!sameBalance(balance, latest)) {
          throw new Error("Las existencias cambiaron durante el guardado.");
        }

        attempted = true;

        await updateAdminProductInventoryBalance(
          brandId,
          productId,
          location.code,
          {
            onHand,
            expected: latest ? {
              onHand: latest.onHand,
              reserved: latest.reserved,
              updatedAt: latest.updatedAt,
            } : null,
          },
        );

        current = await getInventory(brandId, productId);

        const actual = current.balances.find(
          item => item.locationId === location.id,
        );

        const reserved = latest?.reserved ?? 0;

        if (
          !actual ||
          actual.locationCode !== location.code ||
          actual.onHand !== onHand ||
          actual.reserved !== reserved ||
          actual.available !== Math.max(0, onHand - reserved)
        ) {
          throw new Error("CORE no confirmo el saldo esperado.");
        }

        confirmed.push("existencias");
      }

      if (
        current.tracked !== requestedTracked ||
        current.availabilityOverride !== requestedOverride
      ) {
        throw new Error("La politica final no coincide con la solicitada.");
      }

      applySession({ ...session, inventory: current }, locationId);
      setMessage("Inventario confirmado por CORE TEST.");

      try {
        await onSaved();
      } catch (cause) {
        setError(
          `Inventario guardado. Actualiza el listado. ${errorMessage(cause)}`,
        );
      }
    } catch (cause) {
      setNeedsReload(true);

      const detail = errorMessage(cause);

      if (confirmed.length > 0) {
        setError(
          `Resultado parcial. Confirmado: ${confirmed.join(", ")}. ` +
          `${detail} Recarga antes de reintentar.`,
        );
      } else if (attempted) {
        setError(
          `Resultado no confirmado. ${detail} ` +
          "Recarga antes de reintentar.",
        );
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
      aria-label="Inventario"
    >
      <h3>Inventario</h3>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {busy && !session && <p>Cargando inventario...</p>}

      {needsReload && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void reload()}
        >
          Recargar inventario
        </button>
      )}

      {session && (
        <form
          className="create-product-panel"
          onSubmit={save}
          aria-busy={busy}
        >
          <fieldset
            className="create-product-panel__section"
            disabled={busy || needsReload}
          >
            <legend>Existencias</legend>

            {session.locations.length === 0 && (
              <p>No existen almacenes activos en CORE.</p>
            )}

            <div className="create-product-panel__grid">
              {session.locations.length > 1 && (
                <label className="create-product-panel__field">
                  Almacen
                  <select
                    value={locationId}
                    disabled={stockDirty}
                    onChange={event => selectLocation(event.target.value)}
                  >
                    <option value="">Seleccionar almacen</option>
                    {session.locations.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {location && (
                <>
                  {session.locations.length === 1 && (
                    <div>
                      <strong>Almacen: </strong>
                      {location.name}
                    </div>
                  )}

                  <label className="create-product-panel__field">
                    Existencias fisicas
                    <input
                      type="number"
                      min={balance?.reserved ?? 0}
                      max={2147483647}
                      step={1}
                      value={quantity}
                      onChange={event => setQuantity(event.target.value)}
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

            {session.inventory.tracked === null && stockDirty && (
              <p>Al registrar existencias se activara el seguimiento,
                salvo que lo desactives en la configuracion avanzada.</p>
            )}
          </fieldset>

          <fieldset
            className="create-product-panel__section"
            disabled={busy || needsReload}
          >
            <label className="create-product-panel__field">
              Disponibilidad comercial
              <select
                value={override}
                onChange={event => setOverride(event.target.value)}
              >
                <option value="AUTO">Automatica</option>
                <option value="PREORDER">Preventa</option>
                <option value="COMING_SOON">Proximamente</option>
                <option value="OUT_OF_STOCK">Agotado</option>
              </select>
            </label>

            <details>
              <summary>Configuracion avanzada</summary>

              <label className="create-product-panel__field">
                Seguimiento de inventario
                <select
                  value={tracked}
                  onChange={event => setTracked(event.target.value)}
                >
                  <option value="" disabled>Sin configurar</option>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
            </details>
          </fieldset>

          <div className="create-product-panel__actions">
            {dirty && !needsReload && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  applySession(session, locationId);
                  setError("");
                  setMessage("");
                }}
              >
                Descartar cambios
              </button>
            )}

            <button
              type="submit"
              disabled={busy || needsReload || !dirty}
            >
              {busy ? "Guardando inventario..." : "Guardar inventario"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}