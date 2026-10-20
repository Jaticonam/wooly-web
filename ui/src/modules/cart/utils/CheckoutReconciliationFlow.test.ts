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

import type {
  Product,
} from "@wooly/contracts/types/product";

import type {
  CatalogProvider,
} from "@wooly/shared/catalog/providers/CatalogProvider";

import {
  checkoutWithProvider,
} from "./checkout";

function createProduct(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id:
      "OFERTA-001",

    title:
      "Producto vigente",

    description:
      "Producto para checkout.",

    category:
      "flores",

    price_1:
      10,

    price_3:
      9,

    price_12:
      8,

    price_50:
      7,

    price_100:
      6,

    price_offer:
      null,

    stock:
      100,

    img:
      "https://example.com/product.jpg",

    status:
      "publicado",

    ...overrides,
  };
}

function createItem(
  overrides:
    Partial<CartItem> = {},
): CartItem {
  return {
    ...createProduct({
      price_offer:
        8,
    }),

    qty:
      3,

    note:
      "Nota preservada",

    ...overrides,
  };
}

function createProvider():
  CatalogProvider {
  return {
    source:
      "contract-fixture",

    getCategories:
      () => [
        "flores",
      ],

    loadCampaigns:
      vi.fn()
        .mockResolvedValue(
          [],
        ),

    loadCategoryProducts:
      vi.fn()
        .mockResolvedValue([
          createProduct({
            price_offer:
              null,
          }),
        ]),
  };
}

afterEach(
  () => {
    vi.restoreAllMocks();
  },
);

describe(
  "checkout reconciliado en dos pasos",
  () => {
    it(
      "actualiza la caja y detiene WhatsApp cuando termina una oferta",
      async () => {
        const open =
          vi.spyOn(
            window,
            "open",
          );

        const onClearCart =
          vi.fn();

        const onClose =
          vi.fn();

        const onReplaceCart =
          vi.fn();

        const result =
          await checkoutWithProvider(
            createProvider(),
            [
              createItem(),
            ],
            0,
            onClearCart,
            onClose,
            onReplaceCart,
          );

        expect(
          result.status,
        ).toBe(
          "cart-updated",
        );

        expect(
          open,
        ).not.toHaveBeenCalled();

        expect(
          onClearCart,
        ).not.toHaveBeenCalled();

        expect(
          onClose,
        ).not.toHaveBeenCalled();

        expect(
          onReplaceCart,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          onReplaceCart,
        ).toHaveBeenCalledWith([
          expect.objectContaining({
            id:
              "OFERTA-001",

            qty:
              3,

            note:
              "Nota preservada",

            price_offer:
              null,

            price_3:
              9,
          }),
        ]);
      },
    );
  },
);
