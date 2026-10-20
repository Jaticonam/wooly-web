import type {
  CatalogInventoryContract,
} from "./InventoryContract";

import type {
  CatalogMediaAssetContract,
} from "./MediaAssetContract";

import type {
  CatalogPricingContract,
} from "./PriceContract";

export type CatalogProductPublicationStatus =
  | "draft"
  | "published"
  | "hidden"
  | "preorder"
  | "archived";

export const CATALOG_PRODUCT_CONTRACT_VERSION =
  "catalog-product.v1" as const;

export type CatalogProductContractVersion =
  typeof CATALOG_PRODUCT_CONTRACT_VERSION;

/**
 * Contrato canónico de producto.
 *
 * Este contrato no reemplaza todavía al Product operativo
 * de Wooly. Se utilizará como frontera estable entre
 * proveedores externos, JUNG CORE y adaptadores web.
 */
export interface CatalogProductContract {
  contractVersion:
    CatalogProductContractVersion;

  id: string;
  code?: string | null;
  barcode?: string | null;
  /** @deprecated Legacy compatibility. */
  sku: string | null;
  slug: string;

  brandId: string;
  categoryId: string;

  title: string;
  description: string;

  campaignIds: readonly string[];

  /**
   * Badges comerciales asignados manualmente.
   * Nunca se utilizan para crear campañas.
   */
  manualBadgeCodes: readonly string[];

  priority: number;

  publicationStatus:
    CatalogProductPublicationStatus;

  pricing: CatalogPricingContract;
  inventory: CatalogInventoryContract;

  mediaAssets:
    readonly CatalogMediaAssetContract[];

  updatedAt: string | null;
}
