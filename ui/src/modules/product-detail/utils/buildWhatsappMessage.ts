import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  buildProductWhatsappMessage,
  buildProductWhatsappUrl,
  type ProductWhatsappIntent,
} from "./BuildProductWhatsappMessage";

export {
  buildProductWhatsappMessage,
  buildProductWhatsappUrl,
};

export type {
  ProductWhatsappIntent,
};

/**
 * Compatibilidad temporal con consumidores legacy.
 *
 * No genera %0A. Devuelve texto natural para que la URL
 * sea codificada una sola vez.
 */
export function buildWhatsappMessage(
  product:
    Product,

  isPreventa:
    boolean,

  isOutOfStock:
    boolean,
): string {
  const intent:
    ProductWhatsappIntent =
      isPreventa
        ? "preorder"
        : isOutOfStock
          ? "restock"
          : "information";

  return buildProductWhatsappMessage(
    product,
    {
      intent,
    },
  );
}
