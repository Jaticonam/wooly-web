import type { Product } from "@wooly/contracts/types/product";

export interface CartItem extends Product {
  qty: number;
  note: string;
}