export type CommercialPublication =
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "INVALID";

export type CommercialAvailability =
  | "AVAILABLE"
  | "PREORDER"
  | "OUT_OF_STOCK"
  | "UNTRACKED"
  | "INVALID";

export type CommercialPurchaseMode =
  | "CART"
  | "WHATSAPP"
  | "PREORDER"
  | "NONE";

export type CommercialIssue =
  | "invalid-status"
  | "non-public-status"
  | "missing-id"
  | "missing-title"
  | "missing-image"
  | "missing-description"
  | "invalid-base-price"
  | "invalid-stock"
  | "stock-status-mismatch";

export interface ProductCommercialStateInput {
  status?: string | null;
  stock?: number | null;
  price_1?: number | null;
  price_offer?: number | null;
}

export interface ProductCommercialState {
  publication: CommercialPublication;
  availability: CommercialAvailability;
  purchaseMode: CommercialPurchaseMode;
  isPubliclyVisible: boolean;
  isPurchasable: boolean;
  canShowPricing: boolean;
  canShowInventoryQuantity: boolean;
  issues: readonly CommercialIssue[];
}
