import type {
  CatalogCampaignContract,
} from "./CampaignContract";

import {
  validateCatalogCampaignContractV1,
} from "./CatalogCampaignContractValidation";

import type {
  CatalogCategoryContract,
} from "./CategoryContract";

import {
  validateCatalogCategoryContractV1,
} from "./CatalogCategoryContractValidation";

import {
  CATALOG_SNAPSHOT_CONTRACT_VERSION,
  type CatalogSnapshotContract,
} from "./CatalogSnapshotContract";

import type {
  CatalogProductContract,
} from "./ProductContract";

import {
  validateCatalogProductContractV1,
} from "./CatalogProductContractValidation";

export interface CatalogSnapshotContractIssue {
  code: string;
  path: string;
  message: string;
  value?: unknown;
}

export type CatalogSnapshotContractValidationResult =
  | {
      ok: true;
      data: CatalogSnapshotContract;
    }
  | {
      ok: false;
      errors:
        readonly CatalogSnapshotContractIssue[];
    };

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonEmptyText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    Boolean(value.trim())
  );
}

function isValidDate(
  value: unknown,
): value is string {
  return (
    isNonEmptyText(value) &&
    !Number.isNaN(
      Date.parse(value),
    )
  );
}

function pushIssue(
  errors:
    CatalogSnapshotContractIssue[],
  code: string,
  path: string,
  message: string,
  value?: unknown,
): void {
  errors.push({
    code,
    path,
    message,
    value,
  });
}

function nestedPath(
  collection: string,
  index: number,
  path: string,
): string {
  return path
    ? `${collection}[${index}].${path}`
    : `${collection}[${index}]`;
}

function reportDuplicateValues(
  values: readonly string[],
  collection: string,
  field: string,
  errors:
    CatalogSnapshotContractIssue[],
): void {
  const firstIndexByValue =
    new Map<string, number>();

  values.forEach(
    (value, index) => {
      const firstIndex =
        firstIndexByValue.get(value);

      if (firstIndex !== undefined) {
        pushIssue(
          errors,
          "DUPLICATE_IDENTIFIER",
          `${collection}[${index}].${field}`,
          `${field} duplica el valor de ${collection}[${firstIndex}].${field}.`,
          value,
        );
        return;
      }

      firstIndexByValue.set(
        value,
        index,
      );
    },
  );
}

