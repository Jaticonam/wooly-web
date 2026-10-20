import {
  useNavigate,
} from "react-router-dom";

import {
  resolveProductCommercialPolicy,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import type {
  CartItem,
} from "@/modules/cart/types";

import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  buildProductWhatsappMessage,
  buildProductWhatsappUrl,
  type ProductWhatsappIntent,
} from "@/modules/product-detail/utils/BuildProductWhatsappMessage";
import {
  openWhatsAppUrl,
} from "@/modules/product-detail/utils/WhatsAppLink";

export function useProductCard(
  product:
    Product,

  cart:
    CartItem[],

  onAddToCart:
    (
      product:
        Product,
    ) => void,
) {
  const navigate =
    useNavigate();

  const policy =
    resolveProductCommercialPolicy(
      product,
    );

  const isPublicado =
    policy.status ===
    "publicado";

  const isPreventa =
    policy.status ===
    "preventa";

  const isAgotado =
    policy.status ===
    "agotado";

  const available =
    policy.isPurchasable;

  /*
   * Alias temporal para compatibilidad.
   *
   * Ya no se deduce agotamiento desde stock === 0.
   * El único agotamiento comercial válido es status="agotado".
   */
  const isOutOfStock =
    isAgotado;

  const showWhatsAppButton =
    policy.isConsultOnly;

  const cartItem =
    cart.find(
      (
        item,
      ) =>
        item.id ===
        product.id,
    );

  const qtyInCart =
    cartItem?.qty ??
    0;

  const isInCart =
    qtyInCart >
    0;

  function goToDetail() {
    navigate(
      buildProductPublicPath(product.id, product.category),
    );
  }

  function handleAdd() {
    if (
      !policy.isPurchasable
    ) {
      return;
    }

    onAddToCart(
      product,
    );
  }

  function handleWhatsApp() {
    const intent:
      ProductWhatsappIntent =
        isPreventa
          ? "preorder"
          : isAgotado
            ? "restock"
            : "information";

    const message =
      buildProductWhatsappMessage(
        product,
        {
          intent,

          productUrl:
            window.location.href,
        },
      );

    openWhatsAppUrl(
      buildProductWhatsappUrl(message),
    );
  }

  return {
    available,
    isPublicado,
    isPreventa,
    isAgotado,
    isOutOfStock,
    showWhatsAppButton,
    qtyInCart,
    isInCart,
    goToDetail,
    handleAdd,
    handleWhatsApp,
  };
}
import { buildProductPublicPath } from "@wooly/shared/config/application";
