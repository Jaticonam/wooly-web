import type { CartItem } from "@/modules/cart/types";
import {
  getCartLinePricing,
} from "@/modules/cart/domain/CartLinePricing";

function toMoney(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getTotalItems(cart: CartItem[]) {
  return cart.reduce(
    (acc, item) => acc + toMoney(item.qty),
    0
  );
}

export function getTotalPrice(cart: CartItem[]) {
  return cart.reduce((acc, item) => {
    return (
      acc +
      getCartLinePricing(
        item,
      ).subtotal
    );
  }, 0);
}

export function getTotalOriginal(cart: CartItem[]) {
  return cart.reduce((acc, item) => {
    const {
      quantity,
    } =
      getCartLinePricing(
        item,
      );

    const basePrice =
      Number.isFinite(
        item.price_1,
      ) &&
      item.price_1 > 0
        ? item.price_1
        : 0;

    return (
      acc +
      basePrice *
        quantity
    );
  }, 0);
}

export function getTotalSavings(cart: CartItem[]) {
  return Math.max(
    0,
    getTotalOriginal(cart) - getTotalPrice(cart)
  );
}
