import { useMemo } from "react";
import type { Product } from "@wooly/contracts/types/product";

const TOP_PRIORITY = 100;
const STRONG_PRIORITY = 80;
const HIGHLIGHT_PRIORITY = 50;

const getRotationSeed = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const block = now.getHours() < 12 ? "AM" : "PM";
  return `${year}-${month}-${day}-${block}`;
};

const seededShuffle = <T extends { id: string }>(items: T[], seed: string) => {
  const hash = (text: string) => {
    let h = 0;
    for (let i = 0; i < text.length; i++) {
      h = (h << 5) - h + text.charCodeAt(i);
      h |= 0;
    }
    return h;
  };

  return [...items].sort((a, b) => hash(seed + a.id) - hash(seed + b.id));
};

const sortByPriorityAndShuffleSameLevel = (items: Product[]) => {
  const seed = getRotationSeed();

  const groups = items.reduce<Record<number, Product[]>>((acc, product) => {
    const priority = product.priority || 0;
    (acc[priority] ||= []).push(product);
    return acc;
  }, {});

  return Object.keys(groups)
    .map(Number)
    .sort((a, b) => b - a)
    .flatMap((priority) => seededShuffle(groups[priority], seed));
};

interface Params {
  products: Product[];
  filteredProducts: Product[];
  activeCategory: string;
  activeCampaign: string;
  searchQuery: string;
}

export function useCatalogPrioritySections({
  products,
  filteredProducts,
  activeCategory,
  activeCampaign,
  searchQuery,
}: Params) {
  const showPriorityBlocks =
    activeCategory === "todas" && !activeCampaign && !searchQuery.trim();

  const topProducts = useMemo(
    () =>
      showPriorityBlocks
        ? sortByPriorityAndShuffleSameLevel(
            products.filter((p) => (p.priority || 0) >= TOP_PRIORITY),
          )
        : [],
    [products, showPriorityBlocks],
  );

  const strongProducts = useMemo(
    () =>
      showPriorityBlocks
        ? sortByPriorityAndShuffleSameLevel(
            products.filter((p) => {
              const priority = p.priority || 0;
              return priority >= STRONG_PRIORITY && priority < TOP_PRIORITY;
            }),
          )
        : [],
    [products, showPriorityBlocks],
  );

  const highlightProducts = useMemo(
    () =>
      showPriorityBlocks
        ? sortByPriorityAndShuffleSameLevel(
            products.filter((p) => {
              const priority = p.priority || 0;
              return (
                priority >= HIGHLIGHT_PRIORITY && priority < STRONG_PRIORITY
              );
            }),
          )
        : [],
    [products, showPriorityBlocks],
  );

  const regularProducts = useMemo(
    () =>
      sortByPriorityAndShuffleSameLevel(
        showPriorityBlocks
          ? filteredProducts.filter(
              (p) => (p.priority || 0) < HIGHLIGHT_PRIORITY,
            )
          : filteredProducts,
      ),
    [filteredProducts, showPriorityBlocks],
  );

  return {
    showPriorityBlocks,
    topProducts,
    strongProducts,
    highlightProducts,
    regularProducts,
  };
}
