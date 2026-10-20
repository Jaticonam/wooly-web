import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  loadCatalogCampaignsDetailed,
  loadCatalogCategoryProductsDetailed,
  type CatalogProvider,
} from "./CatalogProvider";

import {
  FallbackCatalogProvider,
} from "./FallbackCatalogProvider";

function simpleProvider(
  source:
    CatalogProvider["source"],
): CatalogProvider {
  return {
    source,

    getCategories:
      () => [
        "flores",
      ],

    loadCampaigns:
      vi.fn(
        async () => [],
      ),

    loadCategoryProducts:
      vi.fn(
        async () => [],
      ),
  };
}

describe(
  "CatalogProvider source metadata",
  () => {
    it(
      "normaliza un provider simple sin fallback",
      async () => {
        const provider =
          simpleProvider(
            "google-sheets",
          );

        const campaigns =
          await loadCatalogCampaignsDetailed(
            provider,
          );

        const products =
          await loadCatalogCategoryProductsDetailed(
            provider,
            "flores",
            campaigns.data,
          );

        expect(
          campaigns.metadata,
        ).toEqual({
          requestedSource:
            "google-sheets",

          resolvedSource:
            "google-sheets",

          fallbackUsed:
            false,
        });

        expect(
          products.metadata,
        ).toEqual(
          campaigns.metadata,
        );
      },
    );

    it(
      "preserva una fuente detallada distinta de la solicitada",
      async () => {
        const provider:
          CatalogProvider = {
            ...simpleProvider(
              "jung-core",
            ),

            loadCategoryProductsDetailed:
              vi.fn(
                async () => ({
                  data:
                    [],

                  source:
                    "google-sheets" as const,

                  issues:
                    [],
                }),
              ),
          };

        const result =
          await loadCatalogCategoryProductsDetailed(
            provider,
            "flores",
            [],
          );

        expect(
          result.metadata,
        ).toEqual({
          requestedSource:
            "jung-core",

          resolvedSource:
            "google-sheets",

          fallbackUsed:
            true,
        });
      },
    );

    it(
      "reporta fallback al cargar campañas",
      async () => {
        const primary =
          simpleProvider(
            "jung-core",
          );

        primary.loadCampaigns =
          vi.fn(
            async () => {
              const error =
                new Error(
                  "JUNG CORE no disponible",
                );

              error.name =
                "JungCoreUnavailableError";

              throw error;
            },
          );

        const fallback =
          simpleProvider(
            "google-sheets",
          );

        const provider =
          new FallbackCatalogProvider(
            primary,
            fallback,
          );

        const result =
          await provider
            .loadCampaignsDetailed();

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
            "JungCoreUnavailableError",
        });

        expect(
          result.source,
        ).toBe(
          "google-sheets",
        );
      },
    );

    it(
      "reporta fallback en la carga detallada de productos",
      async () => {
        const primary =
          simpleProvider(
            "jung-core",
          );

        primary.loadCategoryProducts =
          vi.fn(
            async () => {
              const error =
                new Error(
                  "Snapshot inválido",
                );

              error.name =
                "JungCoreSnapshotInvalidError";

              throw error;
            },
          );

        const fallback =
          simpleProvider(
            "google-sheets",
          );

        const provider =
          new FallbackCatalogProvider(
            primary,
            fallback,
          );

        const result =
          await provider
            .loadCategoryProductsDetailed(
              "flores",
              [],
            );

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
            "JungCoreSnapshotInvalidError",
        });

        expect(
          result.source,
        ).toBe(
          "google-sheets",
        );
      },
    );

    it(
      "conserva compatibilidad con el método metadata anterior",
      async () => {
        const primary =
          simpleProvider(
            "jung-core",
          );

        const fallback =
          simpleProvider(
            "google-sheets",
          );

        const provider =
          new FallbackCatalogProvider(
            primary,
            fallback,
          );

        const result =
          await provider
            .loadCategoryProductsWithMetadata(
              "flores",
              [],
            );

        expect(
          result,
        ).toEqual({
          data:
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
      },
    );
  },
);