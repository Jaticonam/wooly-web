import {
  loadCatalogCampaignsDetailed,
  loadCatalogCategoryProductsDetailed,
} from "../../catalog/providers/CatalogProvider";

import type {
  CatalogProvider,
  ResolvedCatalogProviderResult,
} from "../../catalog/providers/CatalogProvider";

import {
  getCatalogFallbackErrorCode,
} from "../../catalog/providers/CatalogFallbackPolicy";

import type {
  CatalogSourceMode,
} from "../../config/application/CatalogSourceMode";

import type {
  Product,
} from "@wooly/contracts/types/product";

import type {
  HealthCollector,
  HealthComponentData,
} from "@wooly/contracts/monitoring/contracts/HealthCollector";

export interface CatalogProviderHealthSnapshot {
  requestedSource:
    string;

  resolvedSource:
    string;

  fallbackUsed:
    boolean;

  fallbackReasonCounts:
    Readonly<
      Record<string, number>
    >;

  receivedCount:
    number;

  validCount:
    number;

  rejectedCount:
    number;

  issueCounts:
    Readonly<
      Record<string, number>
    >;

  unsupportedTierCount:
    number;

  durationMs:
    number;

  resolvedSources?:
    readonly CatalogSourceMode[];

  mixedSources?:
    true;
}

interface DetailedProductResult
  extends
    ResolvedCatalogProviderResult<Product[]> {
  diagnostics?: {
    receivedCount?:
      number;

    validCount?:
      number;

    rejectedCount?:
      number;

    unsupportedTierCount?:
      number;
  };
}

function incrementIssue(
  counts:
    Record<string, number>,

  code:
    string,
): void {
  counts[code] =
    (counts[code] ?? 0) + 1;
}

function trackFallbackReason(
  fallbackReasonCounts:
    Record<string, number>,

  issueCounts:
    Record<string, number>,

  reason:
    string | undefined,
): void {
  if (!reason) {
    return;
  }

  incrementIssue(
    fallbackReasonCounts,
    reason,
  );

  if (
    reason ===
      "JUNG_CORE_CIRCUIT_OPEN"
  ) {
    incrementIssue(
      issueCounts,
      reason,
    );
  }
}

export async function collectCatalogProviderHealth(
  provider:
    CatalogProvider,

  requestedSource:
    CatalogSourceMode =
      provider.source,

  now:
    () => number =
      Date.now,
): Promise<
  CatalogProviderHealthSnapshot
> {
  const startedAt =
    now();

  const resolvedSourceSet =
    new Set<CatalogSourceMode>();

  let fallbackUsed =
    false;

  const fallbackReasonCounts:
    Record<string, number> = {};

  let receivedCount =
    0;

  let validCount =
    0;

  let rejectedCount =
    0;

  let unsupportedTierCount =
    0;

  const issueCounts:
    Record<string, number> = {};

  try {
    const campaignResult =
      await loadCatalogCampaignsDetailed(
        provider,
      );

    const campaigns =
      campaignResult.data;

    resolvedSourceSet.add(
      campaignResult
        .metadata
        .resolvedSource,
    );

    fallbackUsed =
      campaignResult
        .metadata
        .fallbackUsed;

    trackFallbackReason(
      fallbackReasonCounts,
      issueCounts,
      campaignResult
        .metadata
        .fallbackReason,
    );

    campaignResult
      .issues
      .forEach(
        (issue) =>
          incrementIssue(
            issueCounts,
            issue.code,
          ),
      );

    for (
      const category of
      provider.getCategories()
    ) {
      const result =
        await loadCatalogCategoryProductsDetailed(
          provider,
          category,
          campaigns,
        ) as
          DetailedProductResult;

      const diagnostics =
        result.diagnostics;

      resolvedSourceSet.add(
        result
          .metadata
          .resolvedSource,
      );

      fallbackUsed =
        fallbackUsed ||
        result
          .metadata
          .fallbackUsed;

      trackFallbackReason(
        fallbackReasonCounts,
        issueCounts,
        result
          .metadata
          .fallbackReason,
      );

      receivedCount +=
        diagnostics
          ?.receivedCount ??
        result.data.length;

      validCount +=
        diagnostics
          ?.validCount ??
        result.data.length;

      rejectedCount +=
        diagnostics
          ?.rejectedCount ??
        0;

      unsupportedTierCount +=
        diagnostics
          ?.unsupportedTierCount ??
        0;

      result
        .issues
        .forEach(
          (issue) =>
            incrementIssue(
              issueCounts,
              issue.code,
            ),
        );
    }
  } catch (cause: unknown) {
    incrementIssue(
      issueCounts,
      "PROVIDER_ERROR",
    );

    const errorCode =
      getCatalogFallbackErrorCode(
        cause,
      );

    if (
      errorCode &&
      errorCode !==
        "PROVIDER_ERROR"
    ) {
      incrementIssue(
        issueCounts,
        errorCode,
      );
    }
  }

  const resolvedSources =
    resolvedSourceSet.size > 0
      ? [...resolvedSourceSet]
      : [provider.source];

  const mixedSources =
    resolvedSources.length > 1;

  if (mixedSources) {
    incrementIssue(
      issueCounts,
      "MIXED_SOURCES",
    );
  }

  return {
    requestedSource,

    resolvedSource:
      mixedSources
        ? "mixed"
        : resolvedSources[0],

    fallbackUsed,
    fallbackReasonCounts,
    receivedCount,
    validCount,
    rejectedCount,
    issueCounts,
    unsupportedTierCount,

    durationMs:
      Math.max(
        0,
        now() - startedAt,
      ),

    ...(
      mixedSources
        ? {
            resolvedSources,
            mixedSources:
              true as const,
          }
        : {}
    ),
  };
}

export class CatalogProviderHealthCollector
  implements
    HealthCollector<HealthComponentData> {
  readonly id =
    "catalog-provider";

  constructor(
    private readonly provider:
      CatalogProvider,

    private readonly requestedSource:
      CatalogSourceMode =
        provider.source,

    private readonly now:
      () => number =
        Date.now,
  ) {}

  async collect():
    Promise<HealthComponentData> {
    const snapshot =
      await collectCatalogProviderHealth(
        this.provider,
        this.requestedSource,
        this.now,
      );

    const providerFailed =
      Boolean(
        snapshot
          .issueCounts
          .PROVIDER_ERROR,
      );

    const degraded =
      snapshot.fallbackUsed ||
      snapshot.rejectedCount > 0 ||
      snapshot.mixedSources ===
        true;

    return {
      status:
        providerFailed
          ? "error"
          : degraded
            ? "warning"
            : "ok",

      score:
        providerFailed
          ? 0
          : degraded
            ? 80
            : 100,

      details:
        snapshot,
    };
  }
}