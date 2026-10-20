export type CatalogCampaignPublicationStatus =
  | "draft"
  | "published"
  | "hidden"
  | "archived";

/**
 * Campaña comercial canónica.
 *
 * computedStatus no forma parte del contrato externo:
 * la aplicación lo calcula utilizando fechas y
 * publicationStatus.
 *
 * No contiene clases CSS ni valores de Tailwind.
 */
export interface CatalogCampaignContract {
  id: string;
  slug: string;

  name: string;
  icon: string | null;

  color: string | null;
  themeToken: string | null;

  startsAt: string | null;
  endsAt: string | null;

  priority: number;

  publicationStatus:
    CatalogCampaignPublicationStatus;
}
