import type {
  CatalogSourceMode,
} from "@wooly/shared/config/application/CatalogSourceMode";

import type {
  CatalogCategoryId,
} from "@wooly/shared/catalog/providers/CatalogProvider";

import {
  catalogProvider,
} from "@wooly/shared/catalog/providers/DefaultCatalogProvider";

import {
  getCachedCatalogSnapshot,
  getCatalogCategories,
  loadCategoryProducts,
} from "@wooly/shared/catalog/services/productService";

import {
  loadCatalogCampaigns,
  refreshCatalogCampaigns,
} from "@wooly/shared/catalog/services/campaignService";

export type CatalogSyncStatus =
  | "success"
  | "partial"
  | "error";

export type CatalogSyncStepStatus =
  | "running"
  | "success"
  | "error";

export type CatalogSyncStage =
  | "campaigns"
  | "category";

export interface CatalogSyncProgress {
  stage:
    CatalogSyncStage;

  status:
    CatalogSyncStepStatus;

  category?:
    CatalogCategoryId;

  completedSteps:
    number;

  totalSteps:
    number;

  message:
    string;
}

export interface CatalogCategorySyncResult {
  category:
    CatalogCategoryId;

  status:
    "success" | "error";

  previousProductCount:
    number;

  currentProductCount:
    number;

  productCount:
    number;

  productDelta:
    number;

  preservedPreviousData:
    boolean;

  error?:
    string;
}

export interface CatalogSyncResult {
  status:
    CatalogSyncStatus;

  source:
    CatalogSourceMode;

  startedAt:
    string;

  completedAt:
    string;

  durationMs:
    number;

  previousProductCount:
    number;

  currentProductCount:
    number;

  productDelta:
    number;

  campaignStatus:
    "success" | "error";

  campaignCount:
    number;

  campaignPreservedPreviousData:
    boolean;

  campaignError?:
    string;

  updatedCategoryCount:
    number;

  failedCategoryCount:
    number;

  preservedCategoryCount:
    number;

  categories:
    readonly CatalogCategorySyncResult[];
}

export interface RefreshCatalogOptions {
  onProgress?: (
    progress:
      CatalogSyncProgress,
  ) => void;
}

function resolveErrorMessage(
  cause:
    unknown,
): string {
  if (
    cause instanceof Error &&
    cause.message.trim()
  ) {
    return cause.message;
  }

  return "Error desconocido durante la actualización.";
}

function emitProgress(
  callback:
    RefreshCatalogOptions["onProgress"],

  progress:
    CatalogSyncProgress,
): void {
  callback?.(
    progress,
  );
}

