export const COMMERCIAL_COMPOSITION_CONTRACT_VERSION =
  "commercial-composition.v1" as const;

export type CommercialCompositionContractVersion =
  typeof COMMERCIAL_COMPOSITION_CONTRACT_VERSION;

export type CommercialCompositionType =
  | "catalog"
  | "quotation"
  | "price-list"
  | "product-sheet";

export type CommercialAvailability =
  | "in_stock"
  | "out_of_stock"
  | "preorder"
  | "unavailable";

export type CommercialScalar =
  | string
  | number
  | boolean
  | null;

export type CommercialAttributeValue =
  | CommercialScalar
  | readonly CommercialScalar[];

export interface CommercialItemMedia {
  primaryImage: string | null;
  gallery: readonly string[];
}

export interface CommercialItemIdentifiers {
  gtin: string | null;
  mpn: string | null;
}

/**
 * Proyección comercial mínima y estable de un producto.
 *
 * Los campos propios de una app viven en attributes y nunca se
 * convierten en requisitos del contrato transversal.
 */
export interface CommercialItem {
  productId: string;
  sku: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  stock: number | null;
  availability: CommercialAvailability;
  brand: string | null;
  identifiers: CommercialItemIdentifiers;
  media: CommercialItemMedia;
  productUrl: string | null;
  attributes: Readonly<Record<string, CommercialAttributeValue>>;
}

export interface CommercialSection {
  sectionId: string;
  title: string;
  description: string | null;
  itemIds: readonly string[];
}

export interface CommercialBrandingProfileReference {
  profileId: string;
}

export interface CommercialPricingProfileReference {
  profileId: string;
  currency: string;
}

export interface CommercialPublicationContext {
  locale: string;
  country: string;
}

/**
 * Frontera canónica entre las apps comerciales y JUNG CORE.
 * No contiene componentes React, rutas, clases CSS ni detalles
 * de proveedores o marketplaces.
 */
export interface CommercialCompositionV1 {
  contractVersion: CommercialCompositionContractVersion;
  compositionId: string;
  appId: string;
  type: CommercialCompositionType;
  version: number;
  title: string;
  description: string | null;
  sections: readonly CommercialSection[];
  items: readonly CommercialItem[];
  brandingProfile: CommercialBrandingProfileReference;
  pricingProfile: CommercialPricingProfileReference;
  publicationContext: CommercialPublicationContext;
  createdAt: string;
}
