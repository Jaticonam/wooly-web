import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  CatalogCategoryId,
  CatalogProvider,
} from "@/modules/catalog/providers/CatalogProvider";

import type {
  Campaign,
  Product,
} from "@/shared/types/product";

import {
  runCatalogShadowComparison,
} from "./CatalogShadowRunner";

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
      "bg-yellow-400",

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
      readonly CatalogCategoryId[];

    campaigns?:
      readonly Campaign[];

    products?:
      readonly Product[];

    failure?:
      unknown;
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
      async () => {
        if (
          options.failure
        ) {
          throw options.failure;
        }

        return [
          ...campaigns,
        ];
      },

    loadCategoryProducts:
      async (
        category,
      ) =>
        products.filter(
          (candidate) =>
            candidate.category ===
              category,
        ),
  };
}

describe(
  "CatalogShadowRunner",
  () => {
    it(
      "providers equivalentes producen ready equivalente",
      async () => {
        const result =
          await runCatalogShadowComparison({
            leftProvider:
              provider({
                source:
                  "google-sheets",
              }),

            rightProvider:
              provider({
                source:
                  "jung-core",
              }),
          });

        expect(
          result,
        ).toMatchObject({
          status:
            "ready",

          summary: {
            equivalent:
              true,

            differenceCount:
              0,
          },
        });
      },
    );

    it(
      "diferencias comerciales siguen siendo ready",
      async () => {
        const result =
          await runCatalogShadowComparison({
            leftProvider:
              provider({
                source:
                  "google-sheets",
              }),

            rightProvider:
              provider({
                source:
                  "jung-core",

                products: [
                  product({
                    price_1:
                      11,
                  }),
                ],
              }),
          });

        expect(
          result,
        ).toMatchObject({
          status:
            "ready",

          summary: {
            equivalent:
              false,
          },
        });
      },
    );

    it(
      "clasifica diferencias de producto",
      async () => {
        const result =
          await runCatalogShadowComparison({
            leftProvider:
              provider({
                source:
                  "google-sheets",
              }),

            rightProvider:
              provider({
                source:
                  "jung-core",

                products: [
                  product({
                    stock:
                      7,
                  }),
                ],
              }),
          });

        expect(
          result.status,
        ).toBe(
          "ready",
        );

        if (
          result.status !==
            "ready"
        ) {
          return;
        }

        expect(
          result.summary.products,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "clasifica diferencias de campaña",
      async () => {
        const result =
          await runCatalogShadowComparison({
            leftProvider:
              provider({
                source:
                  "google-sheets",
              }),

            rightProvider:
              provider({
                source:
                  "jung-core",

                campaigns: [
                  campaign({
                    name:
                      "Cyber CORE",
                  }),
                ],
              }),
          });

        expect(
          result.status,
        ).toBe(
          "ready",
        );

        if (
          result.status !==
            "ready"
        ) {
          return;
        }

        expect(
          result.summary.campaigns,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "clasifica diferencias de categoría",
      async () => {
        const result =
          await runCatalogShadowComparison({
            leftProvider:
              provider({
                source:
                  "google-sheets",

                categories: [
                  "flores",
                ],
              }),

            rightProvider:
              provider({
                source:
                  "jung-core",

                categories: [
                  "flores",
                  "cajas",
                ],
              }),
          });

        expect(
          result.status,
        ).toBe(
          "ready",
        );

        if (
          result.status !==
            "ready"
        ) {
          return;
        }

        expect(
          result.summary.categories,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "CORE offline produce unavailable",
      async () => {
        const failure =
          Object.assign(
            new Error(
              "offline",
            ),
            {
              code:
                "HTTP_503",
            },
          );

        const result =
          await runCatalogShadowComparison({
            leftProvider:
              provider({
                source:
                  "google-sheets",
              }),

            rightProvider:
              provider({
                source:
                  "jung-core",

                failure,
              }),
          });

        expect(
          result,
        ).toMatchObject({
          status:
            "unavailable",

          errorCode:
            "HTTP_503",
        });
      },
    );

    it(
      "contrato inválido produce error controlado",
      async () => {
        const failure =
          Object.assign(
            new Error(
              "invalid",
            ),
            {
              code:
                "JUNG_CORE_SNAPSHOT_INVALID",
            },
          );

        const result =
          await runCatalogShadowComparison({
            leftProvider:
              provider({
                source:
                  "google-sheets",
              }),

            rightProvider:
              provider({
                source:
                  "jung-core",

                failure,
              }),
          });

        expect(
          result,
        ).toMatchObject({
          status:
            "error",

          errorCode:
            "JUNG_CORE_SNAPSHOT_INVALID",
        });
      },
    );

    it(
      "no muta providers y expone duración determinista",
      async () => {
        const categories:
          CatalogCategoryId[] = [
            "flores",
          ];

        const campaigns = [
          campaign(),
        ];

        const products = [
          product(),
        ];

        const before =
          JSON.stringify({
            categories,
            campaigns,
            products,
          });

        const now =
          vi.fn()
            .mockReturnValueOnce(
              1_000,
            )
            .mockReturnValueOnce(
              1_250,
            );

        const result =
          await runCatalogShadowComparison({
            leftProvider:
              provider({
                source:
                  "google-sheets",

                categories,
                campaigns,
                products,
              }),

            rightProvider:
              provider({
                source:
                  "jung-core",

                categories,
                campaigns,
                products,
              }),

            now,
          });

        expect(
          JSON.stringify({
            categories,
            campaigns,
            products,
          }),
        ).toBe(
          before,
        );

        expect(
          result,
        ).toMatchObject({
          durationMs:
            250,

          startedAt:
            "1970-01-01T00:00:01.000Z",

          completedAt:
            "1970-01-01T00:00:01.250Z",
        });
      },
    );
  },
);