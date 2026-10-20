import {
  isCartItemCommerciallyEligible,
} from "@/modules/cart/domain/CartCommercialEligibility";

import type {
  Product,
} from "@wooly/contracts/types/product";

import type {
  CartItem,
} from "@/modules/cart/types";

/* =========================================================
   SANEAMIENTO
   ========================================================= */

/**
 * El carrito solamente puede contener productos que continúan
 * siendo comprables según la política comercial vigente.
 *
 * También elimina elementos antiguos que hayan cambiado a:
 * - preventa
 * - agotado
 * - oculto
 * - borrador
 * - estado inválido
 */
export function sanitizeCartItems(
  cart: readonly CartItem[],
): CartItem[] {
  return cart.filter(
    (item) =>
      isCartItemCommerciallyEligible(
        item,
      ),
  );
}

/* =========================================================
   REEMPLAZAR SNAPSHOT
   ========================================================= */

/**
 * Reemplaza el carrito completo usando una colección ya
 * reconciliada con la fuente comercial vigente.
 *
 * Conserva una única frontera de saneamiento antes de que el
 * nuevo snapshot alcance el estado y la persistencia.
 */
export function replaceCartItems(
  cart: readonly CartItem[],
): CartItem[] {
  return sanitizeCartItems(
    cart,
  ).map(
    (item) => ({
      ...item,
    }),
  );
}

/* =========================================================
   AGREGAR
   ========================================================= */

export function addItemToCart(
  cart: CartItem[],
  product: Product,
  qty: number,
): CartItem[] {
  const safeCart =
    sanitizeCartItems(cart);

  /*
   * Barrera definitiva:
   * ninguna superficie puede forzar el ingreso
   * de un producto no comprable.
   */
  if (
    !isCartItemCommerciallyEligible(
      product,
    )
  ) {
    return safeCart;
  }

  const safeQty =
    Math.max(
      1,
      Math.floor(
        Number(qty) || 1,
      ),
    );

  const existing =
    safeCart.find(
      (item) =>
        item.id === product.id,
    );

  if (existing) {
    return safeCart.map(
      (item) =>
        item.id === product.id
          ? {
              ...item,
              qty:
                item.qty +
                safeQty,
            }
          : item,
    );
  }

  return [
    ...safeCart,
    {
      ...product,
      qty: safeQty,
      note: "",
    },
  ];
}

/* =========================================================
   ELIMINAR
   ========================================================= */

export function removeItemFromCart(
  cart: CartItem[],
  id: string,
): CartItem[] {
  return sanitizeCartItems(cart)
    .filter(
      (item) =>
        item.id !== id,
    );
}

/* =========================================================
   CAMBIAR CANTIDAD
   ========================================================= */

export function changeCartItemQty(
  cart: CartItem[],
  id: string,
  delta: number,
): CartItem[] {
  return sanitizeCartItems(cart)
    .map((item) => {
      if (item.id !== id) {
        return item;
      }

      const newQty =
        item.qty + delta;

      if (newQty <= 0) {
        return null;
      }

      return {
        ...item,
        qty: newQty,
      };
    })
    .filter(
      Boolean,
    ) as CartItem[];
}

/* =========================================================
   FIJAR CANTIDAD
   ========================================================= */

export function setCartItemQty(
  cart: CartItem[],
  id: string,
  qty: number | null,
): CartItem[] {
  return sanitizeCartItems(cart)
    .map((item) => {
      if (item.id !== id) {
        return item;
      }

      if (qty === null) {
        return item;
      }

      const safeQty =
        Math.floor(
          Number(qty) || 0,
        );

      if (safeQty <= 0) {
        return null;
      }

      return {
        ...item,
        qty: safeQty,
      };
    })
    .filter(
      Boolean,
    ) as CartItem[];
}

/* =========================================================
   NOTA
   ========================================================= */

export function setCartItemNote(
  cart: CartItem[],
  id: string,
  note: string,
): CartItem[] {
  return sanitizeCartItems(cart)
    .map(
      (item) =>
        item.id === id
          ? {
              ...item,
              note:
                note ?? "",
            }
          : item,
    );
}
