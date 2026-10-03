import type { Product } from "@/shared/types/product";
import { getBaseUnitPrice } from "@/shared/domain/volumePricing/VolumePricing";

export type CatalogSortMode =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "name-asc";

const compareByName = (a: Product, b: Product) =>
  a.title.localeCompare(b.title, "es", {
    sensitivity: "base",
  });

const getSortablePrice = (product: Product): number | null => {
  const price = getBaseUnitPrice(product);

  return Number.isFinite(price) && price > 0
    ? price
    : null;
};

const comparePriceAsc = (a: Product, b: Product) => {
  const aPrice = getSortablePrice(a);
  const bPrice = getSortablePrice(b);

  if (aPrice === null && bPrice === null) return compareByName(a, b);
  if (aPrice === null) return 1;
  if (bPrice === null) return -1;

  return aPrice - bPrice || compareByName(a, b);
};

const comparePriceDesc = (a: Product, b: Product) => {
  const aPrice = getSortablePrice(a);
  const bPrice = getSortablePrice(b);

  if (aPrice === null && bPrice === null) return compareByName(a, b);
  if (aPrice === null) return 1;
  if (bPrice === null) return -1;

  return bPrice - aPrice || compareByName(a, b);
};

export function sortCatalogProducts(
  products: readonly Product[],
  mode: CatalogSortMode,
): Product[] {
  const items = [...products];

  switch (mode) {
    case "price-asc":
      return items.sort(comparePriceAsc);

    case "price-desc":
      return items.sort(comparePriceDesc);

    case "name-asc":
      return items.sort(compareByName);

    case "featured":
    default:
      return items;
  }
}
