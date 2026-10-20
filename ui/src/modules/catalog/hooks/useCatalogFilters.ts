import { useMemo } from "react";
import type { Product, Category } from "@wooly/contracts/types/product";
import { CATEGORY_CONFIG } from "@wooly/shared/catalog/config/categories";
import { useFilteredProducts } from "@/modules/catalog/hooks/useFilteredProducts";

interface Params {
  products: Product[];
  activeCategory: string;
  activeCampaign: string;
  searchQuery: string;
  showCounts?: boolean;
}

export function useCatalogFilters({
  products,
  activeCategory,
  activeCampaign,
  searchQuery,
  showCounts = false,
}: Params) {
  const filteredProducts = useFilteredProducts({
    products,
    activeCategory,
    activeCampaign,
    searchQuery,
  });

  const hasCategory = activeCategory !== "todas";
  const hasCampaign = Boolean(activeCampaign);

  const categoryBase = useMemo(
    () =>
      hasCampaign
        ? products.filter((p) => p.campaigns?.includes(activeCampaign))
        : products,
    [products, hasCampaign, activeCampaign],
  );

  const campaignBase = useMemo(
    () =>
      hasCategory
        ? products.filter((p) => p.category === activeCategory)
        : products,
    [products, hasCategory, activeCategory],
  );

  const categoryCounts = useMemo(() => {
    const counts = categoryBase.reduce<Record<string, number>>(
      (acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      },
      {},
    );

    counts.todas = categoryBase.length;

    return counts;
  }, [categoryBase]);

  const campaignCounts = useMemo(() => {
    return campaignBase.reduce<Record<string, number>>((acc, product) => {
      product.campaigns?.forEach((campaign) => {
        acc[campaign] = (acc[campaign] || 0) + 1;
      });

      return acc;
    }, {});
  }, [campaignBase]);

  const visibleCategories = useMemo<Category[]>(
    () =>
      showCounts
        ? CATEGORY_CONFIG.filter(
            (c) => c.id === "todas" || (categoryCounts[c.id] || 0) > 0,
          )
        : CATEGORY_CONFIG,
    [categoryCounts, showCounts],
  );

  return {
    filteredProducts,
    categoryCounts,
    campaignCounts,
    visibleCategories,
    hasCategory,
    hasCampaign,
  };
}
