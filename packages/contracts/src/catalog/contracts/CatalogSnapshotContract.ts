import type {
  CatalogCampaignContract,
} from "./CampaignContract";

import type {
  CatalogCategoryContract,
} from "./CategoryContract";

import type {
  CatalogProductContract,
} from "./ProductContract";

export const CATALOG_SNAPSHOT_CONTRACT_VERSION =
  "catalog-snapshot.v1" as const;

export type CatalogSnapshotContractVersion =
  typeof CATALOG_SNAPSHOT_CONTRACT_VERSION;

/**
 * Snapshot público y coherente de un catálogo.
 *
 * Categorías, campañas y productos pertenecen a una
 * misma marca y a una misma revisión lógica.
 */
export interface CatalogSnapshotContract {
  contractVersion:
    CatalogSnapshotContractVersion;

  brandId: string;
  revision: string;
  generatedAt: string;

  categories:
    readonly CatalogCategoryContract[];

  campaigns:
    readonly CatalogCampaignContract[];

  products:
    readonly CatalogProductContract[];
}