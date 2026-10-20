import type { CatalogSourceMode } from "./CatalogSourceMode";

export interface ApplicationConfig {
  readonly app: {
    readonly id: string;
    readonly brandId: string;
    readonly name: string;
    readonly shortName: string;
  };
  readonly locale: {
    readonly language: string;
    readonly country: string;
    readonly locale: string;
    readonly currency: string;
    readonly currencyLocale: string;
  };
  readonly publicSite: {
    readonly origin: string;
    readonly domain: string;
  };
  readonly contact: {
    readonly whatsappNumber: string;
  };
  readonly assets: {
    readonly logoUrl: string;
    readonly pdfLogoUrl: string;
    readonly defaultSeoImageUrl: string;
    readonly brandStoryImageUrl: string;
    readonly shippingImageUrl: string;
  };
  readonly routes: {
    readonly catalog: string;
    readonly productDetail: string;
    readonly catalogPdf: string;
  };
  readonly commerce: {
    readonly pdfValidityDays: number;
  };
  readonly catalog: {
    readonly source: CatalogSourceMode;
  };
  readonly catalogPublication: {
    readonly apiBaseUrl: string | null;
  };
  readonly integrations: {
    readonly meta: {
      readonly brandName: string;
    };
  };
}

export type ApplicationRuntimeMode =
  | "development"
  | "test"
  | "production";

export interface ApplicationPublicOverrides {
  readonly catalogSource?: unknown;
  readonly publicSiteOrigin?: unknown;
  readonly catalogPublicationApiBaseUrl?: unknown;
}