export function validateCatalogSnapshotContractV1(
  value: unknown,
): CatalogSnapshotContractValidationResult {
  const errors:
    CatalogSnapshotContractIssue[] = [];

  if (!isRecord(value)) {
    return {
      ok: false,
      errors: [{
        code: "INVALID_OBJECT",
        path: "",
        message:
          "El snapshot debe ser un objeto.",
        value,
      }],
    };
  }

  if (
    value.contractVersion !==
      CATALOG_SNAPSHOT_CONTRACT_VERSION
  ) {
    pushIssue(
      errors,
      "UNSUPPORTED_CONTRACT_VERSION",
      "contractVersion",
      `contractVersion debe ser ${CATALOG_SNAPSHOT_CONTRACT_VERSION}.`,
      value.contractVersion,
    );
  }

  if (!isNonEmptyText(value.brandId)) {
    pushIssue(
      errors,
      "EMPTY_FIELD",
      "brandId",
      "brandId debe ser texto no vacÃ­o.",
      value.brandId,
    );
  }

  if (!isNonEmptyText(value.revision)) {
    pushIssue(
      errors,
      "EMPTY_FIELD",
      "revision",
      "revision debe ser texto no vacÃ­o.",
      value.revision,
    );
  }

  if (!isValidDate(value.generatedAt)) {
    pushIssue(
      errors,
      "INVALID_DATE",
      "generatedAt",
      "generatedAt debe ser una fecha vÃ¡lida.",
      value.generatedAt,
    );
  }

  const rawCategories =
    Array.isArray(value.categories)
      ? value.categories
      : [];

  const rawCampaigns =
    Array.isArray(value.campaigns)
      ? value.campaigns
      : [];

  const rawProducts =
    Array.isArray(value.products)
      ? value.products
      : [];

  if (!Array.isArray(value.categories)) {
    pushIssue(
      errors,
      "INVALID_FIELD_TYPE",
      "categories",
      "categories debe ser un array.",
      value.categories,
    );
  }

  if (!Array.isArray(value.campaigns)) {
    pushIssue(
      errors,
      "INVALID_FIELD_TYPE",
      "campaigns",
      "campaigns debe ser un array.",
      value.campaigns,
    );
  }

  if (!Array.isArray(value.products)) {
    pushIssue(
      errors,
      "INVALID_FIELD_TYPE",
      "products",
      "products debe ser un array.",
      value.products,
    );
  }

  const categories:
    CatalogCategoryContract[] = [];

  rawCategories.forEach(
    (category, index) => {
      const result =
        validateCatalogCategoryContractV1(
          category,
        );

      if (result.ok === true) {
        categories.push(
          result.data,
        );
        return;
      }

      result.errors.forEach(
        (issue) => {
          pushIssue(
            errors,
            issue.code,
            nestedPath(
              "categories",
              index,
              issue.path,
            ),
            issue.message,
            issue.value,
          );
        },
      );
    },
  );

  const campaigns:
    CatalogCampaignContract[] = [];

  rawCampaigns.forEach(
    (campaign, index) => {
      const result =
        validateCatalogCampaignContractV1(
          campaign,
        );

      if (result.ok === true) {
        campaigns.push(
          result.data,
        );
        return;
      }

      result.errors.forEach(
        (issue) => {
          pushIssue(
            errors,
            issue.code,
            nestedPath(
              "campaigns",
              index,
              issue.path,
            ),
            issue.message,
            issue.value,
          );
        },
      );
    },
  );

  const products:
    CatalogProductContract[] = [];

  rawProducts.forEach(
    (product, index) => {
      const result =
        validateCatalogProductContractV1(
          product,
        );

      if (result.ok === true) {
        products.push(
          result.data,
        );
        return;
      }

      result.errors.forEach(
        (issue) => {
          pushIssue(
            errors,
            issue.code,
            nestedPath(
              "products",
              index,
              issue.path,
            ),
            issue.message,
            issue.value,
          );
        },
      );
    },
  );

  reportDuplicateValues(
    categories.map(
      (category) =>
        category.id,
    ),
    "categories",
    "id",
    errors,
  );

  reportDuplicateValues(
    categories.map(
      (category) =>
        category.slug,
    ),
    "categories",
    "slug",
    errors,
  );

  reportDuplicateValues(
    campaigns.map(
      (campaign) =>
        campaign.id,
    ),
    "campaigns",
    "id",
    errors,
  );

  reportDuplicateValues(
    campaigns.map(
      (campaign) =>
        campaign.slug,
    ),
    "campaigns",
    "slug",
    errors,
  );

  reportDuplicateValues(
    products.map(
      (product) =>
        product.id,
    ),
    "products",
    "id",
    errors,
  );

  reportDuplicateValues(products.flatMap(product => product.code ? [product.code] : []), "products", "code", errors);
  reportDuplicateValues(products.flatMap(product => product.barcode ? [product.barcode] : []), "products", "barcode", errors);
  reportDuplicateValues(
    products.flatMap(product => product.sku ? [product.sku] : []),
    "products",
    "sku",
    errors,
  );

  reportDuplicateValues(
    products.map(
      (product) =>
        product.slug,
    ),
    "products",
    "slug",
    errors,
  );

  const categoryIds =
    new Set(
      categories.map(
        (category) =>
          category.id,
      ),
    );

  const campaignIds =
    new Set(
      campaigns.map(
        (campaign) =>
          campaign.id,
      ),
    );

  const brandId =
    isNonEmptyText(value.brandId)
      ? value.brandId
      : null;

  products.forEach(
    (product, productIndex) => {
      if (
        brandId &&
        product.brandId !== brandId
      ) {
        pushIssue(
          errors,
          "BRAND_MISMATCH",
          `products[${productIndex}].brandId`,
          "El producto pertenece a una marca distinta del snapshot.",
          product.brandId,
        );
      }

      if (
        !categoryIds.has(
          product.categoryId,
        )
      ) {
        pushIssue(
          errors,
          "UNKNOWN_CATEGORY",
          `products[${productIndex}].categoryId`,
          "categoryId no existe en categories.",
          product.categoryId,
        );
      }

      product.campaignIds.forEach(
        (campaignId, campaignIndex) => {
          if (
            !campaignIds.has(
              campaignId,
            )
          ) {
            pushIssue(
              errors,
              "UNKNOWN_CAMPAIGN",
              `products[${productIndex}].campaignIds[${campaignIndex}]`,
              "campaignId no existe en campaigns.",
              campaignId,
            );
          }
        },
      );
    },
  );

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      contractVersion:
        CATALOG_SNAPSHOT_CONTRACT_VERSION,
      brandId:
        value.brandId as string,
      revision:
        value.revision as string,
      generatedAt:
        value.generatedAt as string,
      categories,
      campaigns,
      products,
    },
  };
}