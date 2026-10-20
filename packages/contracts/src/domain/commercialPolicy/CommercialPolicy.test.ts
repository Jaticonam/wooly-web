import {
  describe,
  expect,
  it,
} from "vitest";

import {
  resolveProductCommercialState,
  type ProductCommercialStateInput,
} from ".";

function resolve(
  overrides:
    ProductCommercialStateInput = {},
) {
  return resolveProductCommercialState({
    status: "publicado",
    price_1: 10,
    stock: 20,
    ...overrides,
  });
}

describe(
  "resolveProductCommercialState",
  () => {
    it(
      "resuelve un publicado disponible",
      () => {
        expect(resolve()).toMatchObject({
          publication: "PUBLISHED",
          availability: "AVAILABLE",
          purchaseMode: "CART",
          isPubliclyVisible: true,
          isPurchasable: true,
          canShowPricing: true,
          canShowInventoryQuantity: true,
          issues: [],
        });
      },
    );

    it.each([
      ["cero", 0, "stock-status-mismatch"],
      ["negativo", -1, "invalid-stock"],
      ["null", null, "invalid-stock"],
      ["NaN", Number.NaN, "invalid-stock"],
      ["Infinity", Number.POSITIVE_INFINITY, "invalid-stock"],
    ])(
      "invalida publicado con stock %s",
      (
        _label,
        stock,
        expectedIssue,
      ) => {
        expect(
          resolve({
            stock,
          }),
        ).toMatchObject({
          publication: "PUBLISHED",
          availability: "INVALID",
          purchaseMode: "NONE",
          isPubliclyVisible: false,
          isPurchasable: false,
          canShowPricing: false,
          canShowInventoryQuantity: false,
          issues: [
            expectedIssue,
          ],
        });
      },
    );

    it.each([
      0,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      "invalida publicado con precio base %s",
      (price_1) => {
        const state =
          resolve({
            price_1,
          });

        expect(
          state.availability,
        ).toBe("INVALID");

        expect(
          state.issues,
        ).toContain(
          "invalid-base-price",
        );
      },
    );

    it.each([
      ["válida", 8],
      ["igual al base", 10],
      ["superior al base", 12],
      ["cero", 0],
      ["negativa", -1],
      ["NaN", Number.NaN],
      [
        "Infinity",
        Number.POSITIVE_INFINITY,
      ],
    ])(
      "mantiene disponible con oferta %s",
      (_label, price_offer) => {
        expect(
          resolve({
            price_offer,
          }),
        ).toMatchObject({
          availability: "AVAILABLE",
          purchaseMode: "CART",
          issues: [],
        });
      },
    );

    it.each([
      {
        price_1: undefined,
        stock: undefined,
      },
      {
        price_1: 0,
        stock: null,
      },
    ])(
      "resuelve preventa sin exigir precio ni stock",
      (commercialData) => {
        expect(
          resolve({
            status: "preventa",
            ...commercialData,
          }),
        ).toMatchObject({
          publication: "PUBLISHED",
          availability: "PREORDER",
          purchaseMode: "PREORDER",
          isPubliclyVisible: true,
          isPurchasable: false,
          canShowPricing: false,
          canShowInventoryQuantity: false,
          issues: [],
        });
      },
    );

    it.each([
      0,
      25,
      null,
    ])(
      "resuelve agotado sin depender del stock %s",
      (stock) => {
        expect(
          resolve({
            status: "agotado",
            stock,
          }),
        ).toMatchObject({
          publication: "PUBLISHED",
          availability: "OUT_OF_STOCK",
          purchaseMode: "WHATSAPP",
          isPubliclyVisible: true,
          isPurchasable: false,
          canShowPricing: true,
          canShowInventoryQuantity: false,
          issues: [],
        });
      },
    );

    it(
      "invalida agotado sin precio base",
      () => {
        expect(
          resolve({
            status: "agotado",
            price_1: 0,
          }),
        ).toMatchObject({
          publication: "PUBLISHED",
          availability: "INVALID",
          purchaseMode: "NONE",
          isPubliclyVisible: false,
          issues: [
            "invalid-base-price",
          ],
        });
      },
    );

    it.each([
      "oculto",
      "borrador",
    ])(
      "resuelve %s como no publicado",
      (status) => {
        expect(
          resolve({
            status,
            price_1: 0,
            stock: null,
          }),
        ).toMatchObject({
          publication: "UNPUBLISHED",
          availability: "UNTRACKED",
          purchaseMode: "NONE",
          isPubliclyVisible: false,
          isPurchasable: false,
          canShowPricing: false,
          canShowInventoryQuantity: false,
          issues: [
            "non-public-status",
          ],
        });
      },
    );

    it.each([
      undefined,
      "",
      "published",
      "pendiente",
    ])(
      "invalida el estado fuente %s",
      (status) => {
        expect(
          resolve({
            status,
          }),
        ).toMatchObject({
          publication: "INVALID",
          availability: "INVALID",
          purchaseMode: "NONE",
          isPubliclyVisible: false,
          isPurchasable: false,
          issues: [
            "invalid-status",
          ],
        });
      },
    );

    it(
      "normaliza espacios y mayúsculas",
      () => {
        expect(
          resolve({
            status:
              " Publicado ",
          }).availability,
        ).toBe("AVAILABLE");
      },
    );

    it.each([
      {},
      {
        status: "preventa",
        price_1: 0,
        stock: null,
      },
      {
        status: "agotado",
      },
      {
        status: "oculto",
      },
      {
        status: "desconocido",
      },
      {
        stock: 0,
      },
    ])(
      "mantiene invariantes para %o",
      (input) => {
        const state =
          resolve(input);

        if (state.isPurchasable) {
          expect(
            state.purchaseMode,
          ).toBe("CART");
          expect(
            state.availability,
          ).toBe("AVAILABLE");
          expect(
            state.isPubliclyVisible,
          ).toBe(true);
        }

        if (
          state.purchaseMode ===
          "NONE"
        ) {
          expect(
            state.isPurchasable,
          ).toBe(false);
        }

        if (
          state.availability ===
          "PREORDER"
        ) {
          expect(
            state.canShowPricing,
          ).toBe(false);
        }

        if (
          state.availability ===
          "OUT_OF_STOCK"
        ) {
          expect(
            state.canShowPricing,
          ).toBe(true);
        }

        if (
          state.publication !==
          "PUBLISHED"
        ) {
          expect(
            state.isPubliclyVisible,
          ).toBe(false);
        }
      },
    );
  },
);
