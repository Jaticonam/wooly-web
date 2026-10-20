import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

import {
  normalizeProductSheetStatus,
} from "../ProductCommercialPolicy";

import type {
  Product,
} from "../../../types/product";

export function getStockPresentation(
  product: Product,
  legacyIsPreventa = false,
) {
  const status =
    normalizeProductSheetStatus(
      product.status,
    );

  /*
   * legacyIsPreventa se conserva temporalmente
   * para no romper llamadas antiguas.
   */
  if (
    status === "preventa" ||
    legacyIsPreventa
  ) {
    return {
      text: "Preventa",
      icon: Clock,
      className:
        "bg-green-50 text-green-700",
    };
  }

  /*
   * Agotado es autoritativo:
   * no se consulta la cantidad de stock.
   */
  if (status === "agotado") {
    return {
      text: "Agotado",
      icon: XCircle,
      className:
        "bg-red-50 text-red-600",
    };
  }

  if (
    !product.price_1 ||
    product.stock == null ||
    product.stock <= 0
  ) {
    return {
      text: "No disponible",
      icon: XCircle,
      className:
        "bg-slate-100 text-slate-600",
    };
  }

  if (product.stock <= 12) {
    return {
      text:
        `Últimas: ${product.stock}`,
      icon:
        AlertTriangle,
      className:
        "bg-red-50 text-red-600",
    };
  }

  if (product.stock <= 36) {
    return {
      text:
        "Stock limitado",
      icon:
        AlertTriangle,
      className:
        "bg-orange-50 text-orange-600",
    };
  }

  return {
    text:
      "Disponible",
    icon:
      CheckCircle,
    className:
      "bg-green-50 text-green-700",
  };
}
