import type {
  Campaign,
  Product,
} from "../../types/product";

import { isProductPubliclyVisible } from "./ProductCommercialPolicy";

/* =========================================================
   TIPOS DE ENTRADA
   ========================================================= */

export interface CatalogSelectionCategory {
  id: string;
  name: string;
  icon: string;
}

export interface ResolveCatalogSelectionParams {
  products: readonly Product[];
  categories: readonly CatalogSelectionCategory[];
  campaigns: readonly Campaign[];
  categoryId?: string | null;
  campaignId?: string | null;
}

/* =========================================================
   TIPOS DE RESULTADO
   ========================================================= */

export type CatalogSelectionSegmentType =
  | "general"
  | "category"
  | "campaign"
  | "combination";

export type CatalogSelectionWarningCode =
  | "unknown-category"
  | "unknown-campaign"
  | "empty-selection";

export interface CatalogSelectionWarning {
  code: CatalogSelectionWarningCode;
  message: string;
}

export interface CatalogSelectionResult {
  categoryId: string;
  categoryLabel: string;
  categoryIcon: string;

  campaignId: string;
  campaignLabel: string;
  campaignIcon: string;

  category?: CatalogSelectionCategory;
  campaign?: Campaign;

  products: Product[];
  productCount: number;

  hasCategory: boolean;
  hasCampaign: boolean;
  isCombination: boolean;
  isEmpty: boolean;

  segmentType: CatalogSelectionSegmentType;
  warnings: CatalogSelectionWarning[];
}

/* =========================================================
   NORMALIZACIÓN
   ========================================================= */

