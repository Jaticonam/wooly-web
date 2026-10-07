import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import type {
  CartItem,
} from "@/modules/cart/types";

import {
  addItemToCart,
  sanitizeCartItems,
} from "./cart.actions";

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "FLOR-001",
    title: "Rosa premium",
    description:
      "Producto de prueba.",
    category: "flores",
    price_1: 10,
    stock: 20,
    img:
      "https://example.com/product.jpg",
    status: "publicado",
    campaigns: [],
    priority: 0,
    ...overrides,
  };
}

function createCartItem(
  overrides: Partial<Product> = {},
): CartItem {
  return {
    ...createProduct(overrides),
    qty: 1,
    note: "",
  };
}

describe(
  "cart.actions",
  () => {
    it(
      "agrega un producto publicado y comprable",
      () => {
        const result =
          addItemToCart(
            [],
            createProduct(),
            2,
          );

        expect(result).toHaveLength(1);
        expect(result[0].qty).toBe(2);
      },
    );

    it.each([
      "preventa",
      "agotado",
      "oculto",
      "borrador",
      "",
      "pendiente",
    ])(
      "bloquea el estado %s",
      (status) => {
        const result =
          addItemToCart(
            [],
            createProduct({
              status,
            }),
            1,
          );

        expect(result).toEqual([]);
      },
    );

    it(
      "bloquea publicado sin stock disponible",
      () => {
        const result =
          addItemToCart(
            [],
            createProduct({
              status: "publicado",
              stock: 0,
            }),
            1,
          );

        expect(result).toEqual([]);
      },
    );

    it(
      "elimina del carrito elementos que dejaron de ser comprables",
      () => {
        const result =
          sanitizeCartItems([
            createCartItem({
              id: "PUBLICADO",
              status: "publicado",
              stock: 10,
            }),
            createCartItem({
              id: "PREVENTA",
              status: "preventa",
              stock: null,
            }),
            createCartItem({
              id: "AGOTADO",
              status: "agotado",
              stock: 50,
            }),
          ]);

        expect(
          result.map(
            (item) => item.id,
          ),
        ).toEqual([
          "PUBLICADO",
        ]);
      },
    );
  },
);

it('preserves the technical UUID and commercial code independently in cart lines', () => {
  const product = createProduct({ id: 'a8d4cb8d-2da0-4f32-babe-b8e7e6796bf6', code: 'CT-554', sku: undefined });
  const lines = addItemToCart([], product, 1);
  expect(lines[0].id).toBe(product.id);
  expect(lines[0].code).toBe('CT-554');
});
