import type { Product } from "@wooly/contracts/types/product";

export function getSuggestions(products: Product[], value: string) {
  const term = value.trim().toLowerCase();

  if (!term) return [];

  return products
    .filter((product) => {
      const title = product.title?.toLowerCase() ?? "";
      const id = product.id?.toLowerCase() ?? "";
      const category = product.category?.toLowerCase() ?? "";

      return (
        title.includes(term) ||
        id.includes(term) ||
        category.includes(term)
      );
    })
    .slice(0, 5);
}
