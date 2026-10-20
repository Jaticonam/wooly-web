import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

import type {
  CatalogProvider,
} from "./CatalogProvider";

import {
  loadCatalogCampaignsDetailed,
  loadCatalogCategoryProductsDetailed,
} from "./CatalogProvider";

import {
  BLOCKING_CATALOG_FALLBACK_ERROR_CODES,
  RECOVERABLE_CATALOG_FALLBACK_ERROR_CODES,
  classifyCatalogFallbackError,
  getCatalogFallbackReason,
  shouldUseCatalogFallback,
} from "./CatalogFallbackPolicy";

import {
  createCatalogProvider,
} from "./CatalogProviderFactory";

import {
  FallbackCatalogProvider,
} from "./FallbackCatalogProvider";

class CodedCatalogError
  extends Error {
  constructor(
    readonly code:
      string,
  ) {
    super(code);

    this.name =
      "CodedCatalogError";
  }
}

const campaign = {
  id:
    "campaign-1",

  name:
    "Campaña",

  startDate:
    "2026-01-01",

  endDate:
    "2026-12-31",

  priority:
    1,

  publicationStatus:
    "published",
} as unknown as Campaign;

const product = {
  id:
    "product-1",

  title:
    "Producto",

  category:
    "flores",

  img:
    "/product.webp",

  price_1:
    10,
} as unknown as Product;

function provider(
  source:
    CatalogProvider["source"],

  options: {
    campaignData?:
      Campaign[];

    campaignError?:
      unknown;

    productData?:
      Product[];

    productError?:
      unknown;
  } = {},
): CatalogProvider {
  return {
    source,

    getCategories:
      () => [
        "flores",
      ],

    loadCampaigns:
      vi.fn(
        async () => {
          if (
            "campaignError" in
            options
          ) {
            throw options
              .campaignError;
          }

          return options
            .campaignData ??
            [];
        },
      ),

    loadCategoryProducts:
      vi.fn(
        async () => {
          if (
            "productError" in
            options
          ) {
            throw options
              .productError;
          }

          return options
            .productData ??
            [];
        },
      ),
  };
}

function dependencies(
  jungCore:
    CatalogProvider,

  googleSheets:
    CatalogProvider =
      provider(
        "google-sheets",
      ),
) {
  return {
    jungCore,
    googleSheets,

    contractFixture:
      provider(
        "contract-fixture",
      ),
  };
}

