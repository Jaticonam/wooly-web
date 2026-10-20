import {
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
  reconcileCartWithProvider,
} from "./CartReconciliation";

function createProduct(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id:
      "OFERTA-001",

    title:
      "Producto en campaña",

    description:
      "Producto para prueba.",

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
      "Mantener esta nota",

    ...overrides,
  };
}

function createProvider(
  current:
    Product,
): CatalogProvider {
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
          current,
        ]),
  };
}

describe(
  "fin de una oferta persistida",
  () => {
    it(
      "reemplaza la oferta vencida y registra el cambio efectivo de precio",
      async () => {
        const result =
          await reconcileCartWithProvider(
            [
              createItem(),
            ],

            createProvider(
              createProduct({
                price_offer:
                  null,
              }),
            ),
          );

        expect(
          result.ok,
        ).toBe(
          true,
        );

        if (
          result.ok ===
          false
        ) {
          throw new Error(
            "La reconciliación debía ser exitosa.",
          );
        }

        expect(
          result.items[0],
        ).toMatchObject({
          id:
            "OFERTA-001",

          qty:
            3,

          note:
            "Mantener esta nota",

          price_offer:
            null,

          price_3:
            9,
        });

        expect(
          result.changes,
        ).toContainEqual({
          code:
            "PRICE_CHANGED",

          productId:
            "OFERTA-001",

          productTitle:
            "Producto en campaña",

          previousUnitPrice:
            8,

          currentUnitPrice:
            9,
        });
      },
    );
  },
);
