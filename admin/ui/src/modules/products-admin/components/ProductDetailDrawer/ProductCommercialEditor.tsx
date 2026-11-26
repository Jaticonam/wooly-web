import ProductMerchandisingEditor from "./ProductMerchandisingEditor";
import { useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import ProductTierPriceEditor from "./ProductTierPriceEditor";
import ProductInventoryEditor from "./ProductInventoryEditor";
import { ProductIdentityFields } from "../CreateProductPanel/ProductCommercialFields";
import {
  loadAdminProductDetail,
  loadBrandAdminConfiguration,
  updateAdminProduct,
  type UpdateAdminProductInput,
} from "@/modules/admin-auth/services/AdminAuthClient";
import "../CreateProductPanel/CreateProductPanel.css";

const responseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    code: z.string().nullable(),
    name: z.string(),
    description: z.string().nullable(),
    category: z.object({
      id: z.string(),
      name: z.string(),
    }).nullable(),
    status: z.string(),
    updatedAt: z.string(),
  }),
});

type Detail = z.infer<typeof responseSchema>["data"];
type Category = { id: string; name: string };

interface Props {
  brandId: string;
  productId: string;
  onSaved: () => Promise<void>;
}

function readProduct(value: unknown, productId: string): Detail {
  const product = responseSchema.parse(value).data;

  if (product.id !== productId) {
    throw new Error("CORE devolvio otro producto.");
  }

  return product;
}

const normalizeName = (name: string) =>
  name.trim().replace(/\s+/g, " ");

export default function ProductCommercialEditor({
  brandId,
  productId,
  onSaved,
}: Props) {
  const [original, setOriginal] = useState<Detail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
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
      const [response, configuration] = await Promise.all([
        loadAdminProductDetail(brandId, productId),
        loadBrandAdminConfiguration(brandId),
      ]);

      const product = readProduct(response, productId);

      if (
        !configuration.success ||
        configuration.data.brandId !== brandId
      ) {
        throw new Error("Configuracion de marca incorrecta.");
      }

      const available = configuration.data.categories
        .filter(category => category.status === "ACTIVE")
        .map(category => ({
          id: category.id,
          name: category.name,
        }));

      if (
        product.category &&
        !available.some(item => item.id === product.category?.id)
      ) {
        available.push(product.category);
      }

      setCategories(available);
      setName(product.name);
      setDescription(product.description ?? "");
      setCategoryId(product.category?.id ?? "");
      setOriginal(product);

    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Error de lectura."
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!original || pending.current) return;

    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    let attempted = false;
    let confirmed = false;

    try {
      const update: UpdateAdminProductInput = {};
      const nextName = normalizeName(name);
      const nextDescription = description.trim() || null;

      if (nextName.length < 2 || nextName.length > 160) {
        throw new Error("El nombre debe tener entre 2 y 160 caracteres.");
      }

      if ((nextDescription?.length ?? 0) > 4000) {
        throw new Error("La descripcion supera los 4000 caracteres.");
      }

      if (nextName !== normalizeName(original.name)) {
        update.name = nextName;
      }

      if (nextDescription !== (original.description?.trim() || null)) {
        update.description = nextDescription;
      }

      if (categoryId !== (original.category?.id ?? "")) {
        if (!categories.some(category => category.id === categoryId)) {
          throw new Error("Selecciona una categoria autorizada.");
        }
        update.categoryId = categoryId;
      }

      if (Object.keys(update).length === 0) {
        setMessage("No hay cambios para guardar.");
        return;
      }

      const current = readProduct(
        await loadAdminProductDetail(brandId, productId),
        productId,
      );

      if (
        current.updatedAt !== original.updatedAt ||
        current.name !== original.name ||
        current.description !== original.description ||
        current.category?.id !== original.category?.id ||
        current.code !== original.code ||
        current.status !== original.status
      ) {
        setOriginal(null);
        throw new Error(
          "El producto cambio. Vuelve a abrir el editor."
        );
      }

      attempted = true;

      const saved = readProduct(
        await updateAdminProduct(brandId, productId, update),
        productId,
      );

      if (
        saved.code !== original.code ||
        saved.status !== original.status ||
        (update.name !== undefined && saved.name !== update.name) ||
        (update.description !== undefined &&
          saved.description !== update.description) ||
        (update.categoryId !== undefined &&
          saved.category?.id !== update.categoryId)
      ) {
        throw new Error("CORE no confirmo todos los cambios.");
      }

      confirmed = true;
      setOriginal(null);
      setMessage("Cambios confirmados por JUNG CORE TEST.");

      await onSaved();

    } catch (cause) {
      const detail = cause instanceof Error
        ? cause.message
        : "Error inesperado.";

      if (attempted) {
        setOriginal(null);
        setError(confirmed
          ? `Guardado confirmado. Actualiza el listado. ${detail}`
          : `Resultado no confirmado. Reabre el editor antes de reintentar. ${detail}`
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
      aria-label="Edicion comercial"
    >
      {error && (
        <p role="alert" className="create-product-panel__error">
          {error}
        </p>
      )}

      {message && <p role="status">{message}</p>}

      {!original ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void start()}
        >
          {busy ? "Cargando..." : "Editar producto"}
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
            <legend>Informacion comercial</legend>

            <p>
              Codigo: <strong>{original.code ?? "Sin codigo"}</strong>
              {" - Solo lectura"}
            </p>

            <div className="create-product-panel__grid">
              <ProductIdentityFields
                idPrefix="edit-product"
                categories={categories}
                categoryId={categoryId}
                name={name}
                description={description}
                setCategoryId={setCategoryId}
                setName={setName}
                setDescription={setDescription}
                autoFocus
              />
            </div>
          </fieldset>

          <div className="create-product-panel__actions">
            <span className="create-product-panel__actionsNote">
              Edicion exclusiva de CORE TEST.
            </span>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOriginal(null);
                setError("");
                setMessage("");
              }}
            >
              Cancelar
            </button>

            <button type="submit" disabled={busy}>
              {busy ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      )}
      <ProductTierPriceEditor
        brandId={brandId}
        productId={productId}
        onSaved={onSaved}
      />
      <ProductMerchandisingEditor
          brandId={brandId}
          productId={productId}
          onSaved={onSaved}
        />
        <ProductInventoryEditor
        brandId={brandId}
        productId={productId}
        onSaved={onSaved}
      />
    </section>
  );
}