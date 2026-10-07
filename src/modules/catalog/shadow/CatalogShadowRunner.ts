import type {
  CatalogProvider,
} from "@/modules/catalog/providers/CatalogProvider";

import {
  compareCatalogProvidersShadow,
  type CatalogShadowComparison,
  type CatalogShadowDifference,
} from "./CatalogShadowComparison";

export type CatalogShadowRunStatus =
  | "ready"
  | "unavailable"
  | "error";

export interface CatalogShadowSummary {
  leftSource:
    string;

  rightSource:
    string;

  leftCategoryCount:
    number;

  rightCategoryCount:
    number;

  leftCampaignCount:
    number;

  rightCampaignCount:
    number;

  leftProductCount:
    number;

  rightProductCount:
    number;

  differenceCount:
    number;

  equivalent:
    boolean;

  categories:
    number;

  campaigns:
    number;

  products:
    number;

  other:
    number;

  missingLeft:
    number;

  missingRight:
    number;

  valueMismatch:
    number;
}

interface CatalogShadowRunBase {
  startedAt:
    string;

  completedAt:
    string;

  durationMs:
    number;
}

export interface CatalogShadowReadyResult
  extends CatalogShadowRunBase {
  status:
    "ready";

  comparison:
    CatalogShadowComparison;

  summary:
    CatalogShadowSummary;
}

export interface CatalogShadowFailureResult
  extends CatalogShadowRunBase {
  status:
    "unavailable" |
    "error";

  errorCode:
    string | null;

  message:
    string;
}

export type CatalogShadowRunResult =
  | CatalogShadowReadyResult
  | CatalogShadowFailureResult;

export interface RunCatalogShadowComparisonOptions {
  readonly leftProvider:
    CatalogProvider;

  readonly rightProvider:
    CatalogProvider;

  readonly now?:
    () => number;
}

const UNAVAILABLE_CODES =
  new Set([
    "HTTP_TIMEOUT",
    "HTTP_NETWORK_ERROR",
    "HTTP_401",
    "HTTP_403",
    "HTTP_404",
    "HTTP_502",
    "HTTP_503",
    "HTTP_504",
    "CONFIGURATION_ERROR",
    "JUNG_CORE_CIRCUIT_OPEN",
    "JUNG_CORE_SNAPSHOT_LOAD_FAILED",
  ]);

function readErrorCode(
  cause:
    unknown,
): string | null {
  if (
    typeof cause !==
      "object" ||
    cause ===
      null ||
    !(
      "code" in
      cause
    )
  ) {
    return null;
  }

  const code =
    String(
      (
        cause as {
          code?: unknown;
        }
      ).code ??
        "",
    ).trim();

  return code ||
    null;
}

function differenceGroup(
  difference:
    CatalogShadowDifference,
):
  | "categories"
  | "campaigns"
  | "products"
  | "other" {
  if (
    difference.path.startsWith(
      "categories",
    )
  ) {
    return "categories";
  }

  if (
    difference.path.startsWith(
      "campaigns",
    )
  ) {
    return "campaigns";
  }

  if (
    difference.path.startsWith(
      "products",
    )
  ) {
    return "products";
  }

  return "other";
}

function summarize(
  comparison:
    CatalogShadowComparison,
): CatalogShadowSummary {
  let categories =
    0;

  let campaigns =
    0;

  let products =
    0;

  let other =
    0;

  let missingLeft =
    0;

  let missingRight =
    0;

  let valueMismatch =
    0;

  comparison.differences
    .forEach(
      (difference) => {
        switch (
          differenceGroup(
            difference,
          )
        ) {
          case "categories":
            categories +=
              1;
            break;

          case "campaigns":
            campaigns +=
              1;
            break;

          case "products":
            products +=
              1;
            break;

          default:
            other +=
              1;
            break;
        }

        switch (
          difference.kind
        ) {
          case "missing-left":
            missingLeft +=
              1;
            break;

          case "missing-right":
            missingRight +=
              1;
            break;

          case "value-mismatch":
            valueMismatch +=
              1;
            break;
        }
      },
    );

  return {
    leftSource:
      comparison.left
        .source,

    rightSource:
      comparison.right
        .source,

    leftCategoryCount:
      comparison.left
        .categories
        .length,

    rightCategoryCount:
      comparison.right
        .categories
        .length,

    leftCampaignCount:
      comparison.left
        .campaigns
        .length,

    rightCampaignCount:
      comparison.right
        .campaigns
        .length,

    leftProductCount:
      comparison.left
        .products
        .length,

    rightProductCount:
      comparison.right
        .products
        .length,

    differenceCount:
      comparison.differences
        .length,

    equivalent:
      comparison.equivalent,

    categories,
    campaigns,
    products,
    other,

    missingLeft,
    missingRight,
    valueMismatch,
  };
}

function isoDate(
  value:
    number,
): string {
  return new Date(
    value,
  ).toISOString();
}

export async function runCatalogShadowComparison(
  options:
    RunCatalogShadowComparisonOptions,
): Promise<
  CatalogShadowRunResult
> {
  const now =
    options.now ??
    Date.now;

  const startedAtMs =
    now();

  try {
    const comparison =
      await compareCatalogProvidersShadow(
        options.leftProvider,
        options.rightProvider,
      );

    const completedAtMs =
      now();

    return {
      status:
        "ready",

      comparison,

      summary:
        summarize(
          comparison,
        ),

      startedAt:
        isoDate(
          startedAtMs,
        ),

      completedAt:
        isoDate(
          completedAtMs,
        ),

      durationMs:
        Math.max(
          0,
          completedAtMs -
            startedAtMs,
        ),
    };
  } catch (
    cause:
      unknown
  ) {
    const completedAtMs =
      now();

    const errorCode =
      readErrorCode(
        cause,
      );

    const unavailable =
      errorCode !==
        null &&
      UNAVAILABLE_CODES.has(
        errorCode,
      );

    return {
      status:
        unavailable
          ? "unavailable"
          : "error",

      errorCode,

      message:
        unavailable
          ? "Shadow de JUNG CORE no disponible en este entorno."
          : "No se pudo completar la comparación Shadow de JUNG CORE.",

      startedAt:
        isoDate(
          startedAtMs,
        ),

      completedAt:
        isoDate(
          completedAtMs,
        ),

      durationMs:
        Math.max(
          0,
          completedAtMs -
            startedAtMs,
        ),
    };
  }
}