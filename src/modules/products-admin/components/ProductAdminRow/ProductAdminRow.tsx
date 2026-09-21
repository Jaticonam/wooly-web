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
}

export default function ProductAdminRow({
  product,
  onSelect,
}: ProductAdminRowProps) {
  const presentation = resolveProductAdminPresentation(product);

  return (
    <article className="product-admin-row">
      <button
        className="product-admin-row__open"
        type="button"
        aria-label={`Ver detalle de ${product.title}`}
        onClick={onSelect}
      />
      <div className="product-admin-row__identity">
        <div className="product-admin-row__image">
          {product.img ? (
            <img src={product.img} alt="" loading="lazy" />
          ) : (
            <span aria-hidden="true">▧</span>
          )}
        </div>
        <div>
          <code>{product.id}</code>
          <strong>{product.title}</strong>
        </div>
      </div>

      <strong className="product-admin-row__price">{presentation.unitPriceLabel}</strong>
      <span className={`product-admin-row__stock is-${presentation.stockTone}`}>
        {presentation.stockLabel}
      </span>
      <span className="product-admin-row__category">{product.category}</span>
      <span className="product-admin-row__status">{presentation.statusLabel}</span>
    </article>
  );
}
