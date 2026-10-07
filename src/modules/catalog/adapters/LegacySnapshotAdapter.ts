import type {
  CatalogSnapshotContract,
  CatalogSnapshotContractIssue,
  CatalogVolumePriceContract,
} from "@/shared/contracts/catalog";

import {
  validateCatalogSnapshotContractV1,
} from "@/shared/contracts/catalog";

import type {
  Campaign,
  Product,
} from "@/shared/types/product";

import type {
  CatalogCategoryId,
} from "@/modules/catalog/providers/CatalogProvider";

import {
  adaptCatalogProductToLegacyProduct,
  type LegacyAdaptationIssueCode,
} from "./LegacyProductAdapter";

import {
  mapCatalogCampaignToLegacyCampaign,
  type LegacyCampaignAdapterOptions,
} from "./LegacyCampaignAdapter";

export type LegacySnapshotAdapterOptions =
  LegacyCampaignAdapterOptions;

export interface CatalogSnapshotProductIssue {
  productIndex: number;
  productId: string;
  sku: string | null;
  categoryId: string;

  code: LegacyAdaptationIssueCode;
  path: string;
  message: string;

  value?:
    | string
    | number
    | boolean
    | null;
}

export interface CatalogSnapshotUnsupportedVolumePrice {
  productIndex: number;
  productId: string;
  sku: string | null;
  categoryId: string;

  volumePrice:
    CatalogVolumePriceContract;
}

export interface CatalogSnapshotCompatibilityResult {
  brandId: string;
  revision: string;
  generatedAt: string;

  categories:
    readonly CatalogCategoryId[];

  campaigns:
    readonly Campaign[];

  productsByCategory:
    ReadonlyMap<
      CatalogCategoryId,
      readonly Product[]
    >;

  productIssues:
    readonly CatalogSnapshotProductIssue[];

  unsupportedVolumePrices:
    readonly CatalogSnapshotUnsupportedVolumePrice[];
}

export type ValidatedLegacySnapshotAdaptationResult =
  | {
      ok: true;
      data:
        CatalogSnapshotCompatibilityResult;
    }
  | {
      ok: false;
      errors:
        readonly CatalogSnapshotContractIssue[];
    };

function comparePriority(
  leftPriority: number,
  rightPriority: number,
  leftIndex: number,
  rightIndex: number,
): number {
  return (
    rightPriority -
      leftPriority ||
    leftIndex -
      rightIndex
  );
}

function productIssuePath(
  productIndex: number,
  path: string,
): string {
  return path
    ? `products[${productIndex}].${path}`
    : `products[${productIndex}]`;
}

function sortProducts(
  products: readonly Product[],
): Product[] {
  return products
    .map(
      (product, index) => ({
        product,
        index,
      }),
    )
    .sort(
      (left, right) =>
        comparePriority(
          left.product.priority ?? 0,
          right.product.priority ?? 0,
          left.index,
          right.index,
        ),
    )
    .map(
      ({ product }) =>
        product,
    );
}

export function adaptCatalogSnapshotToLegacy(
  snapshot:
    CatalogSnapshotContract,

  options:
    LegacySnapshotAdapterOptions,
): CatalogSnapshotCompatibilityResult {
  const categories =
    snapshot.categories
      .map(
        (category, index) => ({
          category,
          index,
        }),
      )
      .filter(
        ({ category }) =>
          category.publicationStatus ===
            "published",
      )
      .sort(
        (left, right) =>
          comparePriority(
            left.category.priority,
            right.category.priority,
            left.index,
            right.index,
          ),
      )
      .map(
        ({ category }) =>
          category.id as
            CatalogCategoryId,
      );

  const campaigns =
    snapshot.campaigns
      .map(
        (campaign, index) => ({
          campaign,
          index,
        }),
      )
      .sort(
        (left, right) =>
          comparePriority(
            left.campaign.priority,
            right.campaign.priority,
            left.index,
            right.index,
          ),
      )
      .map(
        ({ campaign }) =>
          mapCatalogCampaignToLegacyCampaign(
            campaign,
            options,
          ),
      );

  const mutableProductsByCategory =
    new Map<
      CatalogCategoryId,
      Product[]
    >();

  snapshot.categories.forEach(
    (category) => {
      mutableProductsByCategory.set(
        category.id as
          CatalogCategoryId,
        [],
      );
    },
  );

  const productIssues:
    CatalogSnapshotProductIssue[] = [];

  const unsupportedVolumePrices:
    CatalogSnapshotUnsupportedVolumePrice[] = [];

  snapshot.products.forEach(
    (contract, productIndex) => {
      const adaptation =
        adaptCatalogProductToLegacyProduct(
          contract,
        );

      const categoryId =
        contract.categoryId as
          CatalogCategoryId;

      const products =
        mutableProductsByCategory.get(
          categoryId,
        ) ?? [];

      products.push(
        adaptation.product,
      );

      mutableProductsByCategory.set(
        categoryId,
        products,
      );

      adaptation.issues.forEach(
        (issue) => {
          productIssues.push({
            productIndex,
            productId:
              contract.id,
            sku:
              contract.sku,
            categoryId:
              contract.categoryId,
            code:
              issue.code,
            path:
              productIssuePath(
                productIndex,
                issue.path,
              ),
            message:
              issue.message,
            value:
              issue.value,
          });
        },
      );

      adaptation
        .unsupportedVolumePrices
        .forEach(
          (volumePrice) => {
            unsupportedVolumePrices.push({
              productIndex,
              productId:
                contract.id,
              sku:
                contract.sku,
              categoryId:
                contract.categoryId,
              volumePrice,
            });
          },
        );
    },
  );

  const productsByCategory =
    new Map<
      CatalogCategoryId,
      readonly Product[]
    >();

  mutableProductsByCategory.forEach(
    (products, categoryId) => {
      productsByCategory.set(
        categoryId,
        sortProducts(products),
      );
    },
  );

  return {
    brandId:
      snapshot.brandId,
    revision:
      snapshot.revision,
    generatedAt:
      snapshot.generatedAt,
    categories,
    campaigns,
    productsByCategory,
    productIssues,
    unsupportedVolumePrices,
  };
}

export function validateAndAdaptCatalogSnapshotToLegacy(
  value: unknown,

  options:
    LegacySnapshotAdapterOptions,
): ValidatedLegacySnapshotAdaptationResult {
  const validation =
    validateCatalogSnapshotContractV1(
      value,
    );

  if (validation.ok === false) {
    return {
      ok: false,
      errors:
        validation.errors,
    };
  }

  return {
    ok: true,
    data:
      adaptCatalogSnapshotToLegacy(
        validation.data,
        options,
      ),
  };
}