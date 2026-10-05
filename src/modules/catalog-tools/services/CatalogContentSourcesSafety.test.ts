import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
  type CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  cloneCatalogComposition,
} from "@/modules/catalog/domain/CatalogCompositionDraft";

import {
  resolveCatalogComposition,
} from "@/modules/catalog/domain/CatalogCompositionResolver";

import {
  resolveCatalogPublicationEligibility,
} from "@/modules/catalog/domain/CatalogPublicationEligibility";

import {
  createWoolyCatalogCompositionId,
} from "@/modules/catalog-export/ports/WoolyCatalogDocumentPort";

import {
  buildWoolyCommercialComposition,
} from "@/modules/catalog-tools/services/BuildWoolyCommercialComposition";

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
  campaigns,
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
    id: "FLOR-CYBER",
    category: "flores",
    campaigns: [
      "cyber",
    ],
  }),

  product({
    id: "PELU-CYBER",
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

const createUnionComposition = (
  {
    categoryIds = [],
    campaignIds = [],
    includedProductIds = [],
    excludedProductIds = [],
  }: {
    categoryIds?: readonly string[];
    campaignIds?: readonly string[];
    includedProductIds?: readonly string[];
    excludedProductIds?: readonly string[];
  } = {},
): CatalogComposition => {
  const base =
    createEmptyCatalogComposition(
      "automatic",
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
      includedProductIds,
      excludedProductIds,
    },
  };
};

describe(
  "Catalog Content Sources safety",
  () => {
    it(
      "union sin categorías, campañas ni productos explícitos resuelve cero productos",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              createUnionComposition(),
          });

        expect(
          result.productIds,
        ).toEqual(
          [],
        );

        expect(
          result.automaticProductIds,
        ).toEqual(
          [],
        );
      },
    );

    it(
      "permite productos explícitos aunque no existan fuentes automáticas",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              createUnionComposition({
                includedProductIds: [
                  "CAJA-001",
                ],
              }),
          });

        expect(
          result.automaticProductIds,
        ).toEqual(
          [],
        );

        expect(
          result.productIds,
        ).toEqual([
          "CAJA-001",
        ]);
      },
    );

    it(
      "une categorías y campañas con deduplicación",
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
          "FLOR-CYBER",
          "PELU-CYBER",
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

    it(
      "mantiene include-wins sobre una exclusión del mismo producto",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              createUnionComposition({
                categoryIds: [
                  "flores",
                ],

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
      "mantiene política de visibilidad pública",
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
        ).toContain(
          "oculto-001",
        );
      },
    );

    it(
      "cloneCatalogComposition conserva sourceOperator union",
      () => {
        const composition =
          createUnionComposition({
            categoryIds: [
              "flores",
            ],
          });

        expect(
          cloneCatalogComposition(
            composition,
          ).filters
            .sourceOperator,
        ).toBe(
          "union",
        );
      },
    );

    it(
      "union e intersection generan compositionId distintos",
      () => {
        const intersection =
          createEmptyCatalogComposition(
            "automatic",
          );

        intersection.filters
          .categoryIds = [
            "flores",
          ];

        intersection.filters
          .campaignIds = [
            "cyber",
          ];

        const union =
          createUnionComposition({
            categoryIds: [
              "flores",
            ],

            campaignIds: [
              "cyber",
            ],
          });

        expect(
          createWoolyCatalogCompositionId(
            union,
          ),
        ).not.toBe(
          createWoolyCatalogCompositionId(
            intersection,
          ),
        );
      },
    );

    it(
      "bloquea URL PDF legacy cuando union mezcla categorías y campañas",
      () => {
        const composition =
          createUnionComposition({
            categoryIds: [
              "flores",
            ],

            campaignIds: [
              "cyber",
            ],
          });

        const resolution =
          resolveCatalogComposition({
            products,
            composition,
          });

        const eligibility =
          resolveCatalogPublicationEligibility({
            composition,
            resolution,
          });

        expect(
          eligibility.status,
        ).toBe(
          "requires-public-id",
        );

        expect(
          eligibility.reasons,
        ).toContain(
          "UNION_SOURCE_COMBINATION",
        );
      },
    );

    it(
      "varias categorías union siguen siendo representables por PDF V2",
      () => {
        const composition =
          createUnionComposition({
            categoryIds: [
              "flores",
              "peluches",
            ],
          });

        const resolution =
          resolveCatalogComposition({
            products,
            composition,
          });

        expect(
          resolveCatalogPublicationEligibility({
            composition,
            resolution,
          }).status,
        ).toBe(
          "v2-publicable",
        );
      },
    );

    it(
      "varias campañas union siguen siendo representables por PDF V2",
      () => {
        const composition =
          createUnionComposition({
            campaignIds: [
              "cyber",
              "otra",
            ],
          });

        const resolution =
          resolveCatalogComposition({
            products,
            composition,
          });

        expect(
          resolveCatalogPublicationEligibility({
            composition,
            resolution,
          }).status,
        ).toBe(
          "v2-publicable",
        );
      },
    );

    it(
      "frontera CORE recibe exactamente la resolución union",
      () => {
        const selection =
          createUnionComposition({
            categoryIds: [
              "flores",
            ],

            campaignIds: [
              "cyber",
            ],
          });

        const result =
          buildWoolyCommercialComposition({
            products,
            selection,

            output: {
              compositionId:
                "catalog-union-001",

              version:
                1,

              title:
                "Catálogo fuentes acumulativas",

              createdAt:
                "2026-10-05T02:00:00.000Z",
            },
          });

        expect(
          result.resolution
            .productIds,
        ).toEqual([
          "FLOR-001",
          "FLOR-CYBER",
          "PELU-CYBER",
        ]);

        expect(
          result.composition
            .items
            .map(
              (item) =>
                item.productId,
            ),
        ).toEqual([
          "FLOR-001",
          "FLOR-CYBER",
          "PELU-CYBER",
        ]);
      },
    );
  },
);