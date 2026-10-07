import { useRef, useState, type FormEvent } from "react";
import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";
import {
  jungCoreProductCreation,
  type CreatedCanonicalProduct,
  type ProductCreationOptions,
  type ProductCreationProvider,
} from "../../integrations/jungCore/JungCoreProductCreation";
import "./CreateProductPanel.css";

const quantities = [1, 3, 12, 50, 100] as const;

export default function CreateProductPanel({
  provider = jungCoreProductCreation,
}: {
  provider?: ProductCreationProvider;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ProductCreationOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedCanonicalProduct | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [prices, setPrices] = useState<Record<number, string>>({});
  const pending = useRef(false);
  const loadGeneration = useRef(0);

  async function loadOptions() {
    const generation = ++loadGeneration.current;
    setLoading(true);
    setError("");
    setOptions(null);
    try {
      const data = await provider.loadOptions();
      if (generation === loadGeneration.current) setOptions(data);
    } catch (cause) {
      if (generation === loadGeneration.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar las categorías de CORE.",
        );
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }

  function start() {
    setName("");
    setDescription("");
    setCategoryId("");
    setPrices({});
    setCreated(null);
    setOpen(true);
    void loadOptions();
  }
  function close() {
    if (pending.current) return;
    loadGeneration.current += 1;
    setOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !options) return;
    if (
      !name.trim() ||
      !options.categories.some((category) => category.id === categoryId)
    ) {
      setError("Ingresa un nombre y selecciona una categoría de CORE.");
      return;
    }
    const tiers = quantities
      .filter((quantity) => prices[quantity]?.trim())
      .map((minimumQuantity) => ({
        minimumQuantity,
        unitPrice: Number(prices[minimumQuantity]),
      }));
    if (
      tiers.length &&
      (!tiers.some((tier) => tier.minimumQuantity === 1) ||
        tiers.some(
          (tier) => !Number.isFinite(tier.unitPrice) || tier.unitPrice <= 0,
        ))
    ) {
      setError(
        "Los precios deben ser positivos e incluir el precio por 1 unidad.",
      );
      return;
    }
    pending.current = true;
    setSubmitting(true);
    setError("");
    try {
      setCreated(
        await provider.create({
          name,
          description,
          brandId: options.id,
          categoryId,
          ...(tiers.length ? { tiers } : {}),
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo crear el producto.",
      );
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="products-admin-page__syncButton"
        onClick={start}
      >
        + Crear producto
      </button>
      {open && (
        <AdminModal open title="Crear producto" size="compact" onClose={close}>
          {created ? (
            <div className="create-product-panel" role="status">
              <h3>Producto creado correctamente</h3>
              <p>{created.name}</p>
              <p>
                SKU: <strong>{created.sku}</strong>
              </p>
              <p>Estado: {created.status}</p>
              <p>
                Disponible para el próximo Rebase a Google Sheets. El listado se
                actualizará al proyectar y cargar el catálogo.
              </p>
              <button type="button" onClick={close}>
                Cerrar
              </button>
            </div>
          ) : (
            <form
              className="create-product-panel"
              onSubmit={(event) => void submit(event)}
              aria-busy={loading || submitting}
            >
              {loading && (
                <p role="status">
                  Cargando categorías y configuración de CORE...
                </p>
              )}
              {error && <p role="alert">{error}</p>}
              {!loading && !options && (
                <button type="button" onClick={() => void loadOptions()}>
                  Reintentar carga
                </button>
              )}
              <fieldset disabled={loading || submitting || !options}>
                <legend>
                  Información{options ? " · " + options.name : ""}
                </legend>
                <label htmlFor="create-product-name">Nombre</label>
                <input
                  id="create-product-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />
                <label htmlFor="create-product-description">Descripción</label>
                <textarea
                  id="create-product-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                />
                <label htmlFor="create-product-category">Categoría</label>
                <select
                  id="create-product-category"
                  required
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">Selecciona una categoría</option>
                  {options?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {options && !options.categories.length && (
                  <p role="status">
                    CORE no tiene categorías activas disponibles para esta
                    marca.
                  </p>
                )}
              </fieldset>
              <fieldset
                disabled={
                  loading ||
                  submitting ||
                  !options ||
                  options.priceLists.length !== 1
                }
              >
                <legend>Comercial</legend>
                {options?.priceLists.length === 1 ? (
                  <>
                    <p>
                      Precios unitarios opcionales en{" "}
                      {options.priceLists[0].currency} ·{" "}
                      {options.priceLists[0].name}. Si ingresas precios, incluye
                      1 unidad.
                    </p>
                    <div className="create-product-panel__prices">
                      {quantities.map((quantity) => (
                        <label key={quantity}>
                          {quantity === 1 ? "1 unidad" : quantity + " unidades"}
                          <input
                            type="number"
                            min="0.01"
                            max="9999999999.99"
                            step="0.01"
                            value={prices[quantity] ?? ""}
                            onChange={(event) =>
                              setPrices((current) => ({
                                ...current,
                                [quantity]: event.target.value,
                              }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <p>
                    Los precios se habilitan cuando CORE tiene una única lista
                    predeterminada activa.
                  </p>
                )}
              </fieldset>
              <p>
                Inventario: el stock se administra por ubicación después del
                alta.
              </p>
              <p>SKU: Se generará automáticamente por JUNG CORE</p>
              <div className="create-product-panel__actions">
                <button type="button" disabled={submitting} onClick={close}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    loading || submitting || !options?.categories.length
                  }
                >
                  {submitting ? "Creando producto..." : "Crear producto"}
                </button>
              </div>
            </form>
          )}
        </AdminModal>
      )}
    </>
  );
}
