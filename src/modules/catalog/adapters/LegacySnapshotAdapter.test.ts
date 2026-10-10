import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
  CATALOG_SNAPSHOT_CONTRACT_VERSION,
  type CatalogCampaignContract,
  type CatalogCategoryContract,
  type CatalogProductContract,
  type CatalogSnapshotContract,
} from "@/shared/contracts/catalog";

import {
  adaptCatalogSnapshotToLegacy,
  validateAndAdaptCatalogSnapshotToLegacy,
} from "./LegacySnapshotAdapter";

function createCategory(
  overrides:
    Partial<CatalogCategoryContract> = {},
): CatalogCategoryContract {
  return {
    id: "flores",
    slug: "flores",
    name: "Flores",
    icon: "🌸",
    priority: 100,
    publicationStatus:
      "published",

    ...overrides,
  };
}

function createCampaign(
  overrides:
    Partial<CatalogCampaignContract> = {},
): CatalogCampaignContract {
  return {
    id: "dia-madre",
    slug: "dia-de-la-madre",
    name: "Día de la Madre",
    icon: "💐",
    color: "lavanda",
    themeToken:
      "campaign.lavanda",
    startsAt:
      "2000-01-01",
    endsAt:
      "2999-12-31",
    priority: 100,
    publicationStatus:
      "published",

    ...overrides,
  };
}

function createProduct(
  overrides:
    Partial<CatalogProductContract> = {},
): CatalogProductContract {
  return {
    contractVersion:
      CATALOG_PRODUCT_CONTRACT_VERSION,

    id: "core-product-1",
    sku: "WLY-001",
    slug: "producto-prueba",

    brandId: "wooly",
    categoryId: "flores",

    title:
      "Producto de prueba",
    description:
      "Descripción de prueba",

    campaignIds: [
      "dia-madre",
    ],

    manualBadgeCodes: [],

    priority: 50,

    publicationStatus:
      "published",

    pricing: {
      currency: "PEN",

      volumePrices: [{
        id: "price-1",
        minimumQuantity: 1,
        unitPrice: 10,
      }],

      offer: null,
    },

    inventory: {
      tracked: true,
      availableQuantity: 20,
      status: "available",
      updatedAt: null,
    },

    mediaAssets: [{
      id: "cover",
      kind: "image",
      url:
        "https://example.com/product.jpg",
      thumbnailUrl: null,
      altText:
        "Producto de prueba",
      position: 0,
      isPrimary: true,
    }],

    updatedAt: null,

    ...overrides,
  };
}

function createSnapshot(
  overrides:
    Partial<CatalogSnapshotContract> = {},
): CatalogSnapshotContract {
  return {
    contractVersion:
      CATALOG_SNAPSHOT_CONTRACT_VERSION,

    brandId: "wooly",
    revision: "revision-001",

    generatedAt:
      "2026-08-03T08:00:00.000Z",

    categories: [
      createCategory(),
    ],

    campaigns: [
      createCampaign(),
    ],

    products: [
      createProduct(),
    ],

    ...overrides,
  };
}

const adapterOptions = {
  resolveColorClass:
    (color: string) =>
      `campaign-${color}`,
};

