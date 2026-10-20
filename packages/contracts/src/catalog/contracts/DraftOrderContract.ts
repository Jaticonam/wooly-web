import type {
  CurrencyCode,
} from "./PriceContract";

export type DraftOrderStatus =
  | "draft"
  | "submitted"
  | "cancelled"
  | "converted";

export type DraftOrderSource =
  | "web"
  | "whatsapp"
  | "admin"
  | "api";

/**
 * Snapshot comercial de una línea del pedido.
 *
 * El título, SKU y precio quedan registrados aunque
 * el producto cambie posteriormente.
 */
export interface DraftOrderItemContract {
  productId: string;

  sku: string;
  titleSnapshot: string;

  quantity: number;
  unitPrice: number;

  note: string | null;
}

/**
 * Futuro contrato entre el carrito web y JUNG CORE.
 */
export interface DraftOrderContract {
  id: string | null;
  brandId: string;

  status: DraftOrderStatus;
  source: DraftOrderSource;

  currency: CurrencyCode;

  items:
    readonly DraftOrderItemContract[];

  customerNote: string | null;

  subtotal: number;
  discountTotal: number;
  total: number;

  createdAt: string | null;
  updatedAt: string | null;
}
