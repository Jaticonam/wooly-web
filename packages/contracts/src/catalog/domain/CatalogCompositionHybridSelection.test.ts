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

const product = ({
  id,
  category,
  status = "publicado",
}: {
  id: string;
  category: string;
  status?: string;
}): Product => ({
  id,
  title: id,
  description: `Producto ${id}`,
  category,
  price_1: 10,
  stock: 10,
  img: `/${id}.jpg`,
  status,
});

const products: Product[] = [
  product({
    id: "FLOR-001",
    category: "flores",
  }),

  product({
    id: "FLOR-002",
    category: "flores",
  }),

  product({
    id: "PELU-001",
    category: "peluches",
  }),

  product({
    id: "OCULTO-001",
    category: "peluches",
    status: "oculto",
  }),
];

const hybridComposition = ({
  includedProductIds = [],
  excludedProductIds = [],
}: {
  includedProductIds?: readonly string[];
  excludedProductIds?: readonly string[];
} = {}): CatalogComposition => {
  const base =
    createEmptyCatalogComposition(
      "hybrid",
    );

  return {
    ...base,

    filters: {
      ...base.filters,

      categoryIds: [
        "flores",
      ],
    },

    overrides: {
      includedProductIds,
      excludedProductIds,
    },
  };
};

describe(
  "CatalogComposition hybrid selection",
  () => {
    it(
      "parte de la seleccion automatica",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              hybridComposition(),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
          "FLOR-002",
        ]);
      },
    );

    it(
      "permite excluir un producto de la base",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              hybridComposition({
                excludedProductIds: [
                  "FLOR-001",
                ],
              }),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-002",
        ]);
      },
    );

    it(
      "permite agregar un producto fuera de la base",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              hybridComposition({
                includedProductIds: [
                  "PELU-001",
                ],
              }),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
          "FLOR-002",
          "PELU-001",
        ]);
      },
    );

    it(
      "la inclusion gana sobre la exclusion",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              hybridComposition({
                includedProductIds: [
                  "FLOR-001",
                ],

                excludedProductIds: [
                  "FLOR-001",
                ],
              }),
          });

        expect(
          result.productIds,
        ).toContain(
          "FLOR-001",
        );
      },
    );

    it(
      "la inclusion manual no recupera productos ocultos",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              hybridComposition({
                includedProductIds: [
                  "OCULTO-001",
                ],
              }),
          });

        expect(
          result.productIds,
        ).not.toContain(
          "OCULTO-001",
        );

        expect(
          result.blockedIncludedProductIds,
        ).toEqual([
          "oculto-001",
        ]);

        expect(
          result.isFullyResolved,
        ).toBe(
          false,
        );
      },
    );
  },
);