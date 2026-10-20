import type {
  CartItem,
} from "@/modules/cart/types";

import {
  getVolumeUnitPrice,
} from "@wooly/contracts/domain/volumePricing/VolumePricing";

export interface CartLinePricing {
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export function normalizeCartQuantity(
  value: unknown,
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? Math.max(
        1,
        Math.trunc(value),
      )
    : 1;
}

export function getCartLinePricing(
  item: CartItem,
): CartLinePricing {
  const quantity =
    normalizeCartQuantity(
      item.qty,
    );

  const unitPrice =
    getVolumeUnitPrice(
      item,
      quantity,
    );

  return {
    quantity,
    unitPrice,
    subtotal:
      unitPrice *
      quantity,
  };
}
