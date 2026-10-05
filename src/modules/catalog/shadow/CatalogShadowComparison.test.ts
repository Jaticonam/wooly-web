import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CatalogProvider,
} from "@/modules/catalog/providers/CatalogProvider";

import type {
  Campaign,
  Product,
} from "@/shared/types/product";

import {
  compareCatalogProvidersShadow,
} from "./CatalogShadowComparison";

function campaign(
  overrides:
    Partial<Campaign> = {},
): Campaign {
  return {
    id:
      "cyber",

    name:
      "Cyber",

    icon:
      "zap",

    color:
      "amarillo",

    themeToken:
      "campaign.cyber",

    colorClass:
      "campaign-yellow",

    startDate:
      "",

    endDate:
      "",

    priority:
      100,

    publicationStatus:
      "publicado",

    computedStatus:
      "activa",

    ...overrides,
  };
}

function product(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id:
      "WLY001",

    title:
      "Producto",

    description:
      "Descripción",

    category:
      "flores",

    price_1:
      10,

    price_3:
      9,

    price_12:
      8,

    price_50:
      null,

    price_100:
      null,

    price_offer:
      null,

    stock:
      20,

    img:
      "https://example.com/WLY001.jpg",

    gallery:
      "",

    status:
      "publicado",

    badges: [
      "nuevo",
    ],

    campaigns: [
      "cyber",
    ],

    priority:
      80,

    ...overrides,
  };
}

function provider(
  options: {
    source:
      "google-sheets" |
      "jung-core";

    categories?:
      readonly string[];

    campaigns?:
      readonly Campaign[];

    products?:
      readonly Product[];
  },
): CatalogProvider {
  const categories =
    options.categories ??
    [
      "flores",
    ];

  const campaigns =
    options.campaigns ??
    [
      campaign(),
    ];

  const products =
    options.products ??
    [
      product(),
    ];

  return {
    source:
      options.source,

    getCategories:
      () =>
        categories,

    loadCampaigns:
      async () =>
        [
          ...campaigns,
        ],

    loadCategoryProducts:
      async (
        category,
      ) =>
        products.filter(
          (
            candidate,
          ) =>
            candidate.category ===
              category,
        ),
  };
}

describe(
  "CatalogShadowComparison",
  () => {
    it(
      "declara equivalentes dos providers con el mismo estado comercial",
      async () => {
        const result =
          await compareCatalogProvidersShadow(
            provider({
              source:
                "google-sheets",
            }),

            provider({
              source:
                "jung-core",
            }),
          );

        expect(
          result.equivalent,
        ).toBe(
          true,
        );

        expect(
          result.differences,
        ).toEqual(
          [],
        );

        expect(
          result.left.source,
        ).toBe(
          "google-sheets",
        );

        expect(
          result.right.source,
        ).toBe(
          "jung-core",
        );
      },
    );

    it(
      "ignora orden incidental de categorías, campañas y listas",
      async () => {
        const result =
          await compareCatalogProvidersShadow(
            provider({
              source:
                "google-sheets",

              categories: [
                "peluches",
                "flores",
              ],

              campaigns: [
                campaign({
                  id:
                    "madre",
                }),
                campaign(),
              ],

              products: [
                product({
                  badges: [
                    "nuevo",
                    "top",
                  ],

                  campaigns: [
                    "madre",
                    "cyber",
                  ],
                }),
              ],
            }),

            provider({
              source:
                "jung-core",

              categories: [
                "flores",
                "peluches",
              ],

              campaigns: [
                campaign(),
                campaign({
                  id:
                    "madre",
                }),
              ],

              products: [
                product({
                  badges: [
                    "top",
                    "nuevo",
                  ],

                  campaigns: [
                    "cyber",
                    "madre",
                  ],
                }),
              ],
            }),
          );

        expect(
          result.equivalent,
        ).toBe(
          true,
        );
      },
    );

    it(
      "reporta diferencias comerciales por path",
      async () => {
        const result =
          await compareCatalogProvidersShadow(
            provider({
              source:
                "google-sheets",
            }),

            provider({
              source:
                "jung-core",

              products: [
                product({
                  price_1:
                    12,

                  stock:
                    18,
                }),
              ],
            }),
          );

        expect(
          result.equivalent,
        ).toBe(
          false,
        );

        expect(
          result.differences,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              kind:
                "value-mismatch",

              path:
                "products[0].price_1",

              left:
                10,

              right:
                12,
            }),

            expect.objectContaining({
              kind:
                "value-mismatch",

              path:
                "products[0].stock",

              left:
                20,

              right:
                18,
            }),
          ]),
        );
      },
    );

    it(
      "reporta faltantes sin mutar providers ni activar una fuente",
      async () => {
        const result =
          await compareCatalogProvidersShadow(
            provider({
              source:
                "google-sheets",
            }),

            provider({
              source:
                "jung-core",

              products:
                [],
            }),
          );

        expect(
          result.equivalent,
        ).toBe(
          false,
        );

        expect(
          result.differences,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              kind:
                "missing-right",

              path:
                "products[0]",
            }),
          ]),
        );
      },
    );

    it(
      "no compara colorClass porque es presentación legacy de Wooly",
      async () => {
        const result =
          await compareCatalogProvidersShadow(
            provider({
              source:
                "google-sheets",

              campaigns: [
                campaign({
                  colorClass:
                    "legacy-a",
                }),
              ],
            }),

            provider({
              source:
                "jung-core",

              campaigns: [
                campaign({
                  colorClass:
                    "legacy-b",
                }),
              ],
            }),
          );

        expect(
          result.equivalent,
        ).toBe(
          true,
        );
      },
    );
  },
);
