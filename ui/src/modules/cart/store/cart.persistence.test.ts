import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  CartItem,
} from "@/modules/cart/types";

import {
  CART_KEY,
  CART_SCHEMA_VERSION,
  loadCart,
  parsePersistedCart,
  readPersistedCart,
  sanitizePersistedCart,
  saveCart,
} from "./cart.persistence";

function createCartItem(
  overrides: Partial<CartItem> = {},
): CartItem {
  return {
    id: "FLOR-001",
    title: "Rosa premium",
    description: "Producto de prueba.",
    category: "flores",
    price_1: 10,
    stock: 20,
    img: "https://example.com/product.jpg",
    status: "publicado",
    campaigns: [],
    priority: 0,
    qty: 1,
    note: "",
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe(
  "sanitizePersistedCart",
  () => {
    it.each([
      undefined,
      null,
      true,
      42,
      "cart",
      {},
    ])(
      "descarta una raíz no iterable: %s",
      (value) => {
        expect(
          sanitizePersistedCart(
            value,
          ),
        ).toEqual([]);
      },
    );

    it(
      "acepta un carrito vacío",
      () => {
        expect(
          sanitizePersistedCart(
            [],
          ),
        ).toEqual([]);
      },
    );

    it(
      "preserva el snapshot, la nota y los metadatos válidos",
      () => {
        const item =
          createCartItem({
            note: "Sin espinas",
            badges: ["premium"],
            gallery: "rosa-2.jpg",
          });

        expect(
          sanitizePersistedCart(
            [item],
          ),
        ).toEqual([item]);
      },
    );

    it.each([
      null,
      "producto",
      7,
      {},
      createCartItem({
        id: "",
      }),
      {
        id: "SIN-DATOS",
        price_1: 10,
      },
      createCartItem({
        title: "",
      }),
      createCartItem({
        img: "",
      }),
    ])(
      "descarta una línea sin datos mínimos",
      (item) => {
        expect(
          sanitizePersistedCart(
            [item],
          ),
        ).toEqual([]);
      },
    );

    it.each([
      0,
      -10,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      "descarta price_1 inválido: %s",
      (price_1) => {
        expect(
          sanitizePersistedCart([
            createCartItem({
              price_1,
            }),
          ]),
        ).toEqual([]);
      },
    );

    it(
      "acepta una oferta inferior con precio base válido",
      () => {
        const [item] =
          sanitizePersistedCart([
            createCartItem({
              price_1: 10,
              price_offer: 8,
            }),
          ]);

        expect(item.price_offer).toBe(8);
      },
    );

    it.each([
      [
        "preventa",
        {
          status: "preventa",
          stock: null,
        },
      ],
      [
        "agotado",
        { status: "agotado" },
      ],
      [
        "oculto",
        { status: "oculto" },
      ],
      [
        "borrador",
        { status: "borrador" },
      ],
      [
        "estado desconocido",
        { status: "pendiente" },
      ],
      [
        "estado ausente",
        { status: undefined },
      ],
      [
        "stock cero",
        { stock: 0 },
      ],
      [
        "stock negativo",
        { stock: -1 },
      ],
      [
        "stock null",
        { stock: null },
      ],
      [
        "stock NaN",
        { stock: Number.NaN },
      ],
      [
        "stock Infinity",
        {
          stock:
            Number.POSITIVE_INFINITY,
        },
      ],
    ])(
      "descarta snapshot comercialmente inelegible: %s",
      (_label, overrides) => {
        expect(
          sanitizePersistedCart([
            createCartItem(
              overrides,
            ),
          ]),
        ).toEqual([]);
      },
    );

    it(
      "conserva la línea pero no sustituye el precio base con una oferta alta",
      () => {
        const [item] =
          sanitizePersistedCart([
            createCartItem({
              price_1: 10,
              price_offer: 12,
            }),
          ]);

        expect(item.price_1).toBe(10);
        expect(item.price_offer).toBe(12);
      },
    );

    it(
      "descarta una oferta sin precio base válido",
      () => {
        expect(
          sanitizePersistedCart([
            createCartItem({
              price_1: 0,
              price_offer: 8,
            }),
          ]),
        ).toEqual([]);
      },
    );

    it.each([
      [4, 4],
      [3.9, 3],
      [0, 1],
      [-4, 1],
      [Number.NaN, 1],
      [Number.POSITIVE_INFINITY, 1],
      [undefined, 1],
    ])(
      "normaliza qty %s a %s",
      (qty, expected) => {
        const input = {
          ...createCartItem(),
          qty,
        };

        const [item] =
          sanitizePersistedCart(
            [input],
          );

        expect(item.qty).toBe(
          expected,
        );
      },
    );

    it(
      "retiene solo las líneas válidas de una mezcla",
      () => {
        const valid =
          createCartItem();

        expect(
          sanitizePersistedCart([
            valid,
            null,
            createCartItem({
              id: "",
            }),
            createCartItem({
              price_1: -1,
            }),
          ]),
        ).toEqual([valid]);
      },
    );
  },
);

describe(
  "persistencia del carrito",
  () => {
    it.each([
      null,
      "",
      "{",
      "null",
      "true",
      "42",
      JSON.stringify({}),
    ])(
      "convierte una carga inesperada en carrito vacío: %s",
      (value) => {
        expect(
          parsePersistedCart(
            value,
          ),
        ).toEqual([]);
      },
    );

    it(
      "carga y sanea JSON válido",
      () => {
        localStorage.setItem(
          CART_KEY,
          JSON.stringify([
            createCartItem({
              qty: 3.9,
            }),
          ]),
        );

      expect(
          loadCart()[0].qty,
        ).toBe(3);
      },
    );

    it(
      "carga el envelope vigente",
      () => {
        localStorage.setItem(
          CART_KEY,
          JSON.stringify({
            schemaVersion:
              CART_SCHEMA_VERSION,
            data: [
              createCartItem({
                qty: 2,
              }),
            ],
          }),
        );

        expect(loadCart()[0].qty).toBe(2);
      },
    );

    it(
      "rechaza una versión futura sin interpretarla como carrito",
      () => {
        expect(
          readPersistedCart(
            JSON.stringify({
              schemaVersion: 2,
              data: [
                createCartItem(),
              ],
            }),
          ),
        ).toEqual({
          success: false,
          reason:
            "UNSUPPORTED_VERSION",
        });
      },
    );

    it(
      "carga solo líneas comercialmente elegibles",
      () => {
        localStorage.setItem(
          CART_KEY,
          JSON.stringify([
            createCartItem({
              id: "VALIDO",
            }),
            createCartItem({
              id: "PREVENTA",
              status: "preventa",
            }),
            createCartItem({
              id: "SIN-STOCK",
              stock: 0,
            }),
          ]),
        );

        expect(
          loadCart().map(
            (item) => item.id,
          ),
        ).toEqual([
          "VALIDO",
        ]);
      },
    );

    it(
      "devuelve vacío si localStorage no está disponible",
      () => {
        vi.spyOn(
          Storage.prototype,
          "getItem",
        ).mockImplementation(
          () => {
            throw new DOMException(
              "Storage unavailable",
              "SecurityError",
            );
          },
        );

        expect(
          loadCart(),
        ).toEqual([]);
      },
    );

    it(
      "guarda únicamente líneas válidas y normalizadas",
      () => {
        saveCart([
          createCartItem({
            qty: 3.9,
          }),
          createCartItem({
            id: "",
          }),
        ]);

        expect(
          JSON.parse(
            localStorage.getItem(
              CART_KEY,
            ) ?? "{}",
          ),
        ).toEqual({
          schemaVersion:
            CART_SCHEMA_VERSION,
          data: [
            createCartItem({
              qty: 3,
            }),
          ],
        });
      },
    );

    it(
      "tolera errores al guardar",
      () => {
        vi.spyOn(
          Storage.prototype,
          "setItem",
        ).mockImplementation(
          () => {
            throw new DOMException(
              "Storage unavailable",
              "SecurityError",
            );
          },
        );

        expect(() =>
          saveCart([
            createCartItem(),
          ]),
        ).not.toThrow();
      },
    );
  },
);
