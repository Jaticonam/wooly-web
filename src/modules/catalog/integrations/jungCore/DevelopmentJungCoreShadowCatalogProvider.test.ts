import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
  CATALOG_SNAPSHOT_CONTRACT_VERSION,
  type CatalogCampaignContract,
  type CatalogCategoryContract,
  type CatalogProductContract,
  type CatalogSnapshotContract,
} from "@/shared/contracts/catalog";

import type {
  JungCoreSnapshotLoader,
} from "./JungCoreSnapshotLoader";

import {
  HttpJungCoreSnapshotLoaderError,
} from "./HttpJungCoreSnapshotLoader";

import {
  buildDevelopmentJungCoreShadowSnapshotUrl,
  createDevelopmentJungCoreShadowCatalogProvider,
} from "./DevelopmentJungCoreShadowCatalogProvider";

function category():
  CatalogCategoryContract {
  return {
    id:
      "flores",

    slug:
      "flores",

    name:
      "Flores",

    icon:
      "🌸",

    priority:
      100,

    publicationStatus:
      "published",
  };
}

function campaign():
  CatalogCampaignContract {
  return {
    id:
      "dia-madre",

    slug:
      "dia-madre",

    name:
      "Día de la Madre",

    icon:
      "💐",

    color:
      "lavanda",

    themeToken:
      "campaign.lavanda",

    startsAt:
      "2000-01-01",

    endsAt:
      "2999-12-31",

    priority:
      100,

    publicationStatus:
      "published",
  };
}

function product(
  overrides:
    Partial<CatalogProductContract> =
      {},
): CatalogProductContract {
  return {
    contractVersion:
      CATALOG_PRODUCT_CONTRACT_VERSION,

    id:
      "core-id-1",

    sku:
      "WLY-001",

    slug:
      "producto-core",

    brandId:
      "wooly",

    categoryId:
      "flores",

    title:
      "Producto CORE",

    description:
      "Descripción canónica",

    campaignIds: [
      "dia-madre",
    ],

    manualBadgeCodes:
      [],

    priority:
      80,

    publicationStatus:
      "published",

    pricing: {
      currency:
        "PEN",

      volumePrices: [
        {
          id:
            "p1",

          minimumQuantity:
            1,

          unitPrice:
            77,
        },
        {
          id:
            "p3",

          minimumQuantity:
            3,

          unitPrice:
            66,
        },
      ],

      offer:
        null,
    },

    inventory: {
      tracked:
        true,

      availableQuantity:
        7,

      status:
        "available",

      updatedAt:
        null,
    },

    mediaAssets: [
      {
        id:
          "asset-1",

        kind:
          "image",

        url:
          "https://core.example/WLY-001.jpg",

        thumbnailUrl:
          null,

        altText:
          "Producto CORE",

        position:
          0,

        isPrimary:
          true,
      },
    ],

    updatedAt:
      null,

    ...overrides,
  };
}

function snapshot(
  overrides:
    Partial<CatalogSnapshotContract> =
      {},
): CatalogSnapshotContract {
  return {
    contractVersion:
      CATALOG_SNAPSHOT_CONTRACT_VERSION,

    brandId:
      "wooly",

    revision:
      "shadow-001",

    generatedAt:
      "2026-10-06T20:00:00.000Z",

    categories: [
      category(),
    ],

    campaigns: [
      campaign(),
    ],

    products: [
      product(),
    ],

    ...overrides,
  };
}

function loaderReturning(
  value:
    unknown,
): JungCoreSnapshotLoader {
  return {
    loadSnapshot:
      vi.fn(
        async () =>
          value,
      ),
  };
}

