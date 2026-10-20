import type {
  CartItem,
} from "@/modules/cart/types";

import {
  getCartLinePricing,
} from "@/modules/cart/domain/CartLinePricing";

import {
  getTotalPrice,
  getTotalSavings,
} from "@/modules/cart/store/cart.selectors";

import {
  sanitizeCartItems,
} from "@/modules/cart/store/cart.actions";

import {
  buildWhatsAppLink,
  openWhatsAppUrl,
  type WhatsAppOpenResult,
} from "@/modules/product-detail/utils/WhatsAppLink";

import type {
  CatalogProvider,
} from "@wooly/shared/catalog/providers/CatalogProvider";

import {
  reconcileCartWithProvider,
  type CartReconciliationResult,
} from "@/modules/cart/domain/CartReconciliation";

export function buildCheckoutMessage(
  cart:
    CartItem[],

  _savings:
    number,
): string {
  const eligibleCart =
    sanitizeCartItems(
      cart,
    );

  let message =
    "*NUEVO PEDIDO WOOLY - MAYORISTAS*\n\n";

  message +=
    "Hola, deseo pedir lo siguiente:\n\n";

  eligibleCart.forEach(
    (item) => {
      const {
        quantity,
        unitPrice,
        subtotal,
      } =
        getCartLinePricing(
          item,
        );

      const note =
        item.note
          ?.trim()
          .replace(
            /\s+/g,
            " ",
          );

      message +=
        `• *[ ${item.id} ]* | *${item.title}*\n`;

      message +=
        `  Cantidad: ${quantity} u\n`;

      message +=
        `  Precio: S/${unitPrice.toFixed(2)}\n`;

      message +=
        `  Subtotal: S/${subtotal.toFixed(2)}\n`;

      if (note) {
        message +=
          `  Detalle: ${note}\n`;
      }

      message +=
        "\n";
    },
  );

  const total =
    getTotalPrice(
      eligibleCart,
    );

  const savings =
    getTotalSavings(
      eligibleCart,
    );

  message +=
    "━━━━━━━━━━━━━━━\n";

  message +=
    `*Total estimado: S/${total.toFixed(2)}*\n`;

  if (savings > 0) {
    message +=
      `Ahorro estimado: S/${savings.toFixed(2)}\n`;
  }

  message +=
    "\nConfirmar disponibilidad, gracias.";

  return message;
}

export function checkout(
  cart:
    CartItem[],

  savings:
    number,

  onClearCart:
    () => void,

  onClose:
    () => void,
): WhatsAppOpenResult {
  const eligibleCart =
    sanitizeCartItems(
      cart,
    );

  if (
    eligibleCart.length ===
    0
  ) {
    return {
      status:
        "invalid",

      issues: [{
        code:
          "NO_ELIGIBLE_ITEMS",

        message:
          "No hay líneas elegibles para enviar.",
      }],
    };
  }

  const message =
    buildCheckoutMessage(
      eligibleCart,
      savings,
    );

  const link =
    buildWhatsAppLink(
      message,
    );

  if (
    link.ok ===
    false
  ) {
    return {
      status:
        "invalid",

      issues:
        link.issues,
    };
  }

  const openResult =
    openWhatsAppUrl(
      link.url,
    );

  if (
    openResult.status !==
    "opened"
  ) {
    return openResult;
  }

  setTimeout(
    () => {
      onClearCart();
      onClose();
    },
    300,
  );

  return openResult;
}

type SuccessfulReconciliation =
  Extract<
    CartReconciliationResult,
    {
      ok: true;
    }
  >;

export type ProviderCheckoutResult =
  | {
      status:
        "provider-error";

      reconciliation:
        Extract<
          CartReconciliationResult,
          {
            ok: false;
          }
        >;
    }
  | {
      status:
        "cart-updated";

      reconciliation:
        SuccessfulReconciliation;
    }
  | (
      WhatsAppOpenResult & {
        reconciliation:
          SuccessfulReconciliation;
      }
    );

export async function checkoutWithProvider(
  provider:
    CatalogProvider,

  cart:
    CartItem[],

  savings:
    number,

  onClearCart:
    () => void,

  onClose:
    () => void,

  onReplaceCart:
    (
      items:
        readonly CartItem[],
    ) => void =
      () => undefined,
): Promise<
  ProviderCheckoutResult
> {
  const reconciliation =
    await reconcileCartWithProvider(
      cart,
      provider,
    );

  if (
    reconciliation.ok ===
    false
  ) {
    return {
      status:
        "provider-error",

      reconciliation,
    };
  }

  /*
   * Seguridad transaccional:
   * nunca se abre WhatsApp durante el mismo intento en el que
   * el carrito fue actualizado, recalculado o depurado.
   *
   * El usuario debe visualizar el nuevo snapshot y confirmar
   * nuevamente el envío.
   */
  if (
    reconciliation.changes.length >
    0
  ) {
    onReplaceCart(
      reconciliation.items,
    );

    return {
      status:
        "cart-updated",

      reconciliation,
    };
  }

  const result =
    checkout(
      reconciliation.items,
      savings,
      onClearCart,
      onClose,
    );

  return {
    ...result,
    reconciliation,
  };
}
