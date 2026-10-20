import {
  act,
  renderHook,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import type {
  CartItem,
} from "@/modules/cart/types";

import {
  useCart,
} from "./cart.store";

function createItem(
  overrides:
    Partial<CartItem> = {},
): CartItem {
  return {
    id:
      "P-1",

    title:
      "Producto actualizado",

    description:
      "Producto para prueba.",

    category:
      "flores",

    price_1:
      10,

    price_3:
      9,

    price_offer:
      null,

    stock:
      20,

    img:
      "https://example.com/product.jpg",

    status:
      "publicado",

    qty:
      3,

    note:
      "Nota preservada",

    ...overrides,
  };
}

beforeEach(
  () => {
    localStorage.clear();
  },
);

afterEach(
  () => {
    localStorage.clear();
  },
);

describe(
  "replaceCart",
  () => {
    it(
      "reemplaza el snapshot completo conservando cantidad y nota",
      () => {
        const {
          result,
        } =
          renderHook(
            () =>
              useCart(),
          );

        act(
          () => {
            result.current
              .replaceCart([
                createItem(),
              ]);
          },
        );

        expect(
          result.current.cart,
        ).toEqual([
          expect.objectContaining({
            id:
              "P-1",

            price_offer:
              null,

            price_3:
              9,

            qty:
              3,

            note:
              "Nota preservada",
          }),
        ]);

        expect(
          result.current.totalItems,
        ).toBe(
          3,
        );

        expect(
          result.current.totalPrice,
        ).toBe(
          27,
        );
      },
    );
  },
);