describe(
  "DevelopmentJungCoreShadowCatalogProvider",
  () => {
    it(
      "solo permite crear Shadow en development",
      () => {
        expect(
          () =>
            createDevelopmentJungCoreShadowCatalogProvider({
              isDevelopment:
                false,

              loader:
                loaderReturning(
                  snapshot(),
                ),
            }),
        ).toThrow(
          "solo está disponible en development",
        );
      },
    );

    it(
      "construye una URL same-origin hacia el proxy Shadow",
      () => {
        expect(
          buildDevelopmentJungCoreShadowSnapshotUrl(
            "http://localhost:8080",
          ),
        ).toBe(
          "http://localhost:8080/jung-core-shadow/catalog/snapshot",
        );
      },
    );

    it(
      "carga catalog-snapshot.v1 válido y conserva brand wooly",
      async () => {
        const provider =
          createDevelopmentJungCoreShadowCatalogProvider({
            isDevelopment:
              true,

            loader:
              loaderReturning(
                snapshot(),
              ),
          });

        const campaigns =
          await provider
            .loadCampaigns();

        const products =
          await provider
            .loadCategoryProducts(
              "flores",
              campaigns,
            );

        expect(
          campaigns.map(
            (item) =>
              item.id,
          ),
        ).toEqual([
          "dia-madre",
        ]);

        expect(products[0].sku).toBe("WLY-001");
        expect(
          products.map(
            (item) =>
              item.id,
          ),
        ).toEqual([
          "core-id-1",
        ]);
      },
    );

    it(
      "falla cerrado ante contrato inválido",
      async () => {
        const provider =
          createDevelopmentJungCoreShadowCatalogProvider({
            isDevelopment:
              true,

            loader:
              loaderReturning({
                ...snapshot(),

                contractVersion:
                  "catalog-snapshot.v2",
              }),
          });

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          code:
            "JUNG_CORE_SNAPSHOT_INVALID",
        });
      },
    );

    it(
      "falla cerrado ante brand diferente",
      async () => {
        const provider =
          createDevelopmentJungCoreShadowCatalogProvider({
            isDevelopment:
              true,

            loader:
              loaderReturning(
                snapshot({
                  brandId:
                    "gleemour",

                  products: [
                    product({
                      brandId:
                        "gleemour",
                    }),
                  ],
                }),
              ),
          });

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          code:
            "JUNG_CORE_BRAND_MISMATCH",
        });
      },
    );

    it(
      "propaga fallo de endpoint o auth sin fallback",
      async () => {
        const loader:
          JungCoreSnapshotLoader = {
            loadSnapshot:
              vi.fn(
                async () => {
                  throw new HttpJungCoreSnapshotLoaderError(
                    "HTTP_401",
                    "Unauthorized",

                    {
                      status:
                        401,

                      retryable:
                        false,
                    },
                  );
                },
              ),
          };

        const provider =
          createDevelopmentJungCoreShadowCatalogProvider({
            isDevelopment:
              true,

            loader,
          });

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          code:
            "HTTP_401",
        });

        expect(
          loader.loadSnapshot,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "no utiliza datos temporales del preview C2C.9A",
      async () => {
        const provider =
          createDevelopmentJungCoreShadowCatalogProvider({
            isDevelopment:
              true,

            loader:
              loaderReturning(
                snapshot(),
              ),
          });

        const campaigns =
          await provider
            .loadCampaigns();

        const products =
          await provider
            .loadCategoryProducts(
              "flores",
              campaigns,
            );

        expect(
          products[0],
        ).toMatchObject({
          id: "core-id-1",
          sku: "WLY-001",

          price_1:
            77,

          price_3:
            66,

          stock:
            7,

          img:
            "https://core.example/WLY-001.jpg",

          campaigns: [
            "dia-madre",
          ],
        });

        expect(
          products[0].img,
        ).not.toBe(
          "/placeholder.svg",
        );
      },
    );

    it(
      "la frontera browser solo conoce la ruta proxy y no credenciales",
      () => {
        const url =
          new URL(
            buildDevelopmentJungCoreShadowSnapshotUrl(
              "http://localhost:8080",
            ),
          );

        expect(
          url.pathname,
        ).toBe(
          "/jung-core-shadow/catalog/snapshot",
        );

        expect(
          url.username,
        ).toBe(
          "",
        );

        expect(
          url.password,
        ).toBe(
          "",
        );

        expect(
          url.search,
        ).toBe(
          "",
        );
      },
    );
  },
);