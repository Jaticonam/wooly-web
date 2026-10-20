import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
  type CatalogComposition,
} from "./CatalogComposition";

import {
  resolveCatalogComposition,
} from "./CatalogCompositionResolver";

import type {
  Product,
} from "../../types/product";

const products: Product[] = [
  {
    id: "FLOR-001",
    title: "Flor 1",
    description: "Flor",
    category: "flores",
    price_1: 10,
    stock: 10,
    img: "/flor-1.jpg",
    status: "publicado",
    campaigns: [
      "campana-a",
    ],
  },
  {
    id: "PELU-001",
    title: "Peluche 1",
    description: "Peluche",
    category: "peluches",
    price_1: 10,
    stock: 10,
    img: "/peluche-1.jpg",
    status: "publicado",
    campaigns: [
      "campana-b",
    ],
  },
];

const withCategory = (
  mode: CatalogComposition["mode"],
): CatalogComposition => {
  const base =
    createEmptyCatalogComposition(
      mode,
    );

  return {
    ...base,

    filters: {
      ...base.filters,

      categoryIds: [
        "flores",
      ],
    },
  };
};

describe(
  "CatalogComposition mode semantics",
  () => {
    it(
      "automatic usa los filtros como base",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              withCategory(
                "automatic",
              ),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
        ]);
      },
    );

    it(
      "hybrid conserva la misma base automática antes de overrides",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              withCategory(
                "hybrid",
              ),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
        ]);
      },
    );

    it(
      "manual no usa filtros como selección automática",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              withCategory(
                "manual",
              ),
          });

        expect(
          result.productIds,
        ).toEqual([]);

        expect(
          result.automaticProductIds,
        ).toEqual([]);
      },
    );
  },
);