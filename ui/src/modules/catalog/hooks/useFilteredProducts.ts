import { useMemo } from "react";
import { searchProducts } from "@/utils/search";
import type { Product } from "@wooly/contracts/types/product";

interface UseFilteredProductsParams {
  products: Product[];
  activeCategory?: string;
  activeCampaign?: string;
  searchQuery?: string;
}

export function useFilteredProducts({
  products,
  activeCategory = "todas",
  activeCampaign = "",
  searchQuery = "",
}: UseFilteredProductsParams) {
  return useMemo(() => {
    const term = searchQuery.trim();

    let filtered = products;

    if (activeCategory !== "todas") {
      filtered = filtered.filter(
        (product) => product.category === activeCategory,
      );
    }

    if (activeCampaign) {
      filtered = filtered.filter((product) =>
        product.campaigns?.includes(activeCampaign),
      );
    }

    if (!term) return filtered;

    const insideFilters = searchProducts(filtered, term);

    return insideFilters.length
      ? insideFilters
      : searchProducts(products, term);
  }, [products, activeCategory, activeCampaign, searchQuery]);
}
