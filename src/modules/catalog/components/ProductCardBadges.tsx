import type { Product } from "@/shared/types/product";

import {
  ProductBadgeStack,
} from "./ProductBadgeStack";

interface ProductCardBadgesProps {
  product: Product;
}

export function ProductCardBadges({
  product,
}: ProductCardBadgesProps) {
  return (
    <ProductBadgeStack
      product={product}
      maxVisible={2}
      includePricingBadges
      variant="card"
      className="card-product-badges absolute left-2 top-2 z-10 flex max-w-[78%] flex-col items-start gap-1.5"
    />
  );
}
