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

function product(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id: "P-1",
    title: "Producto vigente",
    description: "Descripción",
    category: "flores",
    price_1: 10,
    stock: 10,
    img:
      "https://example.com/product.jpg",
    status: "publicado",
    ...overrides,
  };
}

function item(
  overrides:
    Partial<CartItem> = {},
): CartItem {
  return {
    ...product(),
    qty: 2,
    note: "Nota",
    ...overrides,
  };
}

function provider(
  products:
    Product[],
): CatalogProvider {
  return {
    source:
      "contract-fixture",
    getCategories: () => [
      "flores",
    ],
    loadCampaigns:
      vi.fn().mockResolvedValue(
        [],
      ),
    loadCategoryProducts:
      vi.fn().mockResolvedValue(
        products,
      ),
  };
}

describe(
  "reconcileCartWithProvider",
  () => {
    it(
      "preserva una línea vigente sin cambios",
      async () => {
        const original =
          item();
        const result =
          await reconcileCartWithProvider(
            [original],
            provider([
              product(),
            ]),
          );

        expect(result).toEqual({
          ok: true,
          items: [original],
          changes: [],
        });
      },
    );

    it(
      "actualiza precio y snapshot usando la fuente vigente",
      async () => {
        const result =
          await reconcileCartWithProvider(
            [item()],
            provider([
              product({
                title:
                  "Producto actualizado",
                price_1: 12,
              }),
            ]),
          );

        expect(
          result.ok &&
          result.items[0],
        ).toMatchObject({
          title:
            "Producto actualizado",
          price_1: 12,
          qty: 2,
          note: "Nota",
        });
        expect(
          result.ok &&
          result.changes.map(
            (change) =>
              change.code,
          ),
        ).toEqual([
          "PRICE_CHANGED",
          "PRODUCT_DATA_REFRESHED",
        ]);
      },
    );

    it.each([
      [
        "agotado",
        product({
          stock: 0,
        }),
        "PRODUCT_OUT_OF_STOCK",
      ],
      [
        "oculto",
        product({
          status: "oculto",
        }),
        "PRODUCT_UNPUBLISHED",
      ],
    ])(
      "retira producto %s",
      async (
        _label,
        current,
        code,
      ) => {
        const result =
          await reconcileCartWithProvider(
            [item()],
            provider([
              current,
            ]),
          );

        expect(result).toMatchObject({
          ok: true,
          items: [],
          changes: [{
            code,
            productId: "P-1",
          }],
        });
      },
    );

    it(
      "registra producto inexistente",
      async () => {
        await expect(
          reconcileCartWithProvider(
            [item()],
            provider([]),
          ),
        ).resolves.toMatchObject({
          ok: true,
          items: [],
          changes: [{
            code:
              "PRODUCT_NOT_FOUND",
          }],
        });
      },
    );

    it(
      "normaliza cantidad sin mutar el carrito",
      async () => {
        const original =
          item({
            qty: 3.8,
          });
        const before =
          structuredClone(
            original,
          );
        const result =
          await reconcileCartWithProvider(
            [original],
            provider([
              product(),
            ]),
          );

        expect(original).toEqual(
          before,
        );
        expect(
          result.ok &&
          result.items[0].qty,
        ).toBe(3);
        expect(
          result.ok &&
          result.changes,
        ).toEqual([
          {
            code:
              "QUANTITY_NORMALIZED",

            productId:
              "P-1",

            productTitle:
              "Producto vigente",
          },
        ]);
      },
    );

    it(
      "preserva el carrito ante fallo del provider",
      async () => {
        const original =
          item();
        const failing =
          provider([]);
        vi.mocked(
          failing.loadCampaigns,
        ).mockRejectedValue(
          new Error("offline"),
        );

        await expect(
          reconcileCartWithProvider(
            [original],
            failing,
          ),
        ).resolves.toEqual({
          ok: false,
          reason:
            "PROVIDER_ERROR",
          originalItems: [
            original,
          ],
        });
      },
    );
  },
);
