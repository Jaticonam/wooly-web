/**
 * Código monetario independiente de la presentación.
 * Ejemplos: PEN, USD.
 */
export type CurrencyCode = string;

/**
 * Precio unitario aplicable desde una cantidad mínima.
 *
 * No contiene clases CSS, etiquetas visuales ni nombres
 * específicos de Google Sheets.
 */
export interface CatalogVolumePriceContract {
  id: string;
  minimumQuantity: number;
  unitPrice: number;
}

/**
 * Oferta comercial temporal aplicada al precio base.
 */
export interface CatalogOfferContract {
  unitPrice: number;
  startsAt: string | null;
  endsAt: string | null;
}

/**
 * Contrato canónico de precios de catálogo.
 */
export interface CatalogPricingContract {
  currency: CurrencyCode;
  volumePrices: readonly CatalogVolumePriceContract[];
  offer: CatalogOfferContract | null;
}
