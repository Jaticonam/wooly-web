import {
  act,
  renderHook,
} from "@testing-library/react";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import type {
  CartItem,
} from "@/modules/cart/types";

import {
  CART_KEY,
} from "./cart.persistence";

import {
  useCart,
} from "./cart.store";

function createCartItem(
  overrides:
    Partial<CartItem> = {},
): CartItem {
  return {
    id: "VALIDO",
    title: "Producto válido",
    description:
      "Producto para prueba.",
    category: "flores",
    price_1: 10,
    stock: 20,
    img:
      "https://example.com/product.jpg",
    status: "publicado",
    qty: 1,
    note: "",
    ...overrides,
  };
}

afterEach(
  () => {
    localStorage.clear();
  },
);

describe(
  "useCart storage event",
  () => {
    it(
      "aplica el mismo saneamiento comercial entre pestañas",
      () => {
        const {
          result,
        } =
          renderHook(
            () => useCart(),
          );

        act(
          () => {
            window.dispatchEvent(
              new StorageEvent(
                "storage",
                {
                  key:
                    CART_KEY,
                  newValue:
                    JSON.stringify({
                      schemaVersion: 1,
                      data: [
                        createCartItem(),
                        createCartItem({
                          id:
                            "PREVENTA",
                          status:
                            "preventa",
                        }),
                        createCartItem({
                          id:
                            "SIN-STOCK",
                          stock: 0,
                        }),
                      ],
                    }),
                },
              ),
            );
          },
        );

        expect(
          result.current.cart.map(
            (item) => item.id,
          ),
        ).toEqual([
          "VALIDO",
        ]);
      },
    );
  },
);
