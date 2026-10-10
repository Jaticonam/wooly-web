import { Check, Eye, ImageOff } from "lucide-react";
import type { Product } from "@/shared/types/product";

import { resolveProductAdminPresentation } from "@/modules/products-admin/presentation/ProductAdminPresentation";

import "./ProductAdminRow.css";

interface ProductAdminRowProps {
  product: Product;
  onSelect: () => void;
  onPublish?: (() => void) | undefined;
  publishing?: boolean | undefined;
  publishDisabled?: boolean | undefined;
  isSelected?: boolean;
  onToggleSelection?: (() => void) | undefined;
}

export default function ProductAdminRow({
  product,
  onSelect,
  onPublish,
  publishing,
  publishDisabled,
  isSelected = false,
  onToggleSelection,
}: ProductAdminRowProps) {
  const presentation = resolveProductAdminPresentation(product);

  return (
    <article className={isSelected ? "product-admin-row is-selected" : "product-admin-row"}>
      <div className="product-admin-row__selectionCell">
        {onToggleSelection ? (
          <button
            className="product-admin-row__selection"
            type="button"
            aria-pressed={isSelected}
            aria-label={
              isSelected
                ? `Quitar ${product.title} de la selección`
                : `Seleccionar ${product.title}`
            }
            onClick={onToggleSelection}
          >
            {isSelected ? <Check size={14} strokeWidth={2.4} aria-hidden="true" /> : null}
          </button>
        ) : null}
      </div>

      <div className="product-admin-row__identity">
        <div className="product-admin-row__image">
          {product.img ? (
            <img src={product.img} alt="" loading="lazy" />
          ) : (
            <ImageOff size={16} strokeWidth={1.8} aria-hidden="true" />
          )}
        </div>

        <div>
          <code>{product.code ?? "Sin código"}</code>
          <strong>{product.title}</strong>
        </div>
      </div>

      <span className="product-admin-row__category">{product.category}</span>

      <span className="product-admin-row__status">{presentation.statusLabel}</span>
      <strong className="product-admin-row__price">{presentation.unitPriceLabel}</strong>

      <span className={`product-admin-row__stock is-${presentation.stockTone}`}>
        {presentation.stockLabel}
      </span>

      <div className="product-admin-row__actions">
        <button
          className="product-admin-row__detail"
          type="button"
          aria-label={`Abrir ${product.title}`}
          onClick={onSelect}
        >
          <Eye size={15} aria-hidden="true" />
          Abrir
        </button>
        {onPublish && (
          <button
            className="product-admin-row__detail"
            type="button"
            aria-label={`Publicar ${product.title}`}
            disabled={publishDisabled || product.status === "publicado"}
            onClick={onPublish}
          >
            {product.status === "publicado" ? "Publicado" : publishing ? "Publicando…" : "Publicar"}
          </button>
        )}
      </div>
    </article>
  );
}
