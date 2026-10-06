import type {
  Campaign,
  Product,
} from "@/shared/types/product";

import {
  PRODUCT_SHEETS_CONFIG,
} from "@/modules/catalog/integrations/googleSheets/sheetsConfig";

import type {
  CatalogCategoryId,
  CatalogProvider,
  CatalogProviderResult,
} from "@/modules/catalog/providers/CatalogProvider";

const bootstrapCategories:
  readonly CatalogCategoryId[] =
    PRODUCT_SHEETS_CONFIG.map(
      (source) =>
        source.category,
    );

let resolvedProvider:
  CatalogProvider |
  null =
    null;

let pendingProvider:
  Promise<CatalogProvider> |
  null =
    null;

function createUnavailableError():
  Error {
  const error =
    new Error(
      "El provider de desarrollo de JUNG CORE solo está disponible en development.",
    );

  error.name =
    "JungCoreDevelopmentUnavailableError";

  return error;
}

async function importDevelopmentProvider():
  Promise<CatalogProvider> {
  if (!import.meta.env.DEV) {
    throw createUnavailableError();
  }

  const transport =
    String(
      import.meta.env
        .VITE_JUNG_CORE_DEV_TRANSPORT ??
        "",
    )
      .trim()
      .toLowerCase();

  if (
    transport ===
      "http-preview"
  ) {
    const {
      developmentJungCorePreviewCatalogProvider,
    } =
      await import(
        "./DevelopmentJungCorePreviewCatalogProvider"
      );

    return developmentJungCorePreviewCatalogProvider;
  }

  const {
    simulatedJungCoreCatalogProvider,
  } =
    await import(
      "./SimulatedJungCoreCatalogProvider"
    );

  return simulatedJungCoreCatalogProvider;
}

async function loadDevelopmentProvider():
  Promise<CatalogProvider> {
  if (resolvedProvider) {
    return resolvedProvider;
  }

  if (pendingProvider) {
    return pendingProvider;
  }

  const request =
    importDevelopmentProvider()
      .then(
        (provider) => {
          resolvedProvider =
            provider;

          return provider;
        },
      )
      .finally(
        () => {
          if (
            pendingProvider ===
              request
          ) {
            pendingProvider =
              null;
          }
        },
      );

  pendingProvider =
    request;

  return request;
}

export const developmentJungCoreCatalogProvider:
  CatalogProvider = {
    source:
      "jung-core",

    getCategories():
      readonly CatalogCategoryId[] {
      return [
        ...(
          resolvedProvider
            ?.getCategories() ??
          bootstrapCategories
        ),
      ];
    },

    async loadCampaigns():
      Promise<Campaign[]> {
      const provider =
        await loadDevelopmentProvider();

      return provider
        .loadCampaigns();
    },

    async loadCategoryProducts(
      category:
        CatalogCategoryId,

      campaigns:
        readonly Campaign[],
    ): Promise<Product[]> {
      const provider =
        await loadDevelopmentProvider();

      return provider
        .loadCategoryProducts(
          category,
          campaigns,
        );
    },

    async loadCategoryProductsDetailed(
      category:
        CatalogCategoryId,

      campaigns:
        readonly Campaign[],
    ): Promise<
      CatalogProviderResult<Product[]>
    > {
      const provider =
        await loadDevelopmentProvider();

      if (
        provider
          .loadCategoryProductsDetailed
      ) {
        return provider
          .loadCategoryProductsDetailed(
            category,
            campaigns,
          );
      }

      return {
        data:
          await provider
            .loadCategoryProducts(
              category,
              campaigns,
            ),

        source:
          provider.source,

        issues:
          [],
      };
    },
  };
