import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

import type {
  CatalogSelectionCategory,
} from "@wooly/contracts/catalog/domain/CatalogSelection";

import {
  buildCatalogPdfV2Copy,
  resolveCatalogPdfV2Selection,
} from "./CatalogPdfV2Selection";

const categories:
  CatalogSelectionCategory[] =
  [
    {
      id:
        "todas",
      name:
        "Todas",
      icon:
        "📦",
    },
    {
      id:
        "flores",
      name:
        "Flores",
      icon:
        "🌹",
    },
    {
      id:
        "peluches",
      name:
        "Peluches",
      icon:
        "🧸",
    },
    {
      id:
        "cajas",
      name:
        "Cajas",
      icon:
        "🎁",
    },
  ];

const campaigns =
  [
    {
      id:
        "dia-novia",
      name:
        "Día de la Novia",
      icon:
        "💝",
    },
    {
      id:
        "premium",
      name:
        "Premium",
      icon:
        "✨",
    },
  ] as Campaign[];

const createProduct = (
  id: string,
  category: string,
  productCampaigns:
    string[] = [],
): Product =>
  ({
    id,
    title:
      id,
    description:
      "Producto de prueba",
    category,
    campaigns:
      productCampaigns,
    price_1:
      10,
    stock:
      10,
    status:
      "publicado",
    img:
      "https://example.com/product.jpg",
  }) as Product;

const products:
  Product[] =
  [
    createProduct(
      "F-01",
      "flores",
      [
        "dia-novia",
      ],
    ),
    createProduct(
      "F-02",
      "flores",
      [
        "premium",
      ],
    ),
    createProduct(
      "P-01",
      "peluches",
      [
        "dia-novia",
      ],
    ),
    createProduct(
      "P-02",
      "peluches",
      [
        "otra",
      ],
    ),
    createProduct(
      "C-01",
      "cajas",
      [
        "premium",
      ],
    ),
    createProduct(
      "H-01",
      "flores",
      [
        "dia-novia",
      ],
    ),
  ];

describe(
  "CatalogPdfV2Selection",
  () => {
    it(
      "resuelve OR entre varias categorías",
      () => {
        const result =
          resolveCatalogPdfV2Selection({
            products,
            categories,
            campaigns,

            contract: {
              version:
                "2",

              categoryIds: [
                "flores",
                "peluches",
              ],

              campaignIds:
                [],
            },
          });

        expect(
          result.products.map(
            (product) =>
              product.id,
          ),
        ).toEqual([
          "F-01",
          "F-02",
          "P-01",
          "P-02",
          "H-01",
        ]);

        expect(
          result.showCategorySections,
        ).toBe(
          true,
        );
      },
    );

    it(
      "resuelve OR entre campañas",
      () => {
        const result =
          resolveCatalogPdfV2Selection({
            products,
            categories,
            campaigns,

            contract: {
              version:
                "2",

              categoryIds:
                [],

              campaignIds: [
                "dia-novia",
                "premium",
              ],
            },
          });

        expect(
          result.products.map(
            (product) =>
              product.id,
          ),
        ).toEqual([
          "F-01",
          "F-02",
          "P-01",
          "C-01",
          "H-01",
        ]);
      },
    );

    it(
      "aplica AND entre categorías y campañas",
      () => {
        const result =
          resolveCatalogPdfV2Selection({
            products,
            categories,
            campaigns,

            contract: {
              version:
                "2",

              categoryIds: [
                "flores",
                "peluches",
              ],

              campaignIds: [
                "dia-novia",
              ],
            },
          });

        expect(
          result.products.map(
            (product) =>
              product.id,
          ),
        ).toEqual([
          "F-01",
          "P-01",
          "H-01",
        ]);

        expect(
          result.segmentType,
        ).toBe(
          "combination",
        );
      },
    );

    it(
      "rechaza semánticamente IDs inexistentes",
      () => {
        const result =
          resolveCatalogPdfV2Selection({
            products,
            categories,
            campaigns,

            contract: {
              version:
                "2",

              categoryIds: [
                "flores",
                "inexistente",
              ],

              campaignIds:
                [],
            },
          });

        expect(
          result.products,
        ).toEqual(
          [],
        );

        expect(
          result.unknownCategoryIds,
        ).toEqual([
          "inexistente",
        ]);
      },
    );

    it(
      "usa grid plano con exactamente una categoría",
      () => {
        const result =
          resolveCatalogPdfV2Selection({
            products,
            categories,
            campaigns,

            contract: {
              version:
                "2",

              categoryIds: [
                "flores",
              ],

              campaignIds: [
                "dia-novia",
                "premium",
              ],
            },
          });

        expect(
          result.showCategorySections,
        ).toBe(
          false,
        );
      },
    );

    it(
      "construye copy para combinación múltiple",
      () => {
        const selection =
          resolveCatalogPdfV2Selection({
            products,
            categories,
            campaigns,

            contract: {
              version:
                "2",

              categoryIds: [
                "flores",
                "peluches",
              ],

              campaignIds: [
                "dia-novia",
                "premium",
              ],
            },
          });

        expect(
          buildCatalogPdfV2Copy(
            selection,
          ),
        ).toMatchObject({
          title:
            "Catálogo Mayorista · Flores + Peluches",

          segmentLabel:
            "Flores + Peluches · Día de la Novia + Premium",

          segmentType:
            "combination",
        });
      },
    );
  },
);
