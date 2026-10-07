import {
  Check,
  ImageOff,
} from "lucide-react";
import type {
  Product,
} from "@/shared/types/product";

import {
  resolveProductAdminPresentation,
} from "@/modules/products-admin/presentation/ProductAdminPresentation";

import "./ProductAdminRow.css";

interface ProductAdminRowProps {
  product: Product;
  onSelect: () => void;
  isSelected?: boolean;
  onToggleSelection?: (() => void) | undefined;
}

export default function ProductAdminRow({
  product,
  onSelect,
  isSelected = false,
  onToggleSelection,
}: ProductAdminRowProps) {
  const presentation =
    resolveProductAdminPresentation(product);

  return (
    <article
      className={
        isSelected
          ? "product-admin-row is-selected"
          : "product-admin-row"
      }
    >
      <button
        className="product-admin-row__open"
        type="button"
        aria-label={`Ver detalle de ${product.title}`}
        onClick={onSelect}
      />

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
            {isSelected ? (
              <Check
                size={14}
                strokeWidth={2.4}
                aria-hidden="true"
              />
            ) : null}
          </button>
        ) : null}
      </div>

      <div className="product-admin-row__identity">
        <div className="product-admin-row__image">
          {product.img ? (
            <img
              src={product.img}
              alt=""
              loading="lazy"
            />
          ) : (
            <ImageOff
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          )}
        </div>

        <div>
          <code>{product.sku ?? product.id}</code>
          <strong>{product.title}</strong>
        </div>
      </div>

      <strong className="product-admin-row__price">
        {presentation.unitPriceLabel}
      </strong>

      <span
        className={
          `product-admin-row__stock is-${presentation.stockTone}`
        }
      >
        {presentation.stockLabel}
      </span>

      <span className="product-admin-row__category">
        {product.category}
      </span>

      <span className="product-admin-row__status">
        {presentation.statusLabel}
      </span>
    </article>
  );
}