export interface Category {
  id: string;
  name: string;
  icon: string;
}

export type CampaignComputedStatus =
  | "activa"
  | "programada"
  | "finalizada"
  | "borrador"
  | "oculta";

export interface Campaign {
  id: string;
  name: string;
  icon: string;

  /**
   * Nombre comercial del color recibido desde la fuente.
   * Ejemplos: rosado, amarillo, morado.
   */
  color?: string;

  /**
   * Token semántico compatible con JUNG CORE.
   * La API no necesita conocer Tailwind ni clases CSS.
   */
  themeToken: string;

  /**
   * Compatibilidad temporal con componentes legacy de Wooly.
   * Debe desaparecer cuando todos consuman themeToken.
   */
  colorClass: string;

  startDate: string;
  endDate: string;
  priority: number;

  publicationStatus: string;
  computedStatus: CampaignComputedStatus;
}

export interface Product {
  code?: string | null;
  barcode?: string | null;
  sunatCode?: string | null;
  /** @deprecated Legacy data only; id is the technical product key. */
  sku?: string | null;
  id: string;

  title: string;
  description: string;

  category: string;

  price_1: number;
  price_3?: number | null;
  price_12?: number | null;
  price_50?: number | null;
  price_100?: number | null;

  price_offer?: number | null;

  stock?: number | null;
  img: string;
  gallery?: string;

  status?: string;
  badges?: string[];

  /**
   * Compatibilidad temporal:
   * actualmente contiene IDs de campañas.
   *
   * En el contrato futuro de JUNG CORE se llamará campaignIds.
   */
  campaigns?: string[];

  priority?: number;
}
