import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";
import {
  validateAndAdaptCatalogProductToLegacy,
} from "../../adapters/LegacyProductAdapter";
import type {
  CatalogCategoryId,
  CatalogProvider,
  CatalogProviderIssue,
  CatalogProviderResult,
} from "../../providers/CatalogProvider";

import {
  validCatalogProductFixtures,
} from "./CatalogProductFixtures";

export interface ContractFixtureProviderDiagnostics {
  receivedCount: number;
  validCount: number;
  rejectedCount: number;
  adaptationIssueCount: number;
  unsupportedTierCount: number;
}

export interface ContractFixtureProductsResult
  extends CatalogProviderResult<Product[]> {
  diagnostics:
    ContractFixtureProviderDiagnostics;
}

function evaluateContracts(
  contracts: readonly unknown[],
): {
  products: Product[];
  issues: CatalogProviderIssue[];
  diagnostics:
    ContractFixtureProviderDiagnostics;
} {
  const products: Product[] = [];
  const issues:
    CatalogProviderIssue[] = [];
  let validCount = 0;
  let unsupportedTierCount = 0;
  let adaptationIssueCount = 0;

  contracts.forEach(
    (contract, itemIndex) => {
      const result =
        validateAndAdaptCatalogProductToLegacy(
          contract,
        );

      if (result.ok === false) {
        result.errors.forEach(
          (error) => {
            issues.push({
              code: error.code,
              message:
                error.message,
              itemIndex,
            });
          },
        );
        return;
      }

      validCount += 1;
      products.push(
        result.data.product,
      );
      unsupportedTierCount +=
        result.data
          .unsupportedVolumePrices
          .length;
      adaptationIssueCount +=
        result.data.issues.length;
      result.data.issues.forEach(
        (issue) => {
          issues.push({
            code: issue.code,
            message:
              issue.message,
            itemIndex,
          });
        },
      );
    },
  );

  return {
    products,
    issues,
    diagnostics: {
      receivedCount:
        contracts.length,
      validCount,
      rejectedCount:
        contracts.length -
        validCount,
      adaptationIssueCount,
      unsupportedTierCount,
    },
  };
}

export class ContractFixtureCatalogProvider
  implements CatalogProvider {
  readonly source =
    "contract-fixture" as const;

  private readonly contracts:
    readonly unknown[];

  constructor(
    contracts:
      readonly unknown[] =
        validCatalogProductFixtures,
  ) {
    this.contracts = [
      ...contracts,
    ];
  }

  getCategories():
    readonly CatalogCategoryId[] {
    return Array.from(
      new Set(
        evaluateContracts(
          this.contracts,
        ).products.map(
          (product) =>
            product.category,
        ),
      ),
    );
  }

  async loadCampaigns():
    Promise<Campaign[]> {
    return [];
  }

  async loadCategoryProducts(
    category: CatalogCategoryId,
    campaigns:
      readonly Campaign[],
  ): Promise<Product[]> {
    const result =
      await this
        .loadCategoryProductsDetailed(
          category,
          campaigns,
        );

    return result.data;
  }

  async loadCategoryProductsDetailed(
    category: CatalogCategoryId,
    _campaigns:
      readonly Campaign[],
  ): Promise<
    ContractFixtureProductsResult
  > {
    const evaluated =
      evaluateContracts(
        this.contracts,
      );

    return {
      data:
        evaluated.products.filter(
          (product) =>
            product.category ===
            category,
        ),
      source: this.source,
      issues:
        evaluated.issues,
      diagnostics:
        evaluated.diagnostics,
    };
  }
}

export const contractFixtureCatalogProvider =
  new ContractFixtureCatalogProvider();
