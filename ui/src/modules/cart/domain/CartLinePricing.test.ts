import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CartItem,
} from "@/modules/cart/types";

import {
  getCartLinePricing,
} from "./CartLinePricing";

function createItem(
  overrides:
    Partial<CartItem> = {},
): CartItem {
  return {
    id: "TEST-001",
    title: "Producto de prueba",
    description:
      "Producto para pricing de línea.",
    category: "pruebas",
    price_1: 10,
    price_3: 9,
    price_12: 8,
    price_50: 7,
    price_100: 6,
    price_offer: null,
    stock: 200,
    img:
      "https://example.com/product.jpg",
    status: "publicado",
    campaigns: [],
    priority: 0,
    qty: 1,
    note: "",
    ...overrides,
  };
}

describe(
  "getCartLinePricing",
  () => {
    it.each([
      {
        name: "cantidad 1",
        qty: 1,
        quantity: 1,
        unitPrice: 10,
        subtotal: 10,
      },
      {
        name: "cantidad 3",
        qty: 3,
        quantity: 3,
        unitPrice: 9,
        subtotal: 27,
      },
      {
        name: "cantidad 12",
        qty: 12,
        quantity: 12,
        unitPrice: 8,
        subtotal: 96,
      },
      {
        name: "cantidad 50",
        qty: 50,
        quantity: 50,
        unitPrice: 7,
        subtotal: 350,
      },
      {
        name: "cantidad 100",
        qty: 100,
        quantity: 100,
        unitPrice: 6,
        subtotal: 600,
      },
      {
        name:
          "cantidad superior a 100",
        qty: 101,
        quantity: 101,
        unitPrice: 6,
        subtotal: 606,
      },
      {
        name: "cantidad cero",
        qty: 0,
        quantity: 1,
        unitPrice: 10,
        subtotal: 10,
      },
      {
        name: "cantidad negativa",
        qty: -5,
        quantity: 1,
        unitPrice: 10,
        subtotal: 10,
      },
      {
        name: "cantidad decimal",
        qty: 12.9,
        quantity: 12,
        unitPrice: 8,
        subtotal: 96,
      },
      {
        name: "cantidad NaN",
        qty: Number.NaN,
        quantity: 1,
        unitPrice: 10,
        subtotal: 10,
      },
      {
        name: "cantidad infinita",
        qty:
          Number.POSITIVE_INFINITY,
        quantity: 1,
        unitPrice: 10,
        subtotal: 10,
      },
    ])(
      "normaliza $name",
      ({
        qty,
        quantity,
        unitPrice,
        subtotal,
      }) => {
        expect(
          getCartLinePricing(
            createItem({
              qty,
            }),
          ),
        ).toEqual({
          quantity,
          unitPrice,
          subtotal,
        });
      },
    );

    it.each([
      {
        name:
          "aplica una oferta válida",
        overrides: {
          price_offer: 8,
        },
        qty: 1,
        unitPrice: 8,
        subtotal: 8,
      },
      {
        name:
          "ignora una oferta mayor al precio base",
        overrides: {
          price_offer: 12,
        },
        qty: 1,
        unitPrice: 10,
        subtotal: 10,
      },
      {
        name:
          "retrocede ante un tier parcial",
        overrides: {
          price_12: null,
        },
        qty: 12,
        unitPrice: 9,
        subtotal: 108,
      },
      {
        name:
          "ignora un tier cero",
        overrides: {
          price_3: 0,
        },
        qty: 3,
        unitPrice: 10,
        subtotal: 30,
      },
      {
        name:
          "ignora un tier negativo",
        overrides: {
          price_3: -5,
        },
        qty: 3,
        unitPrice: 10,
        subtotal: 30,
      },
      {
        name:
          "ignora un tier NaN",
        overrides: {
          price_3:
            Number.NaN,
        },
        qty: 3,
        unitPrice: 10,
        subtotal: 30,
      },
      {
        name:
          "ignora un tier infinito",
        overrides: {
          price_3:
            Number.POSITIVE_INFINITY,
        },
        qty: 3,
        unitPrice: 10,
        subtotal: 30,
      },
      {
        name:
          "devuelve cero sin precio base válido",
        overrides: {
          price_1: 0,
          price_3: null,
          price_12: null,
          price_50: null,
          price_100: null,
        },
        qty: 1,
        unitPrice: 0,
        subtotal: 0,
      },
      {
        name:
          "ignora una oferta sin precio base válido",
        overrides: {
          price_1: 0,
          price_offer: 5,
          price_3: null,
          price_12: null,
          price_50: null,
          price_100: null,
        },
        qty: 1,
        unitPrice: 0,
        subtotal: 0,
      },
    ])(
      "$name",
      ({
        overrides,
        qty,
        unitPrice,
        subtotal,
      }) => {
        expect(
          getCartLinePricing(
            createItem({
              ...overrides,
              qty,
            }),
          ),
        ).toEqual({
          quantity: qty,
          unitPrice,
          subtotal,
        });
      },
    );
  },
);
