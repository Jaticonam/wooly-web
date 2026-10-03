import type { Product } from "@/shared/types/product";

import {
  getBaseUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

interface ProductCardPriceProps {
  product: Product;
  isPreventa?: boolean;
}

export function ProductCardPrice({
  product,
  isPreventa = false,
}: ProductCardPriceProps) {
  const finalPrice =
    getBaseUnitPrice(
      product,
    );

  const hasOffer =
    Number.isFinite(
      product.price_1,
    ) &&
    product.price_1 > 0 &&
    finalPrice !==
      product.price_1;

  if (isPreventa) {
    return (
      <div className="card-product-price is-preorder">
        <span>Próximamente</span>
        <strong>Consultar</strong>
      </div>
    );
  }

  return (
    <div className="card-product-price">
      <span className="card-product-currency">S/</span>

      <strong
        className={hasOffer ? "is-offer" : ""}
      >
        {finalPrice.toFixed(1)}
      </strong>

      {hasOffer && (
        <del>
          S/{product.price_1.toFixed(1)}
        </del>
      )}
    </div>
  );
}
