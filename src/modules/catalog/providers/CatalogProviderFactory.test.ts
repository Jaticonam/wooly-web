import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  CatalogProvider,
} from "./CatalogProvider";
import {
  isCatalogCacheSourceCompatible,
} from "./CatalogProvider";
import {
  createCatalogProvider,
  resolveCatalogSourceMode,
} from "./CatalogProviderFactory";
import {
  developmentJungCoreCatalogProvider,
} from "@/modules/catalog/integrations/jungCore/DevelopmentJungCoreCatalogProvider";

import {
  FallbackCatalogProvider,
} from "./FallbackCatalogProvider";

function provider(
  source:
    CatalogProvider["source"],
  products: string[] = [],
): CatalogProvider {
  return {
    source,
    getCategories: () => [
      "flores",
    ],
    loadCampaigns:
      vi.fn().mockResolvedValue(
        [],
      ),
    loadCategoryProducts:
      vi.fn().mockResolvedValue(
        products.map(
          (id) => ({
            id,
          }),
        ),
      ),
  } as CatalogProvider;
}

afterEach(() => vi.unstubAllEnvs());

describe(
  "CatalogProviderFactory",
  () => {
    it.each([
      [undefined, "google-sheets"],
      ["google-sheets", "google-sheets"],
      ["desconocido", "google-sheets"],
      ["contract-fixture", "contract-fixture"],
      ["jung-core", "jung-core"],
    ])(
      "resuelve %s como %s",
      (value, expected) => {
        expect(
          resolveCatalogSourceMode(
            value,
          ),
        ).toBe(expected);
      },
    );

    it.each([
      ["google-sheets", "google-sheets", true],
      ["contract-fixture", "contract-fixture", true],
      ["google-sheets", "contract-fixture", false],
      ["contract-fixture", "google-sheets", false],
      ["jung-core", "jung-core", true],
      ["google-sheets", "jung-core", false],
      ["jung-core", "google-sheets", false],
      [undefined, "google-sheets", true],
      [undefined, "contract-fixture", false],
      [undefined, "jung-core", false],
    ] as const)(
      "compatibilidad de caché %s -> %s: %s",
      (
        storedSource,
        activeSource,
        expected,
      ) => {
        expect(
          isCatalogCacheSourceCompatible(
            storedSource,
            activeSource,
          ),
        ).toBe(expected);
      },
    );

    it(
      "elige instancias inyectadas sin mutarlas",
      () => {
        const googleSheets =
          provider(
            "google-sheets",
          );
        const contractFixture =
          provider(
            "contract-fixture",
          );

        const jungCore =
          provider(
            "jung-core",
          );

        const dependencies = {
          googleSheets,
          contractFixture,
          jungCore,
        };

        expect(
          createCatalogProvider(
            undefined,
            dependencies,
          ),
        ).toBe(googleSheets);
        expect(
          createCatalogProvider(
            "contract-fixture",
            dependencies,
          ),
        ).toBe(
          contractFixture,
        );

        expect(
          createCatalogProvider(
            "jung-core",
            dependencies,
          ),
        ).toBe(
          jungCore,
        );
        expect(
          dependencies,
        ).toEqual({
          googleSheets,
          contractFixture,
          jungCore,
        });
      },
    );

    it(
      "compone el provider simulado de JUNG CORE sin fallback ni HTTP",
      async () => {
        vi.stubEnv("VITE_JUNG_CORE_DEV_TRANSPORT", "simulated");
        const selected =
          createCatalogProvider(
            "jung-core",

            {
              googleSheets:
                provider(
                  "google-sheets",
                ),

              contractFixture:
                provider(
                  "contract-fixture",
                ),

              jungCore:
                developmentJungCoreCatalogProvider,
            },
          );

        expect(
          selected.source,
        ).toBe(
          "jung-core",
        );

        expect(
          selected.getCategories(),
        ).toEqual([
          "flores",
          "peluches",
          "papeles",
          "cajas",
          "cintas",
          "globos",
          "accesorios",
          "llaveros",
          "hotwheels",
        ]);

        const campaigns =
          await selected
            .loadCampaigns();

        const products =
          await selected
            .loadCategoryProducts(
              "flores",
              campaigns,
            );

        expect(
          campaigns.map(
            (campaign) =>
              campaign.id,
          ),
        ).toEqual([
          "jung-core-simulation",
        ]);

        expect(
          products.map(
            (product) =>
              product.id,
          ),
        ).toEqual([
          "simulated-product-001",
        ]);
      },
    );
  },
);

describe(
  "FallbackCatalogProvider",
  () => {
    it(
      "no llama fallback ante un resultado vacío válido",
      async () => {
        const primary =
          provider(
            "contract-fixture",
          );
        const fallback =
          provider(
            "google-sheets",
            ["fallback"],
          );
        const composed =
          new FallbackCatalogProvider(
            primary,
            fallback,
          );
        const result =
          await composed
            .loadCategoryProductsWithMetadata(
              "flores",
              [],
            );

        expect(result).toEqual({
          data: [],
          metadata: {
            requestedSource:
              "contract-fixture",
            resolvedSource:
              "contract-fixture",
            fallbackUsed: false,
          },
        });
        expect(
          fallback
            .loadCategoryProducts,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "usa fallback solo si el primario falla",
      async () => {
        const primary =
          provider(
            "contract-fixture",
          );
        vi.mocked(
          primary
            .loadCategoryProducts,
        ).mockRejectedValueOnce(
          new TypeError(
            "fixture inválido",
          ),
        );
        const fallback =
          provider(
            "google-sheets",
            ["fallback"],
          );
        const composed =
          new FallbackCatalogProvider(
            primary,
            fallback,
          );
        const result =
          await composed
            .loadCategoryProductsWithMetadata(
              "flores",
              [],
            );

        expect(
          result.data.map(
            (item) => item.id,
          ),
        ).toEqual([
          "fallback",
        ]);
        expect(
          result.metadata,
        ).toEqual({
          requestedSource:
            "contract-fixture",
          resolvedSource:
            "google-sheets",
          fallbackUsed: true,
          fallbackReason:
            "TypeError",
        });
      },
    );

    it(
      "propaga el fallo del fallback",
      async () => {
        const primary =
          provider(
            "contract-fixture",
          );
        const fallback =
          provider(
            "google-sheets",
          );
        vi.mocked(
          primary
            .loadCategoryProducts,
        ).mockRejectedValue(
          new Error("primary"),
        );
        vi.mocked(
          fallback
            .loadCategoryProducts,
        ).mockRejectedValue(
          new Error("fallback"),
        );

        await expect(
          new FallbackCatalogProvider(
            primary,
            fallback,
          ).loadCategoryProducts(
            "flores",
            [],
          ),
        ).rejects.toThrow(
          "fallback",
        );
      },
    );

    it(
      "no mezcla resultados ni duplica llamadas",
      async () => {
        const primary =
          provider(
            "contract-fixture",
            ["primary"],
          );
        const fallback =
          provider(
            "google-sheets",
            ["fallback"],
          );
        const products =
          await new FallbackCatalogProvider(
            primary,
            fallback,
          ).loadCategoryProducts(
            "flores",
            [],
          );

        expect(
          products.map(
            (item) => item.id,
          ),
        ).toEqual([
          "primary",
        ]);
        expect(
          primary
            .loadCategoryProducts,
        ).toHaveBeenCalledOnce();
        expect(
          fallback
            .loadCategoryProducts,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
