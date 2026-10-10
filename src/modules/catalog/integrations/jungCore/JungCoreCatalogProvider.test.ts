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

import {
  JungCoreCatalogProvider,
} from "./JungCoreCatalogProvider";

import type {
  JungCoreSnapshotLoader,
} from "./JungCoreSnapshotLoader";

function createCategory(
  overrides:
    Partial<CatalogCategoryContract> = {},
): CatalogCategoryContract {
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

    ...overrides,
  };
}

function createCampaign(
  overrides:
    Partial<CatalogCampaignContract> = {},
): CatalogCampaignContract {
  return {
    id:
      "dia-madre",

    slug:
      "dia-de-la-madre",

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

    id:
      "core-product-1",

    sku:
      "WLY-001",

    slug:
      "producto-prueba",

    brandId:
      "wooly",

    categoryId:
      "flores",

    title:
      "Producto de prueba",

    description:
      "Descripción de prueba",

    campaignIds: [
      "dia-madre",
    ],

    manualBadgeCodes: [],

    priority:
      50,

    publicationStatus:
      "published",

    pricing: {
      currency:
        "PEN",

      volumePrices: [{
        id:
          "price-1",

        minimumQuantity:
          1,

        unitPrice:
          10,
      }],

      offer:
        null,
    },

    inventory: {
      tracked:
        true,

      availableQuantity:
        20,

      status:
        "available",

      updatedAt:
        null,
    },

    mediaAssets: [{
      id:
        "cover",

      kind:
        "image",

      url:
        "https://example.com/product.jpg",

      thumbnailUrl:
        null,

      altText:
        "Producto de prueba",

      position:
        0,

      isPrimary:
        true,
    }],

    updatedAt:
      null,

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

    brandId:
      "wooly",

    revision:
      "revision-001",

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

function createProvider(
  loader:
    JungCoreSnapshotLoader,

  options: {
    expectedBrandId?: string;
    bootstrapCategories?: string[];
    now?: () => number;
  } = {},
): JungCoreCatalogProvider {
  return new JungCoreCatalogProvider({
    loader,

    expectedBrandId:
      options.expectedBrandId ??
      "wooly",

    bootstrapCategories:
      options.bootstrapCategories ??
      [
        "flores",
        "peluches",
      ],

    resolveColorClass:
      (color) =>
        `campaign-${color}`,

    now:
      options.now,
  });
}

describe(
  "JungCoreCatalogProvider",
  () => {
    it(
      "expone categorías bootstrap sin ejecutar el loader",
      () => {
        const loader =
          loaderReturning(
            createSnapshot(),
          );

        const provider =
          createProvider(
            loader,
          );

        expect(
          provider.getCategories(),
        ).toEqual([
          "flores",
          "peluches",
        ]);

        expect(
          loader.loadSnapshot,
        ).not.toHaveBeenCalled();

        expect(
          provider.getState(),
        ).toEqual({
          status:
            "idle",

          revision:
            null,

          generatedAt:
            null,

          loadedAt:
            null,

          productIssueCount:
            0,

          unsupportedTierCount:
            0,

          lastErrorCode:
            null,

          circuitBreaker: {
            status:
              "disabled",

            consecutiveFailures:
              0,

            openedAt:
              null,

            nextAttemptAt:
              null,
          },
        });
      },
    );

    it(
      "reemplaza el bootstrap por categorías publicadas después de cargar",
      async () => {
        const provider =
          createProvider(
            loaderReturning(
              createSnapshot({
                categories: [
                  createCategory({
                    id:
                      "cajas",

                    slug:
                      "cajas",

                    name:
                      "Cajas",

                    priority:
                      200,
                  }),

                  createCategory({
                    id:
                      "flores",

                    priority:
                      100,
                  }),

                  createCategory({
                    id:
                      "peluches",

                    slug:
                      "peluches",

                    name:
                      "Peluches",

                    priority:
                      500,

                    publicationStatus:
                      "hidden",
                  }),
                ],

                products: [],
              }),
            ),
          );

        await provider
          .loadCampaigns();

        expect(
          provider.getCategories(),
        ).toEqual([
          "cajas",
          "flores",
        ]);
      },
    );

    it(
      "deduplica solicitudes concurrentes y conserva el snapshot en memoria",
      async () => {
        let resolveSnapshot:
          (
            value:
              unknown,
          ) => void =
            () => undefined;

        const pendingSnapshot =
          new Promise<unknown>(
            (resolve) => {
              resolveSnapshot =
                resolve;
            },
          );

        const loader:
          JungCoreSnapshotLoader = {
            loadSnapshot:
              vi.fn(
                () =>
                  pendingSnapshot,
              ),
          };

        const provider =
          createProvider(
            loader,
          );

        const campaignsRequest =
          provider.loadCampaigns();

        const productsRequest =
          provider.loadCategoryProducts(
            "flores",
            [],
          );

        expect(
          loader.loadSnapshot,
        ).toHaveBeenCalledTimes(1);

        expect(
          provider.getState().status,
        ).toBe("loading");

        resolveSnapshot(
          createSnapshot(),
        );

        const [
          campaigns,
          products,
        ] = await Promise.all([
          campaignsRequest,
          productsRequest,
        ]);

        expect(
          campaigns,
        ).toHaveLength(1);

        expect(products[0].sku).toBe("WLY-001");
        expect(
          products.map(
            (product) =>
              product.id,
          ),
        ).toEqual([
          "core-product-1",
        ]);

        await provider
          .loadCampaigns();

        await provider
          .loadCategoryProducts(
            "flores",
            [],
          );

        expect(
          loader.loadSnapshot,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "no entrega productos de una categoría no publicada",
      async () => {
        const provider =
          createProvider(
            loaderReturning(
              createSnapshot({
                categories: [
                  createCategory(),

                  createCategory({
                    id:
                      "peluches",

                    slug:
                      "peluches",

                    name:
                      "Peluches",

                    publicationStatus:
                      "hidden",
                  }),
                ],

                products: [
                  createProduct({
                    id:
                      "hidden-product",

                    sku:
                      "HIDDEN-001",

                    categoryId:
                      "peluches",
                  }),
                ],
              }),
            ),
          );

        expect(
          provider.getCategories(),
        ).toContain(
          "peluches",
        );

        const products =
          await provider
            .loadCategoryProducts(
              "peluches",
              [],
            );

        expect(products).toEqual([]);

        expect(
          provider.getCategories(),
        ).not.toContain(
          "peluches",
        );
      },
    );

    it(
      "expone diagnósticos compatibles con el Health Collector",
      async () => {
        const provider =
          createProvider(
            loaderReturning(
              createSnapshot({
                products: [
                  createProduct({
                    pricing: {
                      currency:
                        "PEN",

                      volumePrices: [
                        {
                          id:
                            "price-1",

                          minimumQuantity:
                            1,

                          unitPrice:
                            10,
                        },
                        {
                          id:
                            "price-6",

                          minimumQuantity:
                            6,

                          unitPrice:
                            8,
                        },
                      ],

                      offer:
                        null,
                    },
                  }),
                ],
              }),
            ),

            {
              now:
                () =>
                  123456,
            },
          );

        const result =
          await provider
            .loadCategoryProductsDetailed(
              "flores",
              [],
            );

        expect(
          result.source,
        ).toBe(
          "jung-core",
        );

        expect(
          result.data,
        ).toHaveLength(1);

        expect(
          result.issues,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code:
                "UNSUPPORTED_VOLUME_TIER",

              itemIndex:
                0,
            }),
          ]),
        );

        expect(
          result.diagnostics,
        ).toEqual({
          receivedCount:
            1,

          validCount:
            1,

          rejectedCount:
            0,

          unsupportedTierCount:
            1,
        });

        expect(
          provider.getState(),
        ).toEqual(
          expect.objectContaining({
            status:
              "ready",

            revision:
              "revision-001",

            generatedAt:
              "2026-08-03T08:00:00.000Z",

            loadedAt:
              123456,

            unsupportedTierCount:
              1,

            lastErrorCode:
              null,
          }),
        );
      },
    );

    it(
      "rechaza un snapshot inválido y registra el código de error",
      async () => {
        const provider =
          createProvider(
            loaderReturning({
              ...createSnapshot(),

              contractVersion:
                "catalog-snapshot.v2",
            }),
          );

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          name:
            "JungCoreCatalogProviderError",

          code:
            "JUNG_CORE_SNAPSHOT_INVALID",
        });

        expect(
          provider.getState(),
        ).toEqual(
          expect.objectContaining({
            status:
              "error",

            lastErrorCode:
              "JUNG_CORE_SNAPSHOT_INVALID",
          }),
        );
      },
    );

    it(
      "rechaza snapshots de otra marca",
      async () => {
        const provider =
          createProvider(
            loaderReturning(
              createSnapshot({
                brandId:
                  "gleemour",

                products: [
                  createProduct({
                    brandId:
                      "gleemour",
                  }),
                ],
              }),
            ),
          );

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          code:
            "JUNG_CORE_BRAND_MISMATCH",
        });

        expect(
          provider.getState()
            .lastErrorCode,
        ).toBe(
          "JUNG_CORE_BRAND_MISMATCH",
        );
      },
    );

    it(
      "permite reintentar después de un fallo del loader",
      async () => {
        const loader:
          JungCoreSnapshotLoader = {
            loadSnapshot:
              vi.fn()
                .mockRejectedValueOnce(
                  new Error(
                    "network",
                  ),
                )
                .mockResolvedValueOnce(
                  createSnapshot(),
                ),
          };

        const provider =
          createProvider(
            loader,
          );

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          code:
            "JUNG_CORE_SNAPSHOT_LOAD_FAILED",
        });

        expect(
          provider.getState().status,
        ).toBe("error");

        await expect(
          provider.loadCampaigns(),
        ).resolves.toHaveLength(1);

        expect(
          loader.loadSnapshot,
        ).toHaveBeenCalledTimes(2);

        expect(
          provider.getState().status,
        ).toBe("ready");
      },
    );
  },
);

