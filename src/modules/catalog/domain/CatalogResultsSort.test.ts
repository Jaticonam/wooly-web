import { describe, expect, it } from "vitest";

import type { Product } from "@/shared/types/product";
import {
  sortCatalogProducts,
  type CatalogSortMode,
} from "@/modules/catalog/domain/CatalogResultsSort";

const product = (
  id: string,
  title: string,
  price: number,
  offer?: number | null,
): Product => ({
  id,
  title,
  description: "",
  category: "flores",
  price_1: price,
  price_offer: offer,
  stock: 10,
  img: "/test.jpg",
  status: "publicado",
});

describe("CatalogResultsSort", () => {
  const items = [
    product("b", "Rosa B", 20),
    product("a", "Rosa A", 10),
    product("c", "Rosa C", 30, 5),
  ];

  it("preserva el orden recibido para Destacados", () => {
    expect(
      sortCatalogProducts(items, "featured"),
    ).toEqual(items);
  });

  it("ordena por precio efectivo ascendente y respeta oferta", () => {
    expect(
      sortCatalogProducts(items, "price-asc").map((item) => item.id),
    ).toEqual(["c", "a", "b"]);
  });

  it("ordena por precio efectivo descendente", () => {
    expect(
      sortCatalogProducts(items, "price-desc").map((item) => item.id),
    ).toEqual(["b", "a", "c"]);
  });

  it("ordena alfabéticamente", () => {
    const mode: CatalogSortMode = "name-asc";

    expect(
      sortCatalogProducts(items, mode).map((item) => item.id),
    ).toEqual(["a", "b", "c"]);
  });
});
