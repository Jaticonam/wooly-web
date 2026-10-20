import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

import {
  createEmptyCatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import {
  resolveCatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogCompositionResolver";

import {
  normalizeCatalogSelectionValue,
  type CatalogSelectionCategory,
  type CatalogSelectionSegmentType,
} from "@wooly/contracts/catalog/domain/CatalogSelection";

import type {
  CatalogPdfLinkContractV2,
} from "@wooly/contracts/catalog-tools/services/CatalogPdfLinkContract";

import {
  mixStrategicCatalogProducts,
} from "@wooly/shared/catalog-export/services/StrategicCatalogMixer";

export interface CatalogPdfV2SelectionResult {
  products: Product[];

  categoryIds: string[];
  campaignIds: string[];

  categoryLabels: string[];
  campaignLabels: string[];

  hasCategory: boolean;
  hasCampaign: boolean;
  isCombination: boolean;
  isEmpty: boolean;

  segmentType: CatalogSelectionSegmentType;

  showCategorySections: boolean;

  unknownCategoryIds: string[];
  unknownCampaignIds: string[];
}

interface ResolveCatalogPdfV2SelectionParams {
  products: readonly Product[];

  categories:
    readonly CatalogSelectionCategory[];

  campaigns:
    readonly Campaign[];

  contract:
    CatalogPdfLinkContractV2;
}

const buildRegistryMap = <
  T extends {
    id: string;
  },
>(
  values: readonly T[],
) => {
  const registry =
    new Map<string, T>();

  values.forEach(
    (value) => {
      const id =
        normalizeCatalogSelectionValue(
          value.id,
        );

      if (
        !id ||
        id === "todas" ||
        registry.has(id)
      ) {
        return;
      }

      registry.set(
        id,
        value,
      );
    },
  );

  return registry;
};

const normalizeIds = (
  values: readonly string[],
) =>
  Array.from(
    new Set(
      values
        .map(
          normalizeCatalogSelectionValue,
        )
        .filter(Boolean),
    ),
  );

const getSegmentType = (
  hasCategory: boolean,
  hasCampaign: boolean,
): CatalogSelectionSegmentType => {
  if (
    hasCategory &&
    hasCampaign
  ) {
    return "combination";
  }

  if (hasCategory) {
    return "category";
  }

  if (hasCampaign) {
    return "campaign";
  }

  return "general";
};

export function resolveCatalogPdfV2Selection({
  products,
  categories,
  campaigns,
  contract,
}: ResolveCatalogPdfV2SelectionParams):
  CatalogPdfV2SelectionResult {
  const categoryIds =
    normalizeIds(
      contract.categoryIds,
    );

  const campaignIds =
    normalizeIds(
      contract.campaignIds,
    );

  const categoryRegistry =
    buildRegistryMap(
      categories,
    );

  const campaignRegistry =
    buildRegistryMap(
      campaigns,
    );

  const unknownCategoryIds =
    categoryIds.filter(
      (categoryId) =>
        !categoryRegistry.has(
          categoryId,
        ),
    );

  const unknownCampaignIds =
    campaignIds.filter(
      (campaignId) =>
        !campaignRegistry.has(
          campaignId,
        ),
    );

  const hasCategory =
    categoryIds.length > 0;

  const hasCampaign =
    campaignIds.length > 0;

  const hasInvalidFilter =
    unknownCategoryIds.length > 0 ||
    unknownCampaignIds.length > 0;

  const composition =
    createEmptyCatalogComposition(
      "automatic",
    );

  composition.filters = {
    ...composition.filters,

    categoryIds,
    campaignIds,
  };

  const resolution =
    hasInvalidFilter
      ? null
      : resolveCatalogComposition({
          products,
          composition,
        });

  const selectedProducts =
    resolution?.products ??
    [];

  const editorialProducts =
    mixStrategicCatalogProducts({
      products:
        selectedProducts,

      campaigns,

      selectedCampaignIds:
        campaignIds,
    });

  return {
    products:
      editorialProducts,

    categoryIds,
    campaignIds,

    categoryLabels:
      categoryIds.map(
        (categoryId) =>
          categoryRegistry.get(
            categoryId,
          )?.name ??
          categoryId,
      ),

    campaignLabels:
      campaignIds.map(
        (campaignId) =>
          campaignRegistry.get(
            campaignId,
          )?.name ??
          campaignId,
      ),

    hasCategory,
    hasCampaign,

    isCombination:
      hasCategory &&
      hasCampaign,

    isEmpty:
      selectedProducts.length ===
      0,

    segmentType:
      getSegmentType(
        hasCategory,
        hasCampaign,
      ),

    showCategorySections:
      categoryIds.length !==
      1,

    unknownCategoryIds,
    unknownCampaignIds,
  };
}

const joinLabels = (
  values: readonly string[],
) =>
  values.join(
    " + ",
  );

export function buildCatalogPdfV2Copy(
  selection:
    CatalogPdfV2SelectionResult,
) {
  const categoryLabel =
    joinLabels(
      selection.categoryLabels,
    );

  const campaignLabel =
    joinLabels(
      selection.campaignLabels,
    );

  if (
    selection.isCombination
  ) {
    return {
      title:
        `Catálogo Mayorista · ${categoryLabel}`,

      subtitle:
        `Selección comercial de ${categoryLabel} para ${campaignLabel}. Precios y productos sujetos a disponibilidad.`,

      segmentLabel:
        `${categoryLabel} · ${campaignLabel}`,

      segmentType:
        "combination" as const,
    };
  }

  if (
    selection.hasCampaign
  ) {
    return {
      title:
        `Catálogo Mayorista · ${campaignLabel}`,

      subtitle:
        `Productos seleccionados para ${campaignLabel}. Precios y productos sujetos a disponibilidad.`,

      segmentLabel:
        campaignLabel,

      segmentType:
        "campaign" as const,
    };
  }

  if (
    selection.hasCategory
  ) {
    return {
      title:
        `Catálogo Mayorista · ${categoryLabel}`,

      subtitle:
        `Selección comercial de productos de ${categoryLabel} para pedidos mayoristas.`,

      segmentLabel:
        categoryLabel,

      segmentType:
        "category" as const,
    };
  }

  return {
    title:
      "Catálogo Mayorista",

    subtitle:
      "Productos seleccionados para emprendedores, tiendas y ventas por campaña.",

    segmentLabel:
      "General",

    segmentType:
      "general" as const,
  };
}
