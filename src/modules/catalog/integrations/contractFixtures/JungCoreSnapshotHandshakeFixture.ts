import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
  CATALOG_SNAPSHOT_CONTRACT_VERSION,
  type CatalogSnapshotContract,
} from "@/shared/contracts/catalog";

/**
 * Consumer-side mirror of the canonical JUNG CORE contract fixture.
 *
 * Keep this fixture provider-neutral: no Wooly routes, CSS classes,
 * Google Sheets fields or transport credentials belong here.
 */
export function createJungCoreSnapshotHandshakeFixture():
  CatalogSnapshotContract {
  return {
    contractVersion:
      CATALOG_SNAPSHOT_CONTRACT_VERSION,

    brandId:
      "wooly",

    revision:
      "fixture-revision-001",

    generatedAt:
      "2026-10-04T00:00:00.000Z",

    categories: [{
      id:
        "flores",

      slug:
        "flores",

      name:
        "Flores",

      icon:
        "flower",

      priority:
        100,

      publicationStatus:
        "published",
    }],

    campaigns: [{
      id:
        "cyber-wooly",

      slug:
        "cyber-wooly",

      name:
        "Cyber Wooly",

      icon:
        "zap",

      color:
        "#F9C95B",

      themeToken:
        "campaign.cyber",

      startsAt:
        null,

      endsAt:
        null,

      priority:
        100,

      publicationStatus:
        "published",
    }],

    products: [{
      contractVersion:
        CATALOG_PRODUCT_CONTRACT_VERSION,

      id:
        "product-001",

      sku:
        "WLY001",

      slug:
        "producto-contractual",

      brandId:
        "wooly",

      categoryId:
        "flores",

      title:
        "Producto contractual",

      description:
        "Fixture canónico de JUNG CORE.",

      campaignIds: [
        "cyber-wooly",
      ],

      manualBadgeCodes:
        [],

      priority:
        80,

      publicationStatus:
        "published",

      pricing: {
        currency:
          "PEN",

        volumePrices: [{
          id:
            "tier-1",

          minimumQuantity:
            1,

          unitPrice:
            10,
        }],

        offer:
          null,
      },

      inventory: {
        tracked:
          true,

        availableQuantity:
          25,

        status:
          "available",

        updatedAt:
          null,
      },

      mediaAssets: [{
        id:
          "asset-001",

        kind:
          "image",

        url:
          "https://media.jungnegocios.com/wooly/products/WLY001_01.jpg",

        thumbnailUrl:
          null,

        altText:
          "Producto contractual",

        position:
          1,

        isPrimary:
          true,
      }],

      updatedAt:
        null,
    }],
  };
}