describe(
  "LegacySnapshotAdapter",
  () => {
    it(
      "expone solo categorías publicadas y ordenadas por prioridad",
      () => {
        const result =
          adaptCatalogSnapshotToLegacy(
            createSnapshot({
              categories: [
                createCategory({
                  id: "peluches",
                  slug: "peluches",
                  name: "Peluches",
                  priority: 40,
                }),

                createCategory({
                  id: "cajas",
                  slug: "cajas",
                  name: "Cajas",
                  priority: 500,
                  publicationStatus:
                    "hidden",
                }),

                createCategory({
                  id: "flores",
                  slug: "flores",
                  name: "Flores",
                  priority: 100,
                }),
              ],

              products: [],
            }),

            adapterOptions,
          );

        expect(
          result.categories,
        ).toEqual([
          "flores",
          "peluches",
        ]);

        expect(
          result.productsByCategory.has(
            "cajas",
          ),
        ).toBe(true);
      },
    );

    it(
      "adapta todas las campañas y las ordena por prioridad",
      () => {
        const result =
          adaptCatalogSnapshotToLegacy(
            createSnapshot({
              campaigns: [
                createCampaign({
                  id: "publicada",
                  slug: "publicada",
                  priority: 10,
                }),

                createCampaign({
                  id: "oculta",
                  slug: "oculta",
                  priority: 100,
                  publicationStatus:
                    "hidden",
                }),
              ],

              products: [],
            }),

            adapterOptions,
          );

        expect(
          result.campaigns.map(
            (campaign) =>
              campaign.id,
          ),
        ).toEqual([
          "oculta",
          "publicada",
        ]);

        expect(
          result.campaigns[0],
        ).toEqual(
          expect.objectContaining({
            publicationStatus:
              "oculto",
            computedStatus:
              "oculta",
            colorClass:
              "campaign-lavanda",
          }),
        );
      },
    );

    it(
      "agrupa y ordena productos por categoría",
      () => {
        const result =
          adaptCatalogSnapshotToLegacy(
            createSnapshot({
              products: [
                createProduct({
                  id: "low",
                  sku: "LOW",
                  priority: 10,
                }),

                createProduct({
                  id: "high",
                  sku: "HIGH",
                  priority: 200,
                }),
              ],
            }),

            adapterOptions,
          );

        expect(
          result.productsByCategory
            .get("flores")
            ?.map(
              (product) =>
                product.id,
            ),
        ).toEqual([
          "high",
          "low",
        ]);
      },
    );

    it(
      "conserva productos de categorías no publicadas",
      () => {
        const result =
          adaptCatalogSnapshotToLegacy(
            createSnapshot({
              categories: [
                createCategory(),

                createCategory({
                  id: "cajas",
                  slug: "cajas",
                  name: "Cajas",
                  publicationStatus:
                    "hidden",
                }),
              ],

              products: [
                createProduct({
                  id: "hidden-product",
                  sku: "HIDDEN-001",
                  categoryId: "cajas",
                }),
              ],
            }),

            adapterOptions,
          );

        expect(
          result.categories,
        ).toEqual([
          "flores",
        ]);

        expect(
          result.productsByCategory
            .get("cajas")
            ?.map(
              (product) =>
                product.id,
            ),
        ).toEqual([
          "hidden-product",
        ]);
      },
    );

    it(
      "prefija los diagnósticos con la posición del producto",
      () => {
        const result =
          adaptCatalogSnapshotToLegacy(
            createSnapshot(),
            adapterOptions,
          );

        expect(
          result.productIssues,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              productIndex: 0,
              productId:
                "core-product-1",
              sku:
                "WLY-001",
              categoryId:
                "flores",
              code:
                "CURRENCY_NOT_REPRESENTED",
              path:
                "products[0].pricing.currency",
            }),
          ]),
        );
      },
    );

    it(
      "registra tiers no representables por el modelo legacy",
      () => {
        const product =
          createProduct({
            pricing: {
              currency: "PEN",

              volumePrices: [
                {
                  id: "price-1",
                  minimumQuantity: 1,
                  unitPrice: 10,
                },
                {
                  id: "price-6",
                  minimumQuantity: 6,
                  unitPrice: 8,
                },
              ],

              offer: null,
            },
          });

        const result =
          adaptCatalogSnapshotToLegacy(
            createSnapshot({
              products: [
                product,
              ],
            }),

            adapterOptions,
          );

        expect(
          result.unsupportedVolumePrices,
        ).toEqual([
          expect.objectContaining({
            productIndex: 0,
            productId:
              "core-product-1",
            sku:
              "WLY-001",
            categoryId:
              "flores",

            volumePrice:
              expect.objectContaining({
                minimumQuantity: 6,
                unitPrice: 8,
              }),
          }),
        ]);
      },
    );

    it(
      "valida valores desconocidos antes de adaptarlos",
      () => {
        const result =
          validateAndAdaptCatalogSnapshotToLegacy(
            {
              ...createSnapshot(),

              contractVersion:
                "catalog-snapshot.v2",
            },

            adapterOptions,
          );

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "UNSUPPORTED_CONTRACT_VERSION",
                path:
                  "contractVersion",
              }),
            ]),
          );
        }
      },
    );

    it(
      "adapta un snapshot vacío válido",
      () => {
        const result =
          validateAndAdaptCatalogSnapshotToLegacy(
            createSnapshot({
              categories: [],
              campaigns: [],
              products: [],
            }),

            adapterOptions,
          );

        expect(result).toEqual({
          ok: true,

          data: {
            brandId:
              "wooly",
            revision:
              "revision-001",
            generatedAt:
              "2026-08-03T08:00:00.000Z",
            categories: [],
            campaigns: [],
            productsByCategory:
              new Map(),
            productIssues: [],
            unsupportedVolumePrices: [],
          },
        });
      },
    );
  },
);