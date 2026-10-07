import type {
  Product,
} from "@/shared/types/product";
import {
  buildWhatsAppLink,
  WOOLY_WHATSAPP_NUMBER,
} from "./WhatsAppLink";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

export const WOOLY_PRODUCT_WHATSAPP_NUMBER =
  WOOLY_WHATSAPP_NUMBER;

export type ProductWhatsappIntent =
  | "information"
  | "preorder"
  | "restock";

export interface BuildProductWhatsappMessageOptions {
  intent:
    ProductWhatsappIntent;

  productUrl?:
    string;

  categoryLabel?:
    string;
}

/* =========================================================
   COPY
   ========================================================= */

const OPENING_BY_INTENT:
  Record<
    ProductWhatsappIntent,
    string
  > = {
  information:
    "Hola Wooly, quiero más información sobre este producto:",

  preorder:
    "Hola Wooly, quiero información sobre este producto en preventa:",

  restock:
    "Hola Wooly, quiero consultar reposición de este producto:",
};

function cleanText(
  value:
    unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

/* =========================================================
   MENSAJE
   ========================================================= */

/**
 * Devuelve texto natural.
 *
 * No incorpora %0A ni codificación URL. La codificación
 * se realiza una sola vez al construir la URL de WhatsApp.
 */
export function buildProductWhatsappMessage(
  product:
    Product,

  options:
    BuildProductWhatsappMessageOptions,
): string {
  const category =
    cleanText(
      options.categoryLabel,
    ) ||
    cleanText(
      product.category,
    );

  const productUrl =
    cleanText(
      options.productUrl,
    );

  const lines:
    string[] = [
    OPENING_BY_INTENT[
      options.intent
    ],
    "",
    `Producto: ${cleanText(
      product.title,
    )}`,
    `Código: ${cleanText(
      product.code ?? "Sin código",
    )}`,
  ];

  if (category) {
    lines.push(
      `Categoría: ${category}`,
    );
  }

  if (productUrl) {
    lines.push(
      "",
      `Link: ${productUrl}`,
    );
  }

  return lines.join(
    "\n",
  );
}

/* =========================================================
   URL
   ========================================================= */

export function buildProductWhatsappUrl(
  message:
    string,

  phone =
    WOOLY_PRODUCT_WHATSAPP_NUMBER,
): string {
  const result = buildWhatsAppLink(message, phone);
  return result.ok ? result.url : "";
}