export async function refreshCatalogNow(
  options:
    RefreshCatalogOptions = {},
): Promise<CatalogSyncResult> {
  const startedAt =
    new Date();

  const previousSnapshot =
    getCachedCatalogSnapshot();

  const categories =
    getCatalogCategories();

  const totalSteps =
    categories.length + 1;

  let completedSteps =
    0;

  let campaignStatus:
    "success" | "error" =
      "success";

  let campaignError:
    string | undefined;

  let campaignPreservedPreviousData =
    false;

  let campaigns:
    Awaited<
      ReturnType<
        typeof loadCatalogCampaigns
      >
    > = [];

  emitProgress(
    options.onProgress,
    {
      stage:
        "campaigns",

      status:
        "running",

      completedSteps,

      totalSteps,

      message:
        "Actualizando campañas...",
    },
  );

  try {
    campaigns =
      await refreshCatalogCampaigns({
        includeInactive:
          true,
      });

    completedSteps +=
      1;

    emitProgress(
      options.onProgress,
      {
        stage:
          "campaigns",

        status:
          "success",

        completedSteps,

        totalSteps,

        message:
          `${campaigns.length} campañas verificadas.`,
      },
    );
  } catch (cause: unknown) {
    campaignStatus =
      "error";

    campaignError =
      resolveErrorMessage(
        cause,
      );

    try {
      campaigns =
        await loadCatalogCampaigns({
          includeInactive:
            true,
        });

      campaignPreservedPreviousData =
        campaigns.length > 0;
    } catch {
      campaigns =
        [];
    }

    completedSteps +=
      1;

    emitProgress(
      options.onProgress,
      {
        stage:
          "campaigns",

        status:
          "error",

        completedSteps,

        totalSteps,

        message:
          campaignPreservedPreviousData
            ? "Falló la consulta de campañas. Se conservó la información anterior."
            : "Falló la consulta de campañas y no existe información anterior.",
      },
    );
  }

  const categoryResults:
    CatalogCategorySyncResult[] = [];

  for (
    const category of
    categories
  ) {
    const previousProducts =
      previousSnapshot
        .byCategory[
          category
        ];

    const previousProductCount =
      previousProducts?.length ??
      0;

    emitProgress(
      options.onProgress,
      {
        stage:
          "category",

        status:
          "running",

        category,

        completedSteps,

        totalSteps,

        message:
          `Actualizando ${category}...`,
      },
    );

    try {
      const products =
        await loadCategoryProducts(
          category,
          {
            forceRefresh:
              true,
          },
        );

      const currentProductCount =
        products.length;

      categoryResults.push({
        category,

        status:
          "success",

        previousProductCount,

        currentProductCount,

        productCount:
          currentProductCount,

        productDelta:
          currentProductCount -
          previousProductCount,

        preservedPreviousData:
          false,
      });

      completedSteps +=
        1;

      emitProgress(
        options.onProgress,
        {
          stage:
            "category",

          status:
            "success",

          category,

          completedSteps,

          totalSteps,

          message:
            `${category}: ${currentProductCount} productos.`,
        },
      );
    } catch (cause: unknown) {
      const preservedPreviousData =
        Boolean(
          previousProducts,
        );

      const error =
        resolveErrorMessage(
          cause,
        );

      categoryResults.push({
        category,

        status:
          "error",

        previousProductCount,

        currentProductCount:
          previousProductCount,

        productCount:
          previousProductCount,

        productDelta:
          0,

        preservedPreviousData,

        error,
      });

      completedSteps +=
        1;

      emitProgress(
        options.onProgress,
        {
          stage:
            "category",

          status:
            "error",

          category,

          completedSteps,

          totalSteps,

          message:
            preservedPreviousData
              ? `${category}: se conservó la información anterior.`
              : `${category}: no existe información anterior.`,
        },
      );
    }
  }

  const currentSnapshot =
    getCachedCatalogSnapshot();

  const updatedCategoryCount =
    categoryResults.filter(
      (result) =>
        result.status ===
        "success",
    ).length;

  const failedCategoryCount =
    categoryResults.length -
    updatedCategoryCount;

  const preservedCategoryCount =
    categoryResults.filter(
      (result) =>
        result.preservedPreviousData,
    ).length;

  const hasAnySuccess =
    updatedCategoryCount > 0 ||
    campaignStatus ===
      "success";

  const hasAnyError =
    failedCategoryCount > 0 ||
    campaignStatus ===
      "error";

  const status:
    CatalogSyncStatus =
      !hasAnySuccess
        ? "error"
        : hasAnyError
          ? "partial"
          : "success";

  const completedAt =
    new Date();

  return {
    status,

    source:
      catalogProvider.source,

    startedAt:
      startedAt.toISOString(),

    completedAt:
      completedAt.toISOString(),

    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),

    previousProductCount:
      previousSnapshot.products.length,

    currentProductCount:
      currentSnapshot.products.length,

    productDelta:
      currentSnapshot.products.length -
      previousSnapshot.products.length,

    campaignStatus,

    campaignCount:
      campaigns.length,

    campaignPreservedPreviousData,

    campaignError,

    updatedCategoryCount,

    failedCategoryCount,

    preservedCategoryCount,

    categories:
      categoryResults,
  };
}
