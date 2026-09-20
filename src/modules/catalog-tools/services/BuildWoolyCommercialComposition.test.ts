import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import type {
  Product,
} from "@/shared/types/product";

import {
  buildWoolyCommercialComposition,
} from "./BuildWoolyCommercialComposition";

const product = (
  id: string,
  category: string,
  status = "publicado",
): Product => ({
  id,
  title: id,
  description: `Producto ${id}`,
  category,
  price_1: 10,
  stock: 5,
  img: `/${id}.jpg`,
  status,
});

describe("buildWoolyCommercialComposition", () => {
  it("encadena selección V3 y contrato CORE sin publicar productos bloqueados", () => {
    const selection = createEmptyCatalogComposition("hybrid");

    selection.filters.categoryIds = ["flores"];
    selection.overrides.includedProductIds = ["PELU-001", "OCULTO-001"];

    const result = buildWoolyCommercialComposition({
      products: [
        product("FLOR-001", "flores"),
        product("PELU-001", "peluches"),
        product("OCULTO-001", "flores", "oculto"),
      ],
      selection,
      output: {
        compositionId: "catalog-001",
        version: 1,
        title: "Catálogo comercial",
        createdAt: "2026-09-20T15:00:00.000Z",
        sectionTitle: (categoryId) =>
          categoryId === "flores" ? "Flores" : "Peluches",
      },
    });

    expect(result.resolution.productIds).toEqual([
      "FLOR-001",
      "PELU-001",
    ]);
    expect(result.resolution.blockedIncludedProductIds).toEqual([
      "oculto-001",
    ]);
    expect(result.composition.items.map((item) => item.productId)).toEqual([
      "FLOR-001",
      "PELU-001",
    ]);
    expect(result.composition.sections.map((section) => section.title)).toEqual([
      "Flores",
      "Peluches",
    ]);
  });
});
