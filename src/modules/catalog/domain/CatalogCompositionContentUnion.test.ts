import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
  sanitizeCatalogComposition,
  type CatalogComposition,
} from "./CatalogComposition";

import {
  resolveCatalogComposition,
} from "./CatalogCompositionResolver";

import type {
  Product,
} from "@/shared/types/product";

const product = ({
  id,
  category,
  campaigns = [],
  status = "publicado",
}: {
  id: string;
  category: string;
  campaigns?: string[];
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
  campaigns,
});

const products: Product[] = [
  product({
    id: "FLOR-001",
    category: "flores",
    campaigns: [
      "madre",
    ],
  }),

  product({
    id: "FLOR-002",
    category: "flores",
    campaigns: [
      "cyber",
    ],
  }),

  product({
    id: "PELU-001",
    category: "peluches",
    campaigns: [
      "cyber",
    ],
  }),

  product({
    id: "CAJA-001",
    category: "cajas",
  }),

  product({
    id: "OCULTO-001",
    category: "flores",
    campaigns: [
      "cyber",
    ],
    status: "oculto",
  }),
];

const createUnionComposition = ({
  mode = "automatic",
  categoryIds = [],
  campaignIds = [],
  includedProductIds = [],
}: {
  mode?:
    CatalogComposition["mode"];
  categoryIds?: readonly string[];
  campaignIds?: readonly string[];
  includedProductIds?: readonly string[];
} = {}): CatalogComposition => {
  const base =
    createEmptyCatalogComposition(
      mode,
    );

  return {
    ...base,

    filters: {
      ...base.filters,

      sourceOperator:
        "union",

      categoryIds,
      campaignIds,
    },

    overrides: {
      ...base.overrides,

      includedProductIds,
    },
  };
};

describe(
  "CatalogComposition content sources",
  () => {
    it(
      "mantiene intersection como fallback para borradores antiguos",
      () => {
        const sanitized =
          sanitizeCatalogComposition({
            mode:
              "automatic",

            filters: {
              categoryIds: [
                "flores",
              ],

              campaignIds: [
                "cyber",
              ],
            },

            overrides: {
              includedProductIds:
                [],

              excludedProductIds:
                [],
            },
          });

        expect(
          sanitized?.filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );
      },
    );

    it(
      "une varias campañas sin duplicar productos",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              createUnionComposition({
                campaignIds: [
                  "madre",
                  "cyber",
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
      "une categorías y campañas como fuentes acumulativas",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              createUnionComposition({
                categoryIds: [
                  "flores",
                ],

                campaignIds: [
                  "cyber",
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
      "une fuentes completas y productos manuales con deduplicación",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              createUnionComposition({
                mode:
                  "hybrid",

                categoryIds: [
                  "flores",
                ],

                campaignIds: [
                  "cyber",
                ],

                includedProductIds: [
                  "FLOR-001",
                  "CAJA-001",
                ],
              }),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
          "FLOR-002",
          "PELU-001",
          "CAJA-001",
        ]);

        expect(
          new Set(
            result.productIds,
          ).size,
        ).toBe(
          result.productIds.length,
        );
      },
    );
  },
);
