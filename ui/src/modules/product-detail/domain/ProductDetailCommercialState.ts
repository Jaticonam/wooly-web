import {
  resolveProductCommercialPolicy,
  type ProductCommercialPolicy,
  type ResolvedProductSheetStatus,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import type {
  Product,
} from "@wooly/contracts/types/product";

/* =========================================================
   ESTADO COMERCIAL DE PRODUCT DETAIL
   ========================================================= */

/**
 * Primera frontera entre Product Detail y la política
 * comercial central.
 *
 * Este modelo todavía no es el ProductDetailViewModel
 * definitivo. Su objetivo en el Bloque 0 es impedir que
 * la página vuelva a interpretar status, precio o stock.
 */
export interface ProductDetailCommercialState {
  status:
    ResolvedProductSheetStatus;

  policy:
    ProductCommercialPolicy;

  isPubliclyVisible:
    boolean;

  isPurchasable:
    boolean;

  isConsultOnly:
    boolean;

  isPreventa:
    boolean;

  isAgotado:
    boolean;

  canShowPricing:
    boolean;

  canShowInventoryQuantity:
    boolean;

  canShowVolumePricing:
    boolean;

  canSelectQuantity:
    boolean;
}

/* =========================================================
   RESOLUCIÓN
   ========================================================= */

export function resolveProductDetailCommercialState(
  product:
    Product,
): ProductDetailCommercialState {
  const policy =
    resolveProductCommercialPolicy(
      product,
    );

  const isPreventa =
    policy.status ===
    "preventa";

  const isAgotado =
    policy.status ===
    "agotado";

  return {
    status:
      policy.status,

    policy,

    isPubliclyVisible:
      policy.isPubliclyVisible,

    isPurchasable:
      policy.isPurchasable,

    isConsultOnly:
      policy.isConsultOnly,

    isPreventa,

    isAgotado,

    canShowPricing:
      policy.canShowPricing,

    canShowInventoryQuantity:
      policy.canShowInventoryQuantity,

    /*
     * Solamente un producto realmente comprable puede
     * exponer escalas o permitir seleccionar cantidades.
     */
    canShowVolumePricing:
      policy.isPurchasable,

    canSelectQuantity:
      policy.isPurchasable,
  };
}
