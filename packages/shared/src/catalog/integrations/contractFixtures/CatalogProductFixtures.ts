import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
  type CatalogProductContract,
} from "@wooly/contracts/catalog/contracts";

function productFixture(
  overrides:
    Partial<CatalogProductContract> = {},
): CatalogProductContract {
  return {
    contractVersion:
      CATALOG_PRODUCT_CONTRACT_VERSION,
    id: "canonical-available",
    sku: "FIX-AVAILABLE",
    slug: "fixture-available",
    brandId: "fixture-brand",
    categoryId: "flores",
    title: "Producto contractual disponible",
    description:
      "Fixture local sin datos productivos.",
    campaignIds: [
      "fixture-campaign",
    ],
    manualBadgeCodes: [],
    priority: 10,
    publicationStatus:
      "published",
    pricing: {
      currency: "PEN",
      volumePrices: [{
        id: "tier-1",
        minimumQuantity: 1,
        unitPrice: 10,
      }],
      offer: null,
    },
    inventory: {
      tracked: true,
      availableQuantity: 10,
      status: "available",
      updatedAt: null,
    },
    mediaAssets: [{
      id: "primary",
      kind: "image",
      url:
        "https://fixtures.example/available.jpg",
      thumbnailUrl: null,
      altText:
        "Producto contractual disponible",
      position: 1,
      isPrimary: true,
    }],
    updatedAt: null,
    ...overrides,
  };
}

const fullPricing =
  productFixture().pricing;

export const validCatalogProductFixtures:
  readonly CatalogProductContract[] = [
    productFixture(),
    productFixture({
      id: "canonical-out",
      sku: "FIX-OUT",
      slug: "fixture-out",
      title: "Producto agotado",
      inventory: {
        tracked: true,
        availableQuantity: 0,
        status: "outOfStock",
        updatedAt: null,
      },
    }),
    productFixture({
      id: "canonical-preorder",
      sku: "FIX-PREORDER",
      slug: "fixture-preorder",
      title: "Producto preventa",
      publicationStatus: "preorder",
      inventory: {
        tracked: true,
        availableQuantity: 0,
        status: "preorder",
        updatedAt: null,
      },
    }),
    productFixture({
      id: "canonical-archived",
      sku: "FIX-ARCHIVED",
      slug: "fixture-archived",
      title: "Producto archivado",
      publicationStatus: "archived",
    }),
    productFixture({
      id: "canonical-offer",
      sku: "FIX-OFFER",
      slug: "fixture-offer",
      title: "Producto con oferta",
      pricing: {
        ...fullPricing,
        offer: {
          unitPrice: 8,
          startsAt: null,
          endsAt: null,
        },
      },
    }),
    productFixture({
      id: "canonical-future-offer",
      sku: "FIX-FUTURE-OFFER",
      slug: "fixture-future-offer",
      title: "Producto con oferta futura",
      pricing: {
        ...fullPricing,
        offer: {
          unitPrice: 8,
          startsAt:
            "2030-01-01T00:00:00.000Z",
          endsAt:
            "2030-02-01T00:00:00.000Z",
        },
      },
    }),
    productFixture({
      id: "canonical-tiers",
      sku: "FIX-TIERS",
      slug: "fixture-tiers",
      title: "Producto con tiers",
      pricing: {
        ...fullPricing,
        volumePrices: [
          [1, 10],
          [3, 9],
          [12, 8],
          [50, 7],
          [100, 6],
          [6, 8.5],
        ].map(
          ([minimumQuantity, unitPrice]) => ({
            id:
              `tier-${minimumQuantity}`,
            minimumQuantity,
            unitPrice,
          }),
        ),
      },
    }),
    productFixture({
      id: "canonical-untracked",
      sku: "FIX-UNTRACKED",
      slug: "fixture-untracked",
      title: "Inventario no rastreado",
      inventory: {
        tracked: false,
        availableQuantity: null,
        status: "untracked",
        updatedAt: null,
      },
    }),
    productFixture({
      id: "canonical-decimal",
      sku: "FIX-DECIMAL",
      slug: "fixture-decimal",
      title: "Cantidad decimal",
      inventory: {
        tracked: true,
        availableQuantity: 4.7,
        status: "available",
        updatedAt:
          "2026-07-26T00:00:00.000Z",
      },
      updatedAt:
        "2026-07-26T00:00:00.000Z",
    }),
    productFixture({
      id: "canonical-media",
      sku: "FIX-MEDIA",
      slug: "fixture-media",
      title: "Producto multimedia",
      mediaAssets: [
        ...productFixture()
          .mediaAssets,
        {
          id: "gallery",
          kind: "image",
          url:
            "https://fixtures.example/gallery.jpg",
          thumbnailUrl:
            "https://fixtures.example/thumb.jpg",
          altText:
            "Vista secundaria",
          position: 2,
          isPrimary: false,
        },
      ],
    }),
  ];

export const invalidCatalogProductFixtures:
  readonly unknown[] = [
    {
      ...productFixture(),
      sku: "",
    },
    {
      ...productFixture(),
      contractVersion:
        "catalog-product.v2",
    },
  ];
