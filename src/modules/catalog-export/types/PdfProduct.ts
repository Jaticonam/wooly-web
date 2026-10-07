export type PdfProductPresentation =
  | "published"
  | "preventa"
  | "agotado";

export type PdfVolumePriceKind =
  | "price3"
  | "price12"
  | "price50"
  | "price100";

export interface PdfVolumePrice {
  kind:
    PdfVolumePriceKind;

  qty:
    number;

  label:
    string;

  unitPrice:
    number;
}

export interface PdfProduct {
  code?: string | null;
  id:
    string;

  title:
    string;

  description:
    string;

  category:
    string;

  image:
    string;

  price1:
    number;

  offerPrice?:
    number |
    null;

  primaryPrice:
    number;

  volumePrices:
    PdfVolumePrice[];

  stock?:
    number |
    null;

  stockLabel:
    string;

  presentation:
    PdfProductPresentation;

  showPricing:
    boolean;

  showWholesalePricing:
    boolean;

  status?:
    string;

  priority:
    number;
}
