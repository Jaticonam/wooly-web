import { loadAllProducts } from "@wooly/shared/catalog/services/fetchProducts";
import type { Product } from "@wooly/contracts/types/product";
import type { IntegrationSource } from "../../types/source";

export const CatalogSource: IntegrationSource<Product> = {
  key: "catalog",
  name: "Catalog",
  async load() {
    return await loadAllProducts();
  },
};
