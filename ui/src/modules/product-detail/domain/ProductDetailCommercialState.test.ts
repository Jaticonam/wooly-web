import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  resolveProductDetailCommercialState,
} from "./ProductDetailCommercialState";

/* =========================================================
   FIXTURE
   ========================================================= */

function createProduct(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id:
      "FLOR-001",

    title:
      "Rosa premium",

    description:
      "Producto de prueba.",

    category:
      "flores",

    price_1:
      10,

    price_3:
      9,

    price_12:
      8,

    stock:
      20,

    img:
      "https://example.com/product.jpg",

    status:
      "publicado",

    campaigns:
      [],

    priority:
      0,

    ...overrides,
  };
}

/* =========================================================
   PRUEBAS
   ========================================================= */

describe(
  "ProductDetailCommercialState",
  () => {
    it(
      "habilita compra, precios y cantidades para publicado válido",
      () => {
        const result =
          resolveProductDetailCommercialState(
            createProduct(),
          );

        expect(
          result.status,
        ).toBe(
          "publicado",
        );

        expect(
          result.isPubliclyVisible,
        ).toBe(true);

        expect(
          result.isPurchasable,
        ).toBe(true);

        expect(
          result.isConsultOnly,
        ).toBe(false);

        expect(
          result.canShowPricing,
        ).toBe(true);

        expect(
          result.canShowInventoryQuantity,
        ).toBe(true);

        expect(
          result.canShowVolumePricing,
        ).toBe(true);

        expect(
          result.canSelectQuantity,
        ).toBe(true);
      },
    );

    it(
      "neutraliza precio, inventario, escalas y cantidad en preventa",
      () => {
        const result =
          resolveProductDetailCommercialState(
            createProduct({
              status:
                "preventa",

              price_1:
                999,

              price_3:
                888,

              stock:
                500,
            }),
          );

        expect(
          result.isPubliclyVisible,
        ).toBe(true);

        expect(
          result.isPreventa,
        ).toBe(true);

        expect(
          result.isPurchasable,
        ).toBe(false);

        expect(
          result.isConsultOnly,
        ).toBe(true);

        expect(
          result.canShowPricing,
        ).toBe(false);

        expect(
          result.canShowInventoryQuantity,
        ).toBe(false);

        expect(
          result.canShowVolumePricing,
        ).toBe(false);

        expect(
          result.canSelectQuantity,
        ).toBe(false);
      },
    );

    it(
      "mantiene agotado aunque la cantidad almacenada sea positiva",
      () => {
        const result =
          resolveProductDetailCommercialState(
            createProduct({
              status:
                "agotado",

              stock:
                500,
            }),
          );

        expect(
          result.isPubliclyVisible,
        ).toBe(true);

        expect(
          result.isAgotado,
        ).toBe(true);

        expect(
          result.isPurchasable,
        ).toBe(false);

        expect(
          result.isConsultOnly,
        ).toBe(true);

        expect(
          result.canShowPricing,
        ).toBe(true);

        expect(
          result.canShowInventoryQuantity,
        ).toBe(false);

        expect(
          result.canShowVolumePricing,
        ).toBe(false);

        expect(
          result.canSelectQuantity,
        ).toBe(false);
      },
    );

    it.each([
      "oculto",
      "borrador",
      "",
      "pendiente",
    ])(
      "bloquea completamente el estado %s",
      (status) => {
        const result =
          resolveProductDetailCommercialState(
            createProduct({
              status,
            }),
          );

        expect(
          result.isPubliclyVisible,
        ).toBe(false);

        expect(
          result.isPurchasable,
        ).toBe(false);

        expect(
          result.isConsultOnly,
        ).toBe(false);

        expect(
          result.canShowPricing,
        ).toBe(false);

        expect(
          result.canShowInventoryQuantity,
        ).toBe(false);

        expect(
          result.canShowVolumePricing,
        ).toBe(false);
      },
    );

    it(
      "bloquea publicado con stock cero en vez de convertirlo en agotado",
      () => {
        const result =
          resolveProductDetailCommercialState(
            createProduct({
              status:
                "publicado",

              stock:
                0,
            }),
          );

        expect(
          result.status,
        ).toBe(
          "publicado",
        );

        expect(
          result.isAgotado,
        ).toBe(false);

        expect(
          result.isPubliclyVisible,
        ).toBe(false);

        expect(
          result.isPurchasable,
        ).toBe(false);
      },
    );
  },
);
