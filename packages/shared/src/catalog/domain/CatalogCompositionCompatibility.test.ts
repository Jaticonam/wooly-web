import {
  describe,
  expect,
  it,
} from "vitest";

import {
  resolveCatalogSelection,
} from "@wooly/contracts/catalog/domain/CatalogSelection";

import {
  createEmptyCatalogComposition,
  type CatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import {
  resolveCatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogCompositionResolver";

import {
  CATEGORY_CONFIG,
} from "../config/categories";

import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

const campaigns: Campaign[] = [
  {
    id:
      "dia-madre",

    name:
      "Día de la Madre",

    icon:
      "🌷",

    themeToken:
      "campaign.rosado",

    colorClass:
      "catalog-campaign-pink",

    startDate:
      "2026-05-01",

    endDate:
      "2026-05-31",

    priority:
      100,

    publicationStatus:
      "publicado",

    computedStatus:
      "activa",
  },

  {
    id:
      "cyber",

    name:
      "Cyber",

    icon:
      "⚡",

    themeToken:
      "campaign.morado",

    colorClass:
      "catalog-campaign-purple",

    startDate:
      "2026-07-01",

    endDate:
      "2026-07-31",

    priority:
      80,

    publicationStatus:
      "publicado",

    computedStatus:
      "activa",
  },
];

const product = ({
  id,
  category,
  campaigns: productCampaigns = [],
  priority = 0,
  status = "publicado",
}: {
  id: string;
  category: string;
  campaigns?: string[];
  priority?: number;
  status?: string;
}): Product => ({
  id,
  title:
    id,

  description:
    `Producto ${id}`,

  category,

  price_1:
    10,

  stock:
    10,

  img:
    `/products/${id}.jpg`,

  status,

  campaigns:
    productCampaigns,

  priority,
});

const products: Product[] = [
  product({
    id:
      "FLOR-001",

    category:
      "flores",

    campaigns: [
      "dia-madre",
    ],

    priority:
      100,
  }),

  product({
    id:
      "FLOR-002",

    category:
      "flores",

    campaigns: [
      "cyber",
    ],

    priority:
      70,
  }),

  product({
    id:
      "PELU-001",

    category:
      "peluches",

    campaigns: [
      "dia-madre",
    ],

    priority:
      90,
  }),

  product({
    id:
      "CAJA-001",

    category:
      "cajas",

    campaigns: [
      "cyber",
    ],

    priority:
      80,
  }),

  product({
    id:
      "OCULTO-001",

    category:
      "flores",

    campaigns: [
      "dia-madre",
    ],

    priority:
      1000,

    status:
      "oculto",
  }),
];

const sortedIds = (
  items: readonly Product[],
) =>
  items
    .map(
      (item) =>
        item.id,
    )
    .sort();

const resolveV3 = ({
  categoryIds = [],
  campaignIds = [],
}: {
  categoryIds?: string[];
  campaignIds?: string[];
}) => {
  const base =
    createEmptyCatalogComposition(
      "automatic",
    );

  const composition:
    CatalogComposition = {
      ...base,

      filters: {
        ...base.filters,

        categoryIds,

        campaignIds,
      },
    };

  return resolveCatalogComposition({
    products,
    composition,
  });
};

describe(
  "CatalogComposition compatibility with CatalogSelection V2",
  () => {
    it(
      "mantiene la misma población comercial para catálogo general",
      () => {
        const v2 =
          resolveCatalogSelection({
            products,

            categories:
              CATEGORY_CONFIG,

            campaigns,
          });

        const v3 =
          resolveV3({});

        expect(
          sortedIds(
            v3.products,
          ),
        ).toEqual(
          sortedIds(
            v2.products,
          ),
        );
      },
    );

    it(
      "mantiene la misma población comercial para una categoría",
      () => {
        const v2 =
          resolveCatalogSelection({
            products,

            categories:
              CATEGORY_CONFIG,

            campaigns,

            categoryId:
              "flores",
          });

        const v3 =
          resolveV3({
            categoryIds: [
              "flores",
            ],
          });

        expect(
          sortedIds(
            v3.products,
          ),
        ).toEqual(
          sortedIds(
            v2.products,
          ),
        );
      },
    );

    it(
      "mantiene la misma población comercial para una campaña",
      () => {
        const v2 =
          resolveCatalogSelection({
            products,

            categories:
              CATEGORY_CONFIG,

            campaigns,

            campaignId:
              "dia-madre",
          });

        const v3 =
          resolveV3({
            campaignIds: [
              "dia-madre",
            ],
          });

        expect(
          sortedIds(
            v3.products,
          ),
        ).toEqual(
          sortedIds(
            v2.products,
          ),
        );
      },
    );

    it(
      "mantiene la misma población comercial para categoría más campaña",
      () => {
        const v2 =
          resolveCatalogSelection({
            products,

            categories:
              CATEGORY_CONFIG,

            campaigns,

            categoryId:
              "flores",

            campaignId:
              "dia-madre",
          });

        const v3 =
          resolveV3({
            categoryIds: [
              "flores",
            ],

            campaignIds: [
              "dia-madre",
            ],
          });

        expect(
          sortedIds(
            v3.products,
          ),
        ).toEqual(
          sortedIds(
            v2.products,
          ),
        );
      },
    );
  },
);