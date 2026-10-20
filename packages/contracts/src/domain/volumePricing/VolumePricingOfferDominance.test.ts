import {
  getActiveVolumePriceQty,
  getAvailableVolumePrices,
  getBaseUnitPrice,
  getBestVolumePrice,
  getNextVolumePrice,
  getVolumeUnitPrice,
  hasValidOfferPrice,
} from "./VolumePricing";

import type {
  VolumePriceProduct,
} from "./VolumePricing";

function createProduct(
  overrides: Partial<VolumePriceProduct> = {},
): VolumePriceProduct {
  return {
    price_1: 10,
    price_3: 9,
    price_12: 7,
    price_50: 6,
    price_100: 5,
    price_offer: 8,
    ...overrides,
  };
}

describe(
  "oferta dominante",
  () => {
    it(
      "reconoce únicamente una oferta válida menor al precio base",
      () => {
        expect(
          hasValidOfferPrice(
            createProduct(),
          ),
        ).toBe(true);

        expect(
          hasValidOfferPrice(
            createProduct({
              price_offer: 10,
            }),
          ),
        ).toBe(false);

        expect(
          hasValidOfferPrice(
            createProduct({
              price_offer: 12,
            }),
          ),
        ).toBe(false);

        expect(
          hasValidOfferPrice(
            createProduct({
              price_offer: 0,
            }),
          ),
        ).toBe(false);

        expect(
          hasValidOfferPrice(
            createProduct({
              price_1: 0,
              price_offer: 5,
            }),
          ),
        ).toBe(false);
      },
    );

    it.each([
      1,
      2,
      3,
      12,
      50,
      100,
      250,
    ])(
      "mantiene la oferta para cantidad %s",
      (quantity) => {
        const product =
          createProduct();

        expect(
          getVolumeUnitPrice(
            product,
            quantity,
          ),
        ).toBe(8);
      },
    );

    it(
      "expone únicamente el precio de oferta como precio disponible",
      () => {
        const product =
          createProduct();

        expect(
          getAvailableVolumePrices(
            product,
          ),
        ).toEqual([
          {
            qty: 1,
            key: "price_1",
            label: "1u",
            className:
              "volume-price-1",
            unitPrice: 8,
          },
        ]);

        expect(
          getAvailableVolumePrices(
            product,
            {
              includeBasePrice: false,
            },
          ),
        ).toEqual([]);
      },
    );

    it(
      "desactiva el siguiente tier y conserva la oferta como nivel activo",
      () => {
        const product =
          createProduct();

        expect(
          getNextVolumePrice(
            product,
            1,
          ),
        ).toBeNull();

        expect(
          getNextVolumePrice(
            product,
            12,
          ),
        ).toBeNull();

        expect(
          getActiveVolumePriceQty(
            product,
            100,
          ),
        ).toBe(1);
      },
    );

    it(
      "considera la oferta como mejor y único precio",
      () => {
        const product =
          createProduct();

        expect(
          getBaseUnitPrice(
            product,
          ),
        ).toBe(8);

        expect(
          getBestVolumePrice(
            product,
          ),
        ).toEqual({
          qty: 1,
          key: "price_1",
          label: "1u",
          className:
            "volume-price-1",
          unitPrice: 8,
        });
      },
    );

    it(
      "mantiene los tiers cuando la oferta es inválida",
      () => {
        const product =
          createProduct({
            price_offer: 12,
          });

        expect(
          getVolumeUnitPrice(
            product,
            12,
          ),
        ).toBe(7);

        expect(
          getNextVolumePrice(
            product,
            3,
          ),
        ).toEqual({
          qty: 12,
          unitPrice: 7,
        });

        expect(
          getActiveVolumePriceQty(
            product,
            12,
          ),
        ).toBe(12);
      },
    );
  },
);