describe(
  "CatalogFallbackPolicy",
  () => {
    it.each(
      RECOVERABLE_CATALOG_FALLBACK_ERROR_CODES,
    )(
      "permite fallback para %s",
      (code) => {
        const assessment =
          classifyCatalogFallbackError(
            new CodedCatalogError(
              code,
            ),
          );

        expect(
          assessment,
        ).toEqual({
          code,
          classification:
            "recoverable",
          shouldFallback:
            true,
        });

        expect(
          shouldUseCatalogFallback(
            new CodedCatalogError(
              code,
            ),
          ),
        ).toBe(
          true,
        );
      },
    );

    it.each(
      BLOCKING_CATALOG_FALLBACK_ERROR_CODES,
    )(
      "bloquea fallback para %s",
      (code) => {
        expect(
          classifyCatalogFallbackError(
            new CodedCatalogError(
              code,
            ),
          ),
        ).toEqual({
          code,
          classification:
            "blocked",
          shouldFallback:
            false,
        });
      },
    );

    it(
      "bloquea por defecto errores desconocidos",
      () => {
        expect(
          classifyCatalogFallbackError(
            new Error(
              "Unknown",
            ),
          ),
        ).toEqual({
          code:
            null,
          classification:
            "unknown",
          shouldFallback:
            false,
        });

        expect(
          shouldUseCatalogFallback(
            new Error(
              "Unknown",
            ),
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "conserva codigo o nombre como razon diagnostica",
      () => {
        expect(
          getCatalogFallbackReason(
            new CodedCatalogError(
              "HTTP_503",
            ),
          ),
        ).toBe(
          "HTTP_503",
        );

        expect(
          getCatalogFallbackReason(
            new TypeError(
              "Invalid",
            ),
          ),
        ).toBe(
          "TypeError",
        );

        expect(
          getCatalogFallbackReason(
            null,
          ),
        ).toBe(
          "PROVIDER_ERROR",
        );
      },
    );
  },
);

describe(
  "CatalogProviderFactory con fallback seguro",
  () => {
    it(
      "mantiene desactivado el fallback por defecto",
      () => {
        const jungCore =
          provider(
            "jung-core",
          );

        const selected =
          createCatalogProvider(
            "jung-core",
            dependencies(
              jungCore,
            ),
          );

        expect(
          selected,
        ).toBe(
          jungCore,
        );

        expect(
          selected,
        ).not.toBeInstanceOf(
          FallbackCatalogProvider,
        );
      },
    );

    it(
      "compone JUNG CORE con Google Sheets solo cuando se habilita",
      () => {
        const selected =
          createCatalogProvider(
            "jung-core",

            dependencies(
              provider(
                "jung-core",
              ),
            ),

            {
              fallback: {
                enabled:
                  true,

                source:
                  "google-sheets",
              },
            },
          );

        expect(
          selected,
        ).toBeInstanceOf(
          FallbackCatalogProvider,
        );

        expect(
          selected
            .cacheCompatibleSources,
        ).toEqual([
          "jung-core",
          "google-sheets",
        ]);
      },
    );

    it(
      "usa Google Sheets ante un error recuperable de campañas",
      async () => {
        const selected =
          createCatalogProvider(
            "jung-core",

            dependencies(
              provider(
                "jung-core",

                {
                  campaignError:
                    new CodedCatalogError(
                      "JUNG_CORE_SNAPSHOT_LOAD_FAILED",
                    ),
                },
              ),

              provider(
                "google-sheets",

                {
                  campaignData:
                    [campaign],
                },
              ),
            ),

            {
              fallback: {
                enabled:
                  true,
              },
            },
          );

        const result =
          await loadCatalogCampaignsDetailed(
            selected,
          );

        expect(
          result.data,
        ).toEqual([
          campaign,
        ]);

        expect(
          result.metadata,
        ).toEqual({
          requestedSource:
            "jung-core",

          resolvedSource:
            "google-sheets",

          fallbackUsed:
            true,

          fallbackReason:
            "JUNG_CORE_SNAPSHOT_LOAD_FAILED",
        });
      },
    );

    it(
      "no oculta errores de integridad",
      async () => {
        const integrityError =
          new CodedCatalogError(
            "JUNG_CORE_SNAPSHOT_INVALID",
          );

        const googleSheets =
          provider(
            "google-sheets",

            {
              campaignData:
                [campaign],
            },
          );

        const selected =
          createCatalogProvider(
            "jung-core",

            dependencies(
              provider(
                "jung-core",

                {
                  campaignError:
                    integrityError,
                },
              ),

              googleSheets,
            ),

            {
              fallback: {
                enabled:
                  true,
              },
            },
          );

        await expect(
          selected
            .loadCampaigns(),
        ).rejects.toBe(
          integrityError,
        );

        expect(
          googleSheets
            .loadCampaigns,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "aplica la misma politica a productos",
      async () => {
        const selected =
          createCatalogProvider(
            "jung-core",

            dependencies(
              provider(
                "jung-core",

                {
                  productError:
                    new CodedCatalogError(
                      "HTTP_503",
                    ),
                },
              ),

              provider(
                "google-sheets",

                {
                  productData:
                    [product],
                },
              ),
            ),

            {
              fallback: {
                enabled:
                  true,
              },
            },
          );

        const result =
          await loadCatalogCategoryProductsDetailed(
            selected,
            "flores",
            [],
          );

        expect(
          result.data,
        ).toEqual([
          product,
        ]);

        expect(
          result.metadata
            .resolvedSource,
        ).toBe(
          "google-sheets",
        );

        expect(
          result.metadata
            .fallbackReason,
        ).toBe(
          "HTTP_503",
        );
      },
    );

    it(
      "no envuelve Google Sheets ni contract fixture",
      () => {
        const googleSheets =
          provider(
            "google-sheets",
          );

        const fixture =
          provider(
            "contract-fixture",
          );

        const deps = {
          googleSheets,
          contractFixture:
            fixture,

          jungCore:
            provider(
              "jung-core",
            ),
        };

        expect(
          createCatalogProvider(
            "google-sheets",
            deps,

            {
              fallback: {
                enabled:
                  true,
              },
            },
          ),
        ).toBe(
          googleSheets,
        );

        expect(
          createCatalogProvider(
            "contract-fixture",
            deps,

            {
              fallback: {
                enabled:
                  true,
              },
            },
          ),
        ).toBe(
          fixture,
        );
      },
    );
  },
);