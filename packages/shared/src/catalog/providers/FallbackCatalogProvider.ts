import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

import type {
  CatalogCategoryId,
  CatalogProvider,
  CatalogProviderLoad,
  CatalogProviderResult,
  CatalogSourceMetadata,
  ResolvedCatalogProviderResult,
} from "./CatalogProvider";

import {
  createCatalogSourceMetadata,
  getCatalogCacheCompatibleSources,
  loadCatalogCampaignsDetailed,
  loadCatalogCategoryProductsDetailed,
} from "./CatalogProvider";

import {
  getCatalogFallbackReason,
  type CatalogFallbackPredicate,
} from "./CatalogFallbackPolicy";

export type {
  CatalogProviderLoad,
  CatalogSourceMetadata,
} from "./CatalogProvider";

export interface FallbackCatalogProviderOptions {
  readonly shouldFallback?:
    CatalogFallbackPredicate;
}

/**
 * Compatibilidad transitoria para instancias manuales existentes.
 *
 * La composicion realizada por CatalogProviderFactory siempre inyecta
 * la politica segura shouldUseCatalogFallback.
 */
const allowLegacyFallback:
  CatalogFallbackPredicate =
    () => true;

function composeMetadata<T>(
  requestedSource:
    CatalogProvider["source"],

  result:
    ResolvedCatalogProviderResult<T>,

  options: {
    fallbackUsed?:
      boolean;

    fallbackReason?:
      string;
  } = {},
): CatalogSourceMetadata {
  return createCatalogSourceMetadata(
    requestedSource,
    result.metadata
      .resolvedSource,

    {
      fallbackUsed:
        options.fallbackUsed ||
        result.metadata
          .fallbackUsed,

      fallbackReason:
        options.fallbackReason ??
        result.metadata
          .fallbackReason,
    },
  );
}

function composeResult<T>(
  requestedSource:
    CatalogProvider["source"],

  result:
    ResolvedCatalogProviderResult<T>,

  options: {
    fallbackUsed?:
      boolean;

    fallbackReason?:
      string;
  } = {},
): ResolvedCatalogProviderResult<T> {
  const metadata =
    composeMetadata(
      requestedSource,
      result,
      options,
    );

  return {
    data:
      result.data,

    source:
      metadata.resolvedSource,

    issues:
      result.issues,

    metadata,
  };
}

export class FallbackCatalogProvider
  implements CatalogProvider {
  readonly source:
    CatalogProvider["source"];

  readonly cacheCompatibleSources:
    ReadonlyArray<
      CatalogProvider["source"]
    >;

  private readonly shouldFallback:
    CatalogFallbackPredicate;

  constructor(
    private readonly primary:
      CatalogProvider,

    private readonly fallback:
      CatalogProvider,

    options:
      FallbackCatalogProviderOptions = {},
  ) {
    this.source =
      primary.source;

    this.shouldFallback =
      options.shouldFallback ??
      allowLegacyFallback;

    this.cacheCompatibleSources = [
      ...new Set([
        ...getCatalogCacheCompatibleSources(
          primary,
        ),

        ...getCatalogCacheCompatibleSources(
          fallback,
        ),
      ]),
    ];
  }

  getCategories():
    readonly CatalogCategoryId[] {
    return this.primary
      .getCategories();
  }

  async loadCampaigns():
    Promise<Campaign[]> {
    return (
      await this
        .loadCampaignsDetailed()
    ).data;
  }

  async loadCampaignsDetailed():
    Promise<
      CatalogProviderResult<Campaign[]>
    > {
    try {
      const result =
        await loadCatalogCampaignsDetailed(
          this.primary,
        );

      return composeResult(
        this.primary.source,
        result,
      );
    } catch (cause: unknown) {
      if (
        !this.shouldFallback(
          cause,
        )
      ) {
        throw cause;
      }

      const result =
        await loadCatalogCampaignsDetailed(
          this.fallback,
        );

      return composeResult(
        this.primary.source,
        result,

        {
          fallbackUsed:
            true,

          fallbackReason:
            getCatalogFallbackReason(
              cause,
            ),
        },
      );
    }
  }

  async loadCategoryProducts(
    category:
      CatalogCategoryId,

    campaigns:
      readonly Campaign[],
  ): Promise<Product[]> {
    return (
      await this
        .loadCategoryProductsDetailed(
          category,
          campaigns,
        )
    ).data;
  }

  async loadCategoryProductsDetailed(
    category:
      CatalogCategoryId,

    campaigns:
      readonly Campaign[],
  ): Promise<
    CatalogProviderResult<Product[]>
  > {
    try {
      const result =
        await loadCatalogCategoryProductsDetailed(
          this.primary,
          category,
          campaigns,
        );

      return composeResult(
        this.primary.source,
        result,
      );
    } catch (cause: unknown) {
      if (
        !this.shouldFallback(
          cause,
        )
      ) {
        throw cause;
      }

      const result =
        await loadCatalogCategoryProductsDetailed(
          this.fallback,
          category,
          campaigns,
        );

      return composeResult(
        this.primary.source,
        result,

        {
          fallbackUsed:
            true,

          fallbackReason:
            getCatalogFallbackReason(
              cause,
            ),
        },
      );
    }
  }

  async loadCategoryProductsWithMetadata(
    category:
      CatalogCategoryId,

    campaigns:
      readonly Campaign[],
  ): Promise<
    CatalogProviderLoad<Product[]>
  > {
    const result =
      await this
        .loadCategoryProductsDetailed(
          category,
          campaigns,
        );

    return {
      data:
        result.data,

      metadata:
        result.metadata ??
        createCatalogSourceMetadata(
          this.source,
          result.source,
        ),
    };
  }
}