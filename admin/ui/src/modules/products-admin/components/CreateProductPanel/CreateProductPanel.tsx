import { useRef, useState, type FormEvent } from "react";
import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";
import ProductCodeImageMatches from "./ProductCodeImageMatches";
import {
  jungCoreProductCreation,
  type CreatedCanonicalProduct,
  type ProductCreationOptions,
  type ProductCreationProvider,
} from "../../integrations/jungCore/JungCoreProductCreation";
import "./CreateProductPanel.css";

import {
  quantities,
  ProductIdentityFields,
  ProductPriceFields,
} from "./ProductCommercialFields";

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
  const [code, setCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [sunatCode, setSunatCode] = useState("");
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
    setCode(""); setBarcode(""); setSunatCode("");
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
      !code.trim() || !name.trim() ||
      !options.categories.some((category) => category.id === categoryId)
    ) {
      setError("Ingresa un código, un nombre y selecciona una categoría de CORE.");
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
          code, barcode, sunatCode,
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
        <AdminModal
          open
          title="Crear producto"
          description="Registra un nuevo producto comercial de Wooly."
          size="drawer-wide"
          onClose={close}
        >
          {created ? (
            <div className="create-product-panel create-product-panel--success" role="status">
              <div className="create-product-panel__successIcon" aria-hidden="true">✓</div>
              <h3>Producto creado correctamente</h3>
              <p>{created.name}</p>
              <p>Código: <strong>{created.code}</strong></p>
              <p>Estado: {created.status}</p>
              <p>
                Disponible para el próximo Rebase a Google Sheets. El listado se
                actualizará al proyectar y cargar el catálogo.
              </p>
              <div className="create-product-panel__actions">
                <button type="button" onClick={close}>Cerrar</button>
              </div>
            </div>
          ) : (
            <form
              className="create-product-panel"
              onSubmit={(event) => void submit(event)}
              aria-busy={loading || submitting}
            >
              <div className="create-product-panel__intro">
                <div>
                  <span className="create-product-panel__eyebrow">ALTA DE PRODUCTO</span>
                  <h3>Información comercial</h3>
                  <p>Completa los datos de identificación y los precios disponibles en JUNG CORE.</p>
                </div>
                <span className="create-product-panel__draft">Borrador</span>
              </div>
              {loading && (
                <p role="status" className="create-product-panel__notice">
                  Cargando categorías y configuración de CORE...
                </p>
              )}
              {error && <p role="alert" className="create-product-panel__error">{error}</p>}
              {!loading && !options && (
                <button type="button" onClick={() => void loadOptions()}>
                  Reintentar carga
                </button>
              )}

              <fieldset
                className="create-product-panel__section"
                disabled={loading || submitting || !options}
              >
                <legend>1. Identificación del producto</legend>
                <div className="create-product-panel__grid">
                  <div className="create-product-panel__field">
                    <label htmlFor="create-product-code">Código</label>
                    <input id="create-product-code" required value={code}
                      placeholder="Ej. OSO20CM"
                      onChange={(event) => setCode(event.target.value)} />
                    <ProductCodeImageMatches code={code} />
                  </div>
                  <ProductIdentityFields
                    idPrefix="create-product"
                    categories={options?.categories ?? []}
                    categoryId={categoryId}
                    name={name}
                    description={description}
                    setCategoryId={setCategoryId}
                    setName={setName}
                    setDescription={setDescription}
                    autoFocus
                  />
                </div>
                {options && !options.categories.length && (
                  <p role="status">
                    CORE no tiene categorías activas disponibles para esta marca.
                  </p>
                )}
              </fieldset>

              <fieldset
                className="create-product-panel__section"
                disabled={loading || submitting || !options || options.priceLists.length !== 1}
              >
                <legend>2. Precios comerciales</legend>
                {options?.priceLists.length === 1 ? (
                  <>
                    <p className="create-product-panel__sectionHelp">
                      Precios unitarios opcionales en {options.priceLists[0].currency} ·{" "}
                      {options.priceLists[0].name}. Si ingresas precios, incluye 1 unidad.
                    </p>
                    <ProductPriceFields
                      currency={options.priceLists[0].currency}
                      prices={prices}
                      setPrices={setPrices}
                    />
                  </>
                ) : (
                  <p className="create-product-panel__sectionHelp">
                    Los precios se habilitan cuando CORE tiene una única lista
                    predeterminada activa.
                  </p>
                )}
              </fieldset>

              <fieldset
                className="create-product-panel__section"
                disabled={loading || submitting || !options}
              >
                <legend>3. Identificación adicional</legend>
                <div className="create-product-panel__grid">
                  <div className="create-product-panel__field">
                    <label htmlFor="create-product-barcode">Código de barras</label>
                    <input id="create-product-barcode" value={barcode}
                      placeholder="Opcional"
                      onChange={(event) => setBarcode(event.target.value)} />
                  </div>
                  <div className="create-product-panel__field">
                    <label htmlFor="create-product-sunat">Código SUNAT</label>
                    <input id="create-product-sunat" value={sunatCode}
                      placeholder="Opcional"
                      onChange={(event) => setSunatCode(event.target.value)} />
                  </div>
                </div>
                <p className="create-product-panel__sectionHelp">
                  El código es obligatorio. Código de barras y Código SUNAT son opcionales.
                </p>
              </fieldset>

              <div className="create-product-panel__inventoryNote">
                <strong>Inventario</strong>
                <p>Inventario: el stock se administra por ubicación después del alta.</p>
              </div>

              <div className="create-product-panel__actions">
                <span className="create-product-panel__actionsNote">
                  El producto se registra como borrador.
                </span>
                <button type="button" disabled={submitting} onClick={close}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || submitting || !options?.categories.length}
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
