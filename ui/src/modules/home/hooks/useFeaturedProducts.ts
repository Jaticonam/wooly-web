import {
  useMemo,
  useState,
} from "react";

import {
  isProductPurchasable,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";
import {
  useProducts,
} from "@/modules/catalog/hooks/useProducts";
import type {
  Product,
} from "@wooly/contracts/types/product";

const HOME_MIN_PRIORITY = 80;
export const FEATURED_PRODUCTS_LIMIT = 8;

export function selectFeaturedProducts(
  products: Product[],
  random: () => number = Math.random,
): Product[] {
  return products
    .filter(
      (product) =>
        isProductPurchasable(product) &&
        (product.priority || 0) >=
          HOME_MIN_PRIORITY,
    )
    .map((product) => ({
      product,
      score:
        (product.priority || 0) * 10 +
        random() * 100,
    }))
    .sort(
      (a, b) => b.score - a.score,
    )
    .slice(0, FEATURED_PRODUCTS_LIMIT)
    .map((item) => item.product);
}

export function useFeaturedProducts() {
  const {
    data: products = [],
    isLoading: loading,
  } = useProducts();
  const [
    shuffleKey,
    setShuffleKey,
  ] = useState(0);

  const featuredProducts = useMemo(() => {
    void shuffleKey;
    return selectFeaturedProducts(
      products,
    );
  }, [products, shuffleKey]);

  return {
    featuredProducts,
    loading,
    reshuffle: () =>
      setShuffleKey(
        (value) => value + 1,
      ),
  };
}
