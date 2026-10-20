export type CatalogCategoryPublicationStatus =
  | "draft"
  | "published"
  | "hidden"
  | "archived";

/**
 * Categoría de catálogo independiente de una marca.
 */
export interface CatalogCategoryContract {
  id: string;
  slug: string;

  name: string;
  icon: string | null;

  priority: number;
  publicationStatus:
    CatalogCategoryPublicationStatus;
}
