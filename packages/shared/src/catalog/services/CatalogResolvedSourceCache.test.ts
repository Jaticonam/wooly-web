import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

const providerMock =
  vi.hoisted(() => ({
    source:
      "jung-core" as const,

    cacheCompatibleSources:
      [
        "jung-core",
        "google-sheets",
      ] as const,

    getCategories:
      vi.fn(
        () => [
          "flores",
        ],
      ),

    loadCampaigns:
      vi.fn(
        async () => [],
      ),

    loadCampaignsDetailed:
      vi.fn(),

    loadCategoryProducts:
      vi.fn(
        async () => [],
      ),

    loadCategoryProductsDetailed:
      vi.fn(),
  }));

vi.mock(
  "../providers/DefaultCatalogProvider",

  () => ({
    catalogProvider:
      providerMock,
  }),
);

const campaign = {
  id:
    "campaign-1",

  name:
    "Campaña",

  icon:
    "",

  color:
    "#000000",

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

  priority:
    1,
} as unknown as Product;

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();

  providerMock
    .getCategories
    .mockReset();

  providerMock
    .getCategories
    .mockReturnValue([
      "flores",
    ]);

  providerMock
    .loadCampaigns
    .mockReset();

  providerMock
    .loadCampaigns
    .mockResolvedValue([]);

  providerMock
    .loadCampaignsDetailed
    .mockReset();

  providerMock
    .loadCampaignsDetailed
    .mockResolvedValue({
      data:
        [],

      source:
        "jung-core",

      issues:
        [],

      metadata: {
        requestedSource:
          "jung-core",

        resolvedSource:
          "jung-core",

        fallbackUsed:
          false,
      },
    });

  providerMock
    .loadCategoryProducts
    .mockReset();

  providerMock
    .loadCategoryProducts
    .mockResolvedValue([]);

  providerMock
    .loadCategoryProductsDetailed
    .mockReset();

  providerMock
    .loadCategoryProductsDetailed
    .mockResolvedValue({
      data:
        [],

      source:
        "jung-core",

      issues:
        [],

      metadata: {
        requestedSource:
          "jung-core",

        resolvedSource:
          "jung-core",

        fallbackUsed:
          false,
      },
    });
});

describe(
  "caché consciente de la fuente resuelta",
  () => {
    it(
      "persiste campañas con la fuente realmente resuelta",
      async () => {
        providerMock
          .loadCampaignsDetailed
          .mockResolvedValue({
            data:
              [campaign],

            source:
              "google-sheets",

            issues:
              [],

            metadata: {
              requestedSource:
                "jung-core",

              resolvedSource:
                "google-sheets",

              fallbackUsed:
                true,

              fallbackReason:
                "PrimaryUnavailable",
            },
          });

        const {
          loadCatalogCampaigns,
        } =
          await import(
            "./campaignService"
          );

        await loadCatalogCampaigns({
          includeInactive:
            true,

          forceRefresh:
            true,
        });

        const raw =
          localStorage.getItem(
            "jung_catalog_campaigns_v3",
          );

        expect(raw).not.toBeNull();

        expect(
          JSON.parse(
            raw as string,
          ).source,
        ).toBe(
          "google-sheets",
        );
      },
    );

    it(
      "no persiste un vacío producido por error de campañas",
      async () => {
        const errorSpy =
          vi.spyOn(
            console,
            "error",
          ).mockImplementation(
            () => undefined,
          );

        providerMock
          .loadCampaignsDetailed
          .mockRejectedValue(
            new Error(
              "Provider unavailable",
            ),
          );

        const {
          loadCatalogCampaigns,
        } =
          await import(
            "./campaignService"
          );

        const result =
          await loadCatalogCampaigns({
            includeInactive:
              true,

            forceRefresh:
              true,
          });

        expect(result).toEqual([]);

        expect(
          localStorage.getItem(
            "jung_catalog_campaigns_v3",
          ),
        ).toBeNull();

        errorSpy.mockRestore();
      },
    );

    it(
      "persiste productos con la fuente resuelta por categoría",
      async () => {
        providerMock
          .loadCategoryProductsDetailed
          .mockResolvedValue({
            data:
              [product],

            source:
              "google-sheets",

            issues:
              [],

            metadata: {
              requestedSource:
                "jung-core",

              resolvedSource:
                "google-sheets",

              fallbackUsed:
                true,
            },
          });

        const {
          loadCategoryProducts,
        } =
          await import(
            "./productService"
          );

        await loadCategoryProducts(
          "flores",

          {
            forceRefresh:
              true,
          },
        );

        const raw =
          localStorage.getItem(
            "jung_catalog_v3_flores",
          );

        expect(raw).not.toBeNull();

        expect(
          JSON.parse(
            raw as string,
          ).source,
        ).toBe(
          "google-sheets",
        );
      },
    );

    it(
      "reutiliza una caché de Google Sheets compatible con provider compuesto",
      async () => {
        const {
          serializeStorageEnvelope,
        } =
          await import(
            "@wooly/contracts/infrastructure/storage/StorageEnvelope"
          );

        localStorage.setItem(
          "jung_catalog_v3_flores",

          serializeStorageEnvelope({
            schemaVersion:
              1,

            savedAt:
              Date.now(),

            data:
              [product],

            source:
              "google-sheets",
          }),
        );

        const {
          loadCategoryProducts,
        } =
          await import(
            "./productService"
          );

        const result =
          await loadCategoryProducts(
            "flores",
          );

        expect(result).toEqual([
          product,
        ]);

        expect(
          providerMock
            .loadCategoryProductsDetailed,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "resuelve caché heredada sin source solo cuando Google Sheets es compatible",
      async () => {
        const {
          resolveCatalogCacheSource,
        } =
          await import(
            "../providers/CatalogProvider"
          );

        expect(
          resolveCatalogCacheSource(
            undefined,

            [
              "jung-core",
              "google-sheets",
            ],
          ),
        ).toBe(
          "google-sheets",
        );

        expect(
          resolveCatalogCacheSource(
            undefined,
            ["jung-core"],
          ),
        ).toBeNull();
      },
    );
  },
);