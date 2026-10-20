import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks =
  vi.hoisted(
    () => ({
      getCachedCatalogSnapshot:
        vi.fn(),

      getCatalogCategories:
        vi.fn(),

      loadCategoryProducts:
        vi.fn(),

      loadCatalogCampaigns:
        vi.fn(),

      refreshCatalogCampaigns:
        vi.fn(),
    }),
  );

vi.mock(
  "@wooly/shared/catalog/services/productService",
  () => ({
    getCachedCatalogSnapshot:
      mocks.getCachedCatalogSnapshot,

    getCatalogCategories:
      mocks.getCatalogCategories,

    loadCategoryProducts:
      mocks.loadCategoryProducts,
  }),
);

vi.mock(
  "@wooly/shared/catalog/services/campaignService",
  () => ({
    loadCatalogCampaigns:
      mocks.loadCatalogCampaigns,

    refreshCatalogCampaigns:
      mocks.refreshCatalogCampaigns,
  }),
);

vi.mock(
  "@wooly/shared/catalog/providers/DefaultCatalogProvider",
  () => ({
    catalogProvider: {
      source:
        "google-sheets",
    },
  }),
);

import {
  refreshCatalogNow,
} from "./CatalogSyncService";

describe(
  "CatalogSyncService",
  () => {
    beforeEach(
      () => {
        vi.resetAllMocks();

        mocks.getCatalogCategories
          .mockReturnValue([
            "flores",
            "peluches",
          ]);

        mocks.refreshCatalogCampaigns
          .mockResolvedValue([
            {
              id:
                "campaign-1",
            },
          ]);

        mocks.loadCatalogCampaigns
          .mockResolvedValue([]);
      },
    );

    it(
      "actualiza campañas y categorías mostrando variaciones",
      async () => {
        mocks.getCachedCatalogSnapshot
          .mockReturnValueOnce({
            products:
              new Array(10),

            byCategory: {
              flores:
                new Array(4),

              peluches:
                new Array(6),
            },

            loadedCategories: [
              "flores",
              "peluches",
            ],

            isFullCatalogLoaded:
              true,
          })
          .mockReturnValueOnce({
            products:
              new Array(12),

            byCategory: {
              flores:
                new Array(5),

              peluches:
                new Array(7),
            },

            loadedCategories: [
              "flores",
              "peluches",
            ],

            isFullCatalogLoaded:
              true,
          });

        mocks.loadCategoryProducts
          .mockImplementation(
            async (
              category:
                string,
            ) =>
              category ===
              "flores"
                ? new Array(5)
                : new Array(7),
          );

        const result =
          await refreshCatalogNow();

        expect(
          mocks.refreshCatalogCampaigns,
        ).toHaveBeenCalledWith({
          includeInactive:
            true,
        });

        expect(
          result,
        ).toMatchObject({
          status:
            "success",

          source:
            "google-sheets",

          previousProductCount:
            10,

          currentProductCount:
            12,

          productDelta:
            2,

          campaignStatus:
            "success",

          campaignCount:
            1,

          updatedCategoryCount:
            2,

          failedCategoryCount:
            0,
        });

        expect(
          result.categories[0],
        ).toMatchObject({
          category:
            "flores",

          previousProductCount:
            4,

          currentProductCount:
            5,

          productDelta:
            1,
        });
      },
    );

    it(
      "conserva el conteo anterior cuando una categoría falla",
      async () => {
        const previousFlowers =
          new Array(5);

        const previousTeddies =
          new Array(7);

        mocks.getCachedCatalogSnapshot
          .mockReturnValueOnce({
            products:
              new Array(12),

            byCategory: {
              flores:
                previousFlowers,

              peluches:
                previousTeddies,
            },

            loadedCategories: [
              "flores",
              "peluches",
            ],

            isFullCatalogLoaded:
              true,
          })
          .mockReturnValueOnce({
            products:
              new Array(12),

            byCategory: {
              flores:
                previousFlowers,

              peluches:
                previousTeddies,
            },

            loadedCategories: [
              "flores",
              "peluches",
            ],

            isFullCatalogLoaded:
              true,
          });

        mocks.loadCategoryProducts
          .mockImplementation(
            async (
              category:
                string,
            ) => {
              if (
                category ===
                "peluches"
              ) {
                throw new Error(
                  "Hoja no disponible",
                );
              }

              return previousFlowers;
            },
          );

        const result =
          await refreshCatalogNow();

        expect(
          result.status,
        ).toBe(
          "partial",
        );

        expect(
          result.preservedCategoryCount,
        ).toBe(
          1,
        );

        expect(
          result.categories[1],
        ).toEqual({
          category:
            "peluches",

          status:
            "error",

          previousProductCount:
            7,

          currentProductCount:
            7,

          productCount:
            7,

          productDelta:
            0,

          preservedPreviousData:
            true,

          error:
            "Hoja no disponible",
        });
      },
    );

    it(
      "distingue un fallo de campañas de un registro vacío",
      async () => {
        mocks.refreshCatalogCampaigns
          .mockRejectedValue(
            new Error(
              "No respondió la hoja de campañas",
            ),
          );

        mocks.loadCatalogCampaigns
          .mockResolvedValue([
            {
              id:
                "cached-1",
            },

            {
              id:
                "cached-2",
            },
          ]);

        mocks.getCachedCatalogSnapshot
          .mockReturnValueOnce({
            products:
              new Array(10),

            byCategory: {
              flores:
                new Array(4),

              peluches:
                new Array(6),
            },

            loadedCategories: [
              "flores",
              "peluches",
            ],

            isFullCatalogLoaded:
              true,
          })
          .mockReturnValueOnce({
            products:
              new Array(10),

            byCategory: {
              flores:
                new Array(4),

              peluches:
                new Array(6),
            },

            loadedCategories: [
              "flores",
              "peluches",
            ],

            isFullCatalogLoaded:
              true,
          });

        mocks.loadCategoryProducts
          .mockImplementation(
            async (
              category:
                string,
            ) =>
              category ===
              "flores"
                ? new Array(4)
                : new Array(6),
          );

        const result =
          await refreshCatalogNow();

        expect(
          result,
        ).toMatchObject({
          status:
            "partial",

          campaignStatus:
            "error",

          campaignCount:
            2,

          campaignPreservedPreviousData:
            true,

          campaignError:
            "No respondió la hoja de campañas",

          updatedCategoryCount:
            2,

          failedCategoryCount:
            0,
        });
      },
    );
  },
);
