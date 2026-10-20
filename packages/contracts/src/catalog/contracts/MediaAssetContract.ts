export type CatalogMediaAssetKind =
  | "image"
  | "video";

/**
 * Activo multimedia canónico.
 *
 * JUNG CORE entrega URLs y metadatos semánticos.
 * La web decide cómo presentarlos.
 */
export interface CatalogMediaAssetContract {
  id: string;
  kind: CatalogMediaAssetKind;

  url: string;
  thumbnailUrl: string | null;
  altText: string;

  position: number;
  isPrimary: boolean;
}
