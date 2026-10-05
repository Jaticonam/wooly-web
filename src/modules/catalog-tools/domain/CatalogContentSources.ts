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
  const active =
    activateContentSources(
      composition,
    );

  return {
    ...active,

    filters: {
      ...active.filters,

      categoryIds:
        normalizeIds(
          categoryIds,
        ),
    },
  };
};

export const setCatalogContentCampaignIds = (
  composition:
    CatalogComposition,

  campaignIds:
    readonly string[],
): CatalogComposition => {
  const active =
    activateContentSources(
      composition,
    );

  return {
    ...active,

    filters: {
      ...active.filters,

      campaignIds:
        normalizeIds(
          campaignIds,
        ),
    },
  };
};

export const mergeCatalogContentProductIds = (
  composition:
    CatalogComposition,

  productIds:
    readonly string[],
): CatalogComposition => {
  const active =
    activateContentSources(
      composition,
    );

  return {
    ...active,

    overrides: {
      ...active.overrides,

      includedProductIds:
        normalizeIds([
          ...active.overrides
            .includedProductIds,

          ...productIds,
        ]),
    },
  };
};