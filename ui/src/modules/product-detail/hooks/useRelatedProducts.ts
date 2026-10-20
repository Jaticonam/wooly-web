import { useMemo } from "react";

import type { Product } from "@wooly/contracts/types/product";

export function useRelatedProducts(
  products: readonly Product[],
  product: Product | null | undefined,
): Product[] {
  return useMemo(() => {
    if (!product) return [];

    const sameCategory = products.filter(
      (item) =>
        item.category === product.category &&
        item.id !== product.id,
    );

    const otherCategories = products.filter(
      (item) =>
        item.category !== product.category &&
        item.id !== product.id,
    );

    return [
      ...sameCategory.slice(0, 4),
      ...otherCategories.slice(0, 4),
    ];
  }, [products, product]);
}