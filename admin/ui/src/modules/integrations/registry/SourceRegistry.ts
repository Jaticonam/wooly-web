import type { IntegrationSource } from "../types/source";
import { CatalogSource } from "../sources/catalog/source";
import type {
  Product,
} from "@wooly/contracts/types/product";

class Registry {
  private sources:
    IntegrationSource<Product>[] = [];

  register(
    source:
      IntegrationSource<Product>,
  ) {
    const exists = this.sources.some((item) => item.key === source.key);
    if (!exists) this.sources.push(source);
  }

  getAll() {
    return [
      ...this.sources,
    ];
  }

  getByKey(key: string) {
    return this.sources.find((source) => source.key === key);
  }
}

export const SourceRegistry = new Registry();

SourceRegistry.register(CatalogSource);
