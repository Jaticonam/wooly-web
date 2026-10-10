import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CatalogCampaignContract,
  CatalogProductContract,
} from "@/shared/contracts/catalog";
import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
} from "@/shared/contracts/catalog";

import {
  adaptCatalogProductToLegacyProduct,
  mapCatalogCampaignToLegacyCampaign,
} from "./index";

/* =========================================================
   FIXTURES
   ========================================================= */

function createProductContract(
  overrides:
    Partial<CatalogProductContract> = {},
): CatalogProductContract {
  return {
    contractVersion:
      CATALOG_PRODUCT_CONTRACT_VERSION,

    id: "core-product-1",
    sku: "WLY-001",
    slug: "producto-prueba",

    brandId: "wooly",
    categoryId: "flores",

    title: "Producto de prueba",
    description:
      "Descripción de prueba",

    campaignIds: [
      "dia-madre",
      "dia-madre",
    ],

    manualBadgeCodes: [
      "mas-vendido",
      "mas-vendido",
    ],

    priority: 80,

    publicationStatus:
      "published",

    pricing: {
      currency: "PEN",

      volumePrices: [
        {
          id: "price-1",
          minimumQuantity: 1,
          unitPrice: 10,
        },
        {
          id: "price-3",
          minimumQuantity: 3,
          unitPrice: 8,
        },
        {
          id: "price-12",
          minimumQuantity: 12,
          unitPrice: 7,
        },
      ],

      offer: {
        unitPrice: 9,
        startsAt: null,
        endsAt: null,
      },
    },

    inventory: {
      tracked: true,
      availableQuantity: 25,
      status: "available",
      updatedAt: null,
    },

    mediaAssets: [
      {
        id: "gallery",
        kind: "image",
        url: "https://example.com/gallery.jpg",
        thumbnailUrl: null,
        altText: "Galería",
        position: 2,
        isPrimary: false,
      },
      {
        id: "cover",
        kind: "image",
        url: "https://example.com/cover.jpg",
        thumbnailUrl: null,
        altText: "Portada",
        position: 1,
        isPrimary: true,
      },
      {
        id: "duplicate-cover",
        kind: "image",
        url: "https://example.com/cover.jpg",
        thumbnailUrl: null,
        altText: "Duplicada",
        position: 3,
        isPrimary: false,
      },
    ],

    updatedAt: null,

    ...overrides,
  };
}

function createCampaignContract(
  overrides:
    Partial<CatalogCampaignContract> = {},
): CatalogCampaignContract {
  return {
    id: "dia-madre",
    slug: "dia-de-la-madre",

    name: "Día de la Madre",
    icon: "💐",

    color: "lavanda",
    themeToken:
      "campaign.lavanda",

    startsAt: "2000-01-01",
    endsAt: "2999-12-31",

    priority: 90,

    publicationStatus:
      "published",

    ...overrides,
  };
}

/* =========================================================
   PRODUCTO
   ========================================================= */

describe(
  "LegacyProductAdapter",
  () => {
    it(
      "convierte el contrato canónico al Product operativo",
      () => {
        const result =
          adaptCatalogProductToLegacyProduct(
            createProductContract(),
          );

        expect(
          result.product,
        ).toEqual(
          expect.objectContaining({
            id: "core-product-1",
            sku: "WLY-001",
            category: "flores",

            price_1: 10,
            price_3: 8,
            price_12: 7,
            price_50: null,
            price_100: null,

            price_offer: 9,
            stock: 25,

            img:
              "https://example.com/cover.jpg",

            gallery:
              "https://example.com/gallery.jpg",

            status: "publicado",

            campaigns: [
              "dia-madre",
            ],

            badges: [
              "mas-vendido",
            ],
          }),
        );

        expect(
          result.unsupportedVolumePrices,
        ).toEqual([]);
      },
    );

    it(
      "reporta escalas que la interfaz legacy no representa",
      () => {
        const contract =
          createProductContract({
            pricing: {
              currency: "PEN",

              volumePrices: [
                {
                  id: "price-1",
                  minimumQuantity: 1,
                  unitPrice: 10,
                },
                {
                  id: "price-6",
                  minimumQuantity: 6,
                  unitPrice: 8.5,
                },
              ],

              offer: null,
            },
          });

        const result =
          adaptCatalogProductToLegacyProduct(
            contract,
          );

        expect(
          result.product.price_1,
        ).toBe(10);

        expect(
          result.unsupportedVolumePrices,
        ).toEqual([
          expect.objectContaining({
            minimumQuantity: 6,
            unitPrice: 8.5,
          }),
        ]);
      },
    );

    it(
      "descarta una oferta inválida y respeta inventario no controlado",
      () => {
        const contract =
          createProductContract({
            publicationStatus:
              "archived",

            pricing: {
              currency: "PEN",

              volumePrices: [
                {
                  id: "price-1",
                  minimumQuantity: 1,
                  unitPrice: 10,
                },
              ],

              offer: {
                unitPrice: 12,
                startsAt: null,
                endsAt: null,
              },
            },

            inventory: {
              tracked: false,
              availableQuantity: 99,
              status: "untracked",
              updatedAt: null,
            },
          });

        const result =
          adaptCatalogProductToLegacyProduct(
            contract,
          );

        expect(
          result.product.price_offer,
        ).toBeNull();

        expect(
          result.product.stock,
        ).toBeNull();

        expect(
          result.product.status,
        ).toBe("oculto");
      },
    );
  },
);

/* =========================================================
   CAMPAÑA
   ========================================================= */

describe(
  "LegacyCampaignAdapter",
  () => {
    it(
      "convierte una campaña publicada y calcula su estado",
      () => {
        const campaign =
          mapCatalogCampaignToLegacyCampaign(
            createCampaignContract(),
            {
              resolveColorClass:
                (color) =>
                  `class-${color}`,
            },
          );

        expect(
          campaign,
        ).toEqual(
          expect.objectContaining({
            id: "dia-madre",
            name: "Día de la Madre",

            color: "lavanda",
            themeToken:
              "campaign.lavanda",

            colorClass:
              "class-lavanda",

            publicationStatus:
              "publicado",

            computedStatus:
              "activa",
          }),
        );
      },
    );

    it(
      "mantiene oculta una campaña no publicable",
      () => {
        const campaign =
          mapCatalogCampaignToLegacyCampaign(
            createCampaignContract({
              publicationStatus:
                "hidden",
            }),
            {
              resolveColorClass:
                () =>
                  "campaign-hidden",
            },
          );

        expect(
          campaign.publicationStatus,
        ).toBe("oculto");

        expect(
          campaign.computedStatus,
        ).toBe("oculta");
      },
    );

    it(
      "genera themeToken cuando la API no lo proporciona",
      () => {
        const campaign =
          mapCatalogCampaignToLegacyCampaign(
            createCampaignContract({
              color: "amarillo",
              themeToken: null,
            }),
            {
              resolveColorClass:
                () =>
                  "campaign-yellow",
            },
          );

        expect(
          campaign.themeToken,
        ).toContain(
          "amarillo",
        );
      },
    );
  },
);
