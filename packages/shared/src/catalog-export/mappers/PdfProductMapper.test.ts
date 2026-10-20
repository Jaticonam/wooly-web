import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  getAvailableVolumePrices,
  getBaseUnitPrice,
} from "@wooly/contracts/domain/volumePricing/VolumePricing";

import {
  mapProductToPdfProduct,
  mapProductsToPdfProducts,
} from "./PdfProductMapper";

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

    price_50:
      7,

    price_100:
      6,

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

describe(
  "PdfProductMapper",
  () => {
    it(
      "neutraliza precio y stock de preventa",
      () => {
        const [result] =
          mapProductsToPdfProducts([
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
          ]);

        expect(
          result.presentation,
        ).toBe(
          "preventa",
        );

        expect(
          result.showPricing,
        ).toBe(false);

        expect(
          result.showWholesalePricing,
        ).toBe(false);

        expect(
          result.price1,
        ).toBe(0);

        expect(
          result.volumePrices,
        ).toEqual([]);

        expect(
          result.stock,
        ).toBeNull();
      },
    );

    it.each([
      ["sin oferta", undefined, 10],
      ["oferta válida", 8, 8],
      ["oferta igual", 10, 10],
      ["oferta superior", 12, 10],
      ["oferta cero", 0, 10],
      ["oferta negativa", -2, 10],
      ["oferta NaN", Number.NaN, 10],
      [
        "oferta Infinity",
        Number.POSITIVE_INFINITY,
        10,
      ],
    ])(
      "resuelve el precio principal con %s",
      (
        _case,
        price_offer,
        expected,
      ) => {
        const result =
          mapProductToPdfProduct(
            createProduct({
              price_offer,
            }),
          );

        expect(
          result.primaryPrice,
        ).toBe(expected);

        expect(
          result.primaryPrice,
        ).toBe(
          getBaseUnitPrice(
            createProduct({
              price_offer,
            }),
          ),
        );
      },
    );

    it.each([
      0,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      "neutraliza price_1 inválido: %s",
      (price_1) => {
        const result =
          mapProductToPdfProduct(
            createProduct({
              price_1,
              price_offer: 5,
            }),
          );

        expect(
          result.primaryPrice,
        ).toBe(0);
        expect(
          result.offerPrice,
        ).toBeNull();
        expect(
          result.showPricing,
        ).toBe(false);
      },
    );

    it(
      "preserva oferta anterior únicamente cuando el dominio la acepta",
      () => {
        const validOffer =
          mapProductToPdfProduct(
            createProduct({
              price_offer: 8,
            }),
          );

        const invalidOffer =
          mapProductToPdfProduct(
            createProduct({
              price_offer: 12,
            }),
          );

        expect(
          validOffer.price1,
        ).toBe(10);
        expect(
          validOffer.offerPrice,
        ).toBe(8);
        expect(
          invalidOffer.offerPrice,
        ).toBeNull();
      },
    );

    it(
      "construye tiers PDF en orden canónico y conserva etiquetas",
      () => {
        const result =
          mapProductToPdfProduct(
            createProduct(),
          );

        expect(
          result.volumePrices,
        ).toEqual([
          {
            kind: "price3",
            qty: 3,
            label:
              "Por Mayor (3u) a",
            unitPrice: 9,
          },
          {
            kind: "price12",
            qty: 12,
            label:
              "Por Docena (12u) a",
            unitPrice: 8,
          },
          {
            kind: "price50",
            qty: 50,
            label:
              "Por 50 (50u) a",
            unitPrice: 7,
          },
          {
            kind: "price100",
            qty: 100,
            label:
              "Por 100 (100u) a",
            unitPrice: 6,
          },
        ]);

        expect(
          result.volumePrices.some(
            (tier) =>
              tier.qty === 1,
          ),
        ).toBe(false);
      },
    );

    it(
      "omite tiers inválidos y conserva únicamente tiers parciales",
      () => {
        const product =
          createProduct({
            price_3: -5,
            price_12:
              Number.POSITIVE_INFINITY,
            price_50:
              Number.NaN,
            price_100: 5,
          });

        const result =
          mapProductToPdfProduct(
            product,
          );

        expect(
          result.volumePrices,
        ).toEqual([
          {
            kind: "price100",
            qty: 100,
            label:
              "Por 100 (100u) a",
            unitPrice: 5,
          },
        ]);

        expect(
          result.volumePrices,
        ).toEqual(
          getAvailableVolumePrices(
            product,
            {
              includeBasePrice:
                false,
            },
          ).map(
            (tier) => ({
              kind:
                `price${tier.qty}`,
              qty:
                tier.qty,
              label:
                "Por 100 (100u) a",
              unitPrice:
                tier.unitPrice,
            }),
          ),
        );
      },
    );

    it(
      "considera agotado sin importar la cantidad",
      () => {
        const [result] =
          mapProductsToPdfProducts([
            createProduct({
              status:
                "agotado",

              stock:
                500,
            }),
          ]);

        expect(
          result.presentation,
        ).toBe(
          "agotado",
        );

        expect(
          result.stockLabel,
        ).toBe(
          "Agotado",
        );

        expect(
          result.stock,
        ).toBeNull();

        expect(
          result.showPricing,
        ).toBe(true);

        expect(
          result.showWholesalePricing,
        ).toBe(false);
      },
    );

    it.each([
      "oculto",
      "borrador",
      "",
      "pendiente",
    ])(
      "excluye estado %s",
      (status) => {
        const result =
          mapProductsToPdfProducts([
            createProduct({
              status,
            }),
          ]);

        expect(
          result,
        ).toEqual([]);
      },
    );

    it(
      "excluye publicado con stock cero",
      () => {
        const result =
          mapProductsToPdfProducts([
            createProduct({
              status:
                "publicado",

              stock:
                0,
            }),
          ]);

        expect(
          result,
        ).toEqual([]);
      },
    );
  },
);
