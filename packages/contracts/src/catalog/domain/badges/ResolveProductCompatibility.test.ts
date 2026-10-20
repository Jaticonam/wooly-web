import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Campaign,
  Product,
} from "../../../types/product";

import {
  getProductDisplayIndicators,
  resolveProductCompatibility,
} from "./index";

const createProduct = (
  overrides:
    Partial<Product> = {},
): Product => ({
  id:
    "TEST-001",

  title:
    "Producto de prueba",

  description:
    "Producto para pruebas",

  category:
    "cajas",

  price_1:
    10,

  stock:
    10,

  img:
    "/placeholder.svg",

  badges:
    [],

  campaigns:
    [],

  ...overrides,
});

const createCampaign =
  (): Campaign => ({
    id:
      "dia-madre",

    name:
      "Día de la Madre",

    icon:
      "💐",

    color:
      "lavanda",

    themeToken:
      "campaign.lavanda",

    colorClass:
      "catalog-campaign-lavender",

    startDate:
      "01/01/2000",

    endDate:
      "31/12/2999",

    priority:
      90,

    publicationStatus:
      "Publicado",

    computedStatus:
      "activa",
  });

describe(
  "resolveProductCompatibility",
  () => {
    it(
      "homologa Más vendido",
      () => {
        const profile =
          resolveProductCompatibility(
            createProduct({
              badges:
                ["Más vendido"],
            }),
          );

        expect(
          profile.badges[0],
        ).toMatchObject({
          code:
            "merchandising.bestSeller",

          kind:
            "merchandising",

          source:
            "legacyManual",
        });
      },
    );

    it(
      "descarta Todo el Año como valor legacy obsoleto",
      () => {
        const profile =
          resolveProductCompatibility(
            createProduct({
              badges:
                ["✨Todo el Año"],
            }),
          );

        expect(
          profile.badges,
        ).toHaveLength(0);

        expect(
          profile.ignoredLegacyValues,
        ).toHaveLength(0);

        expect(
          profile.unknownLegacyValues,
        ).toHaveLength(0);
      },
    );

    it(
      "no crea campañas desde badge",
      () => {
        const profile =
          resolveProductCompatibility(
            createProduct({
              badges:
                ["Día de la Novia"],
            }),
          );

        expect(
          profile.badges,
        ).toHaveLength(0);

        expect(
          profile.ignoredLegacyValues[0].reason,
        ).toBe(
          "campaignMustComeFromSheetCampaign",
        );
      },
    );

    it(
      "deriva Promo Flash",
      () => {
        const profile =
          resolveProductCompatibility(
            createProduct({
              price_offer:
                8,
            }),
          );

        expect(
          profile.badges[0],
        ).toMatchObject({
          code:
            "promotion.flash",

          source:
            "pricingRule",
        });
      },
    );

    it.each([
      ["igual al base", 10, 10],
      ["superior al base", 12, 10],
      ["cero", 0, 10],
      ["negativa", -2, 10],
      [
        "NaN",
        Number.NaN,
        10,
      ],
      [
        "Infinity",
        Number.POSITIVE_INFINITY,
        10,
      ],
      ["sin base válida", 8, 0],
    ])(
      "no deriva Promo Flash con oferta %s",
      (
        _case,
        price_offer,
        price_1,
      ) => {
        const profile =
          resolveProductCompatibility(
            createProduct({
              price_1,
              price_offer,
            }),
          );

        expect(
          profile.badges,
        ).toHaveLength(0);
      },
    );

    it(
      "preserva un badge desconocido como legacy",
      () => {
        const profile =
          resolveProductCompatibility(
            createProduct({
              badges:
                ["Selección especial"],
            }),
          );

        expect(
          profile.unknownLegacyValues,
        ).toEqual([
          "Selección especial",
        ]);
      },
    );

    it(
      "integra campaña, promoción y Más vendido",
      () => {
        const campaign =
          createCampaign();

        const registry =
          new Map([
            [
              campaign.id,
              campaign,
            ],
          ]);

        const profile =
          resolveProductCompatibility(
            createProduct({
              campaigns:
                [campaign.id],

              badges:
                ["Más vendido"],

              price_offer:
                8,
            }),
            {
              campaignRegistry:
                registry,
            },
          );

        const indicators =
          getProductDisplayIndicators(
            profile,
            {
              maxVisible:
                2,
            },
          );

        expect(
          indicators.map(
            (indicator) =>
              indicator.code,
          ),
        ).toEqual([
          "campaign.dia-madre",
          "promotion.flash",
        ]);
      },
    );

    it(
      "muestra campaña y Más vendido sin oferta",
      () => {
        const campaign =
          createCampaign();

        const registry =
          new Map([
            [
              campaign.id,
              campaign,
            ],
          ]);

        const profile =
          resolveProductCompatibility(
            createProduct({
              campaigns:
                [campaign.id],

              badges:
                ["Más vendido"],
            }),
            {
              campaignRegistry:
                registry,
            },
          );

        const indicators =
          getProductDisplayIndicators(
            profile,
            {
              maxVisible:
                2,
            },
          );

        expect(
          indicators.map(
            (indicator) =>
              indicator.code,
          ),
        ).toEqual([
          "campaign.dia-madre",
          "merchandising.bestSeller",
        ]);
      },
    );
  },
);
