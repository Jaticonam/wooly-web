export type CatalogAvailabilityStatus =
  | "available"
  | "outOfStock"
  | "preorder"
  | "comingSoon"
  | "untracked";

/**
 * Inventario comercial independiente de la fuente.
 *
 * availableQuantity puede ser null cuando el inventario
 * no está siendo contabilizado por unidades.
 */
export interface CatalogInventoryContract {
  tracked: boolean;
  availableQuantity: number | null;
  status: CatalogAvailabilityStatus;
  updatedAt: string | null;
}