export function normalizeCatalogSelectionValue(
  value: unknown,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategoryId(
  value: unknown,
): string {
  const normalized =
    normalizeCatalogSelectionValue(value);

  return normalized === "todas"
    ? ""
    : normalized;
}

/* =========================================================
   REGLAS DE PRODUCTO
   ========================================================= */

function isSelectableProduct(
  product: Product,
): boolean {
  return isProductPubliclyVisible(
    product,
  );
}

function productMatchesCategory(
  product: Product,
  categoryId: string,
): boolean {
  if (!categoryId) {
    return true;
  }

  return (
    normalizeCatalogSelectionValue(
      product.category,
    ) === categoryId
  );
}

function productMatchesCampaign(
  product: Product,
  campaignId: string,
): boolean {
  if (!campaignId) {
    return true;
  }

  return Boolean(
    product.campaigns?.some(
      (productCampaignId) =>
        normalizeCatalogSelectionValue(
          productCampaignId,
        ) === campaignId,
    ),
  );
}

const catalogTextCollator =
  new Intl.Collator(
    "es",
    {
      numeric: true,
      sensitivity: "base",
    },
  );

const compareCatalogText = (
  firstValue: unknown,
  secondValue: unknown,
): number =>
  catalogTextCollator.compare(
    normalizeCatalogSelectionValue(
      firstValue,
    ),
    normalizeCatalogSelectionValue(
      secondValue,
    ),
  );

const getProductPriority = (
  product: Product,
): number => {
  const priority =
    Number(product.priority ?? 0);

  return Number.isFinite(priority)
    ? priority
    : 0;
};

function buildCategoryOrderMap(
  categories:
    readonly CatalogSelectionCategory[],
): Map<string, number> {
  const categoryOrder =
    new Map<string, number>();

  categories.forEach(
    (category) => {
      const categoryId =
        normalizeCatalogSelectionValue(
          category.id,
        );

      if (
        !categoryId ||
        categoryId === "todas" ||
        categoryOrder.has(categoryId)
      ) {
        return;
      }

      categoryOrder.set(
        categoryId,
        categoryOrder.size,
      );
    },
  );

  return categoryOrder;
}

interface SortCatalogProductsParams {
  products: readonly Product[];
  categories:
    readonly CatalogSelectionCategory[];
  groupByCategory: boolean;
}

function sortCatalogProducts({
  products,
  categories,
  groupByCategory,
}: SortCatalogProductsParams): Product[] {
  const categoryOrder =
    buildCategoryOrderMap(
      categories,
    );

  return [...products].sort(
    (firstProduct, secondProduct) => {
      if (groupByCategory) {
        const firstCategory =
          normalizeCatalogSelectionValue(
            firstProduct.category,
          );

        const secondCategory =
          normalizeCatalogSelectionValue(
            secondProduct.category,
          );

        const firstCategoryOrder =
          categoryOrder.get(
            firstCategory,
          ) ??
          Number.MAX_SAFE_INTEGER;

        const secondCategoryOrder =
          categoryOrder.get(
            secondCategory,
          ) ??
          Number.MAX_SAFE_INTEGER;

        if (
          firstCategoryOrder !==
          secondCategoryOrder
        ) {
          return (
            firstCategoryOrder -
            secondCategoryOrder
          );
        }

        const categoryComparison =
          compareCatalogText(
            firstCategory,
            secondCategory,
          );

        if (categoryComparison !== 0) {
          return categoryComparison;
        }
      }

      const priorityComparison =
        getProductPriority(
          secondProduct,
        ) -
        getProductPriority(
          firstProduct,
        );

      if (priorityComparison !== 0) {
        return priorityComparison;
      }

      const idComparison =
        compareCatalogText(
          firstProduct.id,
          secondProduct.id,
        );

      if (idComparison !== 0) {
        return idComparison;
      }

      return compareCatalogText(
        firstProduct.title,
        secondProduct.title,
      );
    },
  );
}

/* =========================================================
   RESOLUCIÓN DE REGISTROS
   ========================================================= */

function findCategory(
  categories: readonly CatalogSelectionCategory[],
  categoryId: string,
) {
  if (!categoryId) {
    return undefined;
  }

  return categories.find(
    (category) =>
      normalizeCatalogSelectionValue(
        category.id,
      ) === categoryId,
  );
}

function findCampaign(
  campaigns: readonly Campaign[],
  campaignId: string,
) {
  if (!campaignId) {
    return undefined;
  }

  return campaigns.find(
    (campaign) =>
      normalizeCatalogSelectionValue(
        campaign.id,
      ) === campaignId,
  );
}

function getSegmentType(
  hasCategory: boolean,
  hasCampaign: boolean,
): CatalogSelectionSegmentType {
  if (hasCategory && hasCampaign) {
    return "combination";
  }

  if (hasCategory) {
    return "category";
  }

  if (hasCampaign) {
    return "campaign";
  }

  return "general";
}

/* =========================================================
   RESOLVER PRINCIPAL
   ========================================================= */

export function resolveCatalogSelection({
  products,
  categories,
  campaigns,
  categoryId,
  campaignId,
}: ResolveCatalogSelectionParams): CatalogSelectionResult {
  const requestedCategoryId =
    normalizeCategoryId(categoryId);

  const requestedCampaignId =
    normalizeCatalogSelectionValue(
      campaignId,
    );

  const hasCategory =
    Boolean(requestedCategoryId);

  const hasCampaign =
    Boolean(requestedCampaignId);

  const category = findCategory(
    categories,
    requestedCategoryId,
  );

  const campaign = findCampaign(
    campaigns,
    requestedCampaignId,
  );

  const warnings:
    CatalogSelectionWarning[] = [];

  if (hasCategory && !category) {
    warnings.push({
      code: "unknown-category",
      message:
        `La categoría "${requestedCategoryId}" no existe en el registro oficial.`,
    });
  }

  if (hasCampaign && !campaign) {
    warnings.push({
      code: "unknown-campaign",
      message:
        `La campaña "${requestedCampaignId}" no existe en el registro oficial.`,
    });
  }

  const hasInvalidFilter =
    (hasCategory && !category) ||
    (hasCampaign && !campaign);

  const selectedProducts =
    hasInvalidFilter
      ? []
      : sortCatalogProducts({
          products:
            products.filter(
              (product) =>
                isSelectableProduct(
                  product,
                ) &&
                productMatchesCategory(
                  product,
                  requestedCategoryId,
                ) &&
                productMatchesCampaign(
                  product,
                  requestedCampaignId,
                ),
            ),

          categories,

          /**
           * Catálogo general y campañas completas:
           * primero se agrupan por categoría oficial.
           *
           * Categoría y combinación:
           * todos los productos ya pertenecen a una
           * misma categoría.
           */
          groupByCategory:
            !hasCategory,
        });

  if (selectedProducts.length === 0) {
    warnings.push({
      code: "empty-selection",
      message:
        "La selección actual no contiene productos disponibles.",
    });
  }

  const canonicalCategoryId =
    category?.id ?? requestedCategoryId;

  const canonicalCampaignId =
    campaign?.id ?? requestedCampaignId;

  return {
    categoryId: canonicalCategoryId,
    categoryLabel:
      category?.name ??
      (hasCategory
        ? requestedCategoryId
        : "Todo el catálogo"),
    categoryIcon:
      category?.icon ?? "📦",

    campaignId: canonicalCampaignId,
    campaignLabel:
      campaign?.name ??
      (hasCampaign
        ? requestedCampaignId
        : "Sin campaña específica"),
    campaignIcon:
      campaign?.icon ?? "",

    category,
    campaign,

    products: selectedProducts,
    productCount: selectedProducts.length,

    hasCategory,
    hasCampaign,
    isCombination:
      hasCategory && hasCampaign,
    isEmpty:
      selectedProducts.length === 0,

    segmentType: getSegmentType(
      hasCategory,
      hasCampaign,
    ),
    warnings,
  };
}


