import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CartItem,
} from "@/modules/cart/types";

import {
  getTotalItems,
  getTotalOriginal,
  getTotalPrice,
  getTotalSavings,
} from "./cart.selectors";

function createItem(
  overrides:
    Partial<CartItem> = {},
): CartItem {
  return {
    id: "TEST-001",
    title: "Producto de prueba",
    description:
      "Producto para selectores.",
    category: "pruebas",
    price_1: 10,
    price_3: 9,
    price_12: 7,
    price_50: 6.5,
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

function expectTotals(
  cart: CartItem[],
  expected: {
    total: number;
    original: number;
    savings: number;
  },
) {
  expect(
    getTotalPrice(
      cart,
    ),
  ).toBe(
    expected.total,
  );

  expect(
    getTotalOriginal(
      cart,
    ),
  ).toBe(
    expected.original,
  );

  expect(
    getTotalSavings(
      cart,
    ),
  ).toBe(
    expected.savings,
  );
}

describe(
  "cart.selectors",
  () => {
    it(
      "devuelve totales en cero para un carrito vacío",
      () => {
        expectTotals(
          [],
          {
            total: 0,
            original: 0,
            savings: 0,
          },
        );
        expect(
          getTotalItems(
            [],
          ),
        ).toBe(0);
      },
    );

    it(
      "calcula una línea con precio base",
      () => {
        expectTotals(
          [
            createItem(),
          ],
          {
            total: 10,
            original: 10,
            savings: 0,
          },
        );
      },
    );

    it(
      "aplica una oferta válida",
      () => {
        expectTotals(
          [
            createItem({
              price_offer: 8,
            }),
          ],
          {
            total: 8,
            original: 10,
            savings: 2,
          },
        );
      },
    );

    it.each([
      {
        qty: 1,
        total: 8,
      },
      {
        qty: 2,
        total: 16,
      },
      {
        qty: 3,
        total: 24,
      },
      {
        qty: 12,
        total: 96,
      },
    ])(
      "mantiene la oferta dominante para cantidad $qty",
      ({
        qty,
        total,
      }) => {
        expect(
          getTotalPrice([
            createItem({
              qty,
              price_offer: 8,
            }),
          ]),
        ).toBe(
          total,
        );
      },
    );

    it(
      "ignora una oferta mayor al precio base",
      () => {
        expectTotals(
          [
            createItem({
              price_offer: 12,
            }),
          ],
          {
            total: 10,
            original: 10,
            savings: 0,
          },
        );
      },
    );

    it(
      "aplica el tier de tres unidades",
      () => {
        expectTotals(
          [
            createItem({
              qty: 3,
            }),
          ],
          {
            total: 27,
            original: 30,
            savings: 3,
          },
        );
      },
    );

    it(
      "retrocede ante un tier parcial",
      () => {
        expectTotals(
          [
            createItem({
              qty: 12,
              price_12: null,
            }),
          ],
          {
            total: 108,
            original: 120,
            savings: 12,
          },
        );
      },
    );

    it.each([
      {
        name:
          "tier negativo",
        price_3: -5,
      },
      {
        name:
          "tier infinito",
        price_3:
          Number.POSITIVE_INFINITY,
      },
      {
        name:
          "tier NaN",
        price_3:
          Number.NaN,
      },
      {
        name:
          "tier cero",
        price_3: 0,
      },
    ])(
      "ignora $name",
      ({
        price_3,
      }) => {
        expectTotals(
          [
            createItem({
              qty: 3,
              price_3,
            }),
          ],
          {
            total: 30,
            original: 30,
            savings: 0,
          },
        );
      },
    );

    it(
      "devuelve importes en cero sin un precio válido",
      () => {
        expectTotals(
          [
            createItem({
              price_1: 0,
              price_3: null,
              price_12: null,
              price_50: null,
              price_100: null,
            }),
          ],
          {
            total: 0,
            original: 0,
            savings: 0,
          },
        );
      },
    );

    it(
      "suma múltiples líneas canónicas",
      () => {
        const cart = [
          createItem({
            id: "OFFER-001",
            price_offer: 8,
          }),
          createItem({
            id: "TIER-003",
            qty: 3,
          }),
        ];

        expectTotals(
          cart,
          {
            total: 35,
            original: 40,
            savings: 5,
          },
        );
        expect(
          getTotalItems(
            cart,
          ),
        ).toBe(4);
      },
    );

    it(
      "usa cantidad efectiva uno para una cantidad persistida cero",
      () => {
        expectTotals(
          [
            createItem({
              qty: 0,
            }),
          ],
          {
            total: 10,
            original: 10,
            savings: 0,
          },
        );
      },
    );

    it.each([
      {
        name: "NaN",
        qty: Number.NaN,
      },
      {
        name: "infinita",
        qty:
          Number.POSITIVE_INFINITY,
      },
    ])(
      "usa cantidad efectiva uno para una cantidad persistida $name",
      ({
        qty,
      }) => {
        expectTotals(
          [
            createItem({
              qty,
            }),
          ],
          {
            total: 10,
            original: 10,
            savings: 0,
          },
        );

        expect(
          getTotalItems([
            createItem({
              qty,
            }),
          ]),
        ).toBe(0);
      },
    );
  },
);
