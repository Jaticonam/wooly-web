import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
  CATALOG_SNAPSHOT_CONTRACT_VERSION,
  type CatalogSnapshotContract,
} from "@wooly/contracts/catalog/contracts";

import type {
  JungCoreSnapshotLoader,
} from "./JungCoreSnapshotLoader";

export const SIMULATED_JUNG_CORE_SNAPSHOT = {
  contractVersion:
    CATALOG_SNAPSHOT_CONTRACT_VERSION,

  brandId:
    "wooly",

  revision:
    "development-simulated-001",

  generatedAt:
    "2026-08-03T14:00:00.000Z",

  categories: [
    {
      id:
        "flores",

      slug:
        "flores",

      name:
        "Flores",

      icon:
        "🌸",

      priority:
        900,

      publicationStatus:
        "published",
    },
    {
      id:
        "peluches",

      slug:
        "peluches",

      name:
        "Peluches",

      icon:
        "🧸",

      priority:
        800,

      publicationStatus:
        "published",
    },
    {
      id:
        "papeles",

      slug:
        "papeles",

      name:
        "Papeles",

      icon:
        "📄",

      priority:
        700,

      publicationStatus:
        "published",
    },
    {
      id:
        "cajas",

      slug:
        "cajas",

      name:
        "Cajas",

      icon:
        "📦",

      priority:
        600,

      publicationStatus:
        "published",
    },
    {
      id:
        "cintas",

      slug:
        "cintas",

      name:
        "Cintas",

      icon:
        "🎀",

      priority:
        500,

      publicationStatus:
        "published",
    },
    {
      id:
        "globos",

      slug:
        "globos",

      name:
        "Globos",

      icon:
        "🎈",

      priority:
        400,

      publicationStatus:
        "published",
    },
    {
      id:
        "accesorios",

      slug:
        "accesorios",

      name:
        "Accesorios",

      icon:
        "✨",

      priority:
        300,

      publicationStatus:
        "published",
    },
    {
      id:
        "llaveros",

      slug:
        "llaveros",

      name:
        "Llaveros",

      icon:
        "🔑",

      priority:
        200,

      publicationStatus:
        "published",
    },
    {
      id:
        "hotwheels",

      slug:
        "hotwheels",

      name:
        "Hot Wheels",

      icon:
        "🏎️",

      priority:
        100,

      publicationStatus:
        "published",
    },
  ],

  campaigns: [
    {
      id:
        "jung-core-simulation",

      slug:
        "jung-core-simulation",

      name:
        "Simulación JUNG CORE",

      icon:
        "🧪",

      color:
        "lavanda",

      themeToken:
        "campaign.lavanda",

      startsAt:
        "2026-01-01",

      endsAt:
        "2026-12-31",

      priority:
        100,

      publicationStatus:
        "published",
    },
  ],

  products: [
    {
      contractVersion:
        CATALOG_PRODUCT_CONTRACT_VERSION,

      id:
        "simulated-product-001",

      sku:
        "SIM-WLY-001",

      slug:
        "producto-simulado-jung-core",

      brandId:
        "wooly",

      categoryId:
        "flores",

      title:
        "Producto simulado JUNG CORE",

      description:
        "Producto local para validar la integración sin conexión HTTP.",

      campaignIds: [
        "jung-core-simulation",
      ],

      manualBadgeCodes: [],

      priority:
        100,

      publicationStatus:
        "published",

      pricing: {
        currency:
          "PEN",

        volumePrices: [
          {
            id:
              "simulated-price-1",

            minimumQuantity:
              1,

            unitPrice:
              10,
          },
          {
            id:
              "simulated-price-12",

            minimumQuantity:
              12,

            unitPrice:
              8,
          },
        ],

        offer:
          null,
      },

      inventory: {
        tracked:
          true,

        availableQuantity:
          100,

        status:
          "available",

        updatedAt:
          null,
      },

      mediaAssets: [
        {
          id:
            "simulated-cover",

          kind:
            "image",

          url:
            "https://example.com/wooly-simulated-product.jpg",

          thumbnailUrl:
            null,

          altText:
            "Producto simulado JUNG CORE",

          position:
            0,

          isPrimary:
            true,
        },
      ],

      updatedAt:
        null,
    },
  ],
} as const satisfies CatalogSnapshotContract;

export class SimulatedJungCoreSnapshotLoader
  implements JungCoreSnapshotLoader {
  async loadSnapshot():
    Promise<unknown> {
    return structuredClone(
      SIMULATED_JUNG_CORE_SNAPSHOT,
    );
  }
}

export const simulatedJungCoreSnapshotLoader =
  new SimulatedJungCoreSnapshotLoader();