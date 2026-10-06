import {
  createEmptyCatalogComposition,
  type CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

const normalizeIds = (
  values: readonly string[],
): string[] => {
  const seen =
    new Set<string>();

  const result:
    string[] = [];

  values.forEach(
    (value) => {
      const normalized =
        value.trim();

      if (
        !normalized ||
        seen.has(
          normalized,
        )
      ) {
        return;
      }

      seen.add(
        normalized,
      );

      result.push(
        normalized,
      );
    },
  );

  return result;
};

const hasSameIds = (
  currentValues:
    readonly string[],

  nextValues:
    readonly string[],
): boolean => {
  const current =
    normalizeIds(
      currentValues,
    );

  const next =
    normalizeIds(
      nextValues,
    );

  if (
    current.length !==
    next.length
  ) {
    return false;
  }

  const nextIds =
    new Set(
      next,
    );

  return current.every(
    (value) =>
      nextIds.has(
        value,
      ),
  );
};

const activateContentSources = (
  composition:
    CatalogComposition,
): CatalogComposition => ({
  ...composition,

  mode:
    "hybrid",

  filters: {
    ...composition.filters,

    sourceOperator:
      "union",
  },
});

export const createCatalogContentSourcesComposition = (
  productIds:
    readonly string[] =
      [],
): CatalogComposition => {
  const base =
    createEmptyCatalogComposition(
      "hybrid",
    );

  return {
    ...base,

    filters: {
      ...base.filters,

      sourceOperator:
        "union",
    },

    overrides: {
      ...base.overrides,

      includedProductIds:
        normalizeIds(
          productIds,
        ),
    },
  };
};

export const usesCatalogContentSources = (
  composition:
    CatalogComposition,
): boolean =>
  (
    composition.filters
      .sourceOperator ??
    "intersection"
  ) ===
  "union";

export const hasCatalogContentSources = (
  composition:
    CatalogComposition,
): boolean =>
  composition.filters
    .categoryIds.length >
    0 ||
  composition.filters
    .campaignIds.length >
    0 ||
  composition.overrides
    .includedProductIds.length >
    0;

export const setCatalogContentCategoryIds = (
  composition:
    CatalogComposition,

  categoryIds:
    readonly string[],
): CatalogComposition => {
  const normalizedCategoryIds =
    normalizeIds(
      categoryIds,
    );

  if (
    hasSameIds(
      composition.filters
        .categoryIds,
      normalizedCategoryIds,
    )
  ) {
    return composition;
  }

  const active =
    activateContentSources(
      composition,
    );

  return {
    ...active,

    filters: {
      ...active.filters,

      categoryIds:
        normalizedCategoryIds,
    },
  };
};

export const setCatalogContentCampaignIds = (
  composition:
    CatalogComposition,

  campaignIds:
    readonly string[],
): CatalogComposition => {
  const normalizedCampaignIds =
    normalizeIds(
      campaignIds,
    );

  if (
    hasSameIds(
      composition.filters
        .campaignIds,
      normalizedCampaignIds,
    )
  ) {
    return composition;
  }

  const active =
    activateContentSources(
      composition,
    );

  return {
    ...active,

    filters: {
      ...active.filters,

      campaignIds:
        normalizedCampaignIds,
    },
  };
};

export const setCatalogContentProductOverrides = (
  composition:
    CatalogComposition,

  includedProductIds:
    readonly string[],

  excludedProductIds:
    readonly string[],
): CatalogComposition => {
  const normalizedIncludedProductIds =
    normalizeIds(
      includedProductIds,
    );

  const normalizedExcludedProductIds =
    normalizeIds(
      excludedProductIds,
    );

  if (
    hasSameIds(
      composition.overrides
        .includedProductIds,
      normalizedIncludedProductIds,
    ) &&
    hasSameIds(
      composition.overrides
        .excludedProductIds,
      normalizedExcludedProductIds,
    )
  ) {
    return composition;
  }

  const active =
    activateContentSources(
      composition,
    );

  return {
    ...active,

    overrides: {
      ...active.overrides,

      includedProductIds:
        normalizedIncludedProductIds,

      excludedProductIds:
        normalizedExcludedProductIds,
    },
  };
};

export const mergeCatalogContentProductIds = (
  composition:
    CatalogComposition,

  productIds:
    readonly string[],
): CatalogComposition => {
  const includedProductIds =
    normalizeIds([
      ...composition.overrides
        .includedProductIds,

      ...productIds,
    ]);

  if (
    hasSameIds(
      composition.overrides
        .includedProductIds,
      includedProductIds,
    )
  ) {
    return composition;
  }

  return setCatalogContentProductOverrides(
    composition,
    includedProductIds,
    composition.overrides
      .excludedProductIds,
  );
};