describe(
  "JungCoreCatalogProvider preserva errores HTTP tipados",
  () => {
    it.each([
      [
        "HTTP_503",
        503,
        true,
      ],
      [
        "HTTP_401",
        401,
        false,
      ],
      [
        "JUNG_CORE_SNAPSHOT_INVALID",
        undefined,
        false,
      ],
    ] as const)(
      "conserva %s desde el loader hasta el estado",

      async (
        code,
        status,
        retryable,
      ) => {
        const {
          HttpJungCoreSnapshotLoaderError,
        } =
          await import(
            "./HttpJungCoreSnapshotLoader"
          );

        const transportError =
          new HttpJungCoreSnapshotLoaderError(
            code,
            "Error de transporte controlado.",

            {
              status,
              retryable,
            },
          );

        const loader:
          JungCoreSnapshotLoader = {
            loadSnapshot:
              async () => {
                throw transportError;
              },
          };

        const provider =
          new JungCoreCatalogProvider({
            loader,

            expectedBrandId:
              "wooly",

            bootstrapCategories: [
              "flores",
            ],

            resolveColorClass:
              () => "lavanda",
          });

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          name:
            "JungCoreCatalogProviderError",

          code,

          providerCause:
            expect.objectContaining({
              code,
            }),
        });

        expect(
          provider
            .getState()
            .lastErrorCode,
        ).toBe(
          code,
        );
      },
    );
  },
);