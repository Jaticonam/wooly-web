/**
 * Respuestas reales de JUNG CORE (W12-04B.4 / B4.3), generadas con el
 * módulo CatalogPublications compilado a partir del body híbrido de
 * WOOLY. Solo para pruebas de contrato; sin secretos ni datos reales.
 *
 * - JUNG_CORE_PUBLISH_RESPONSE: 201 de
 *   POST /catalog-commercial/brands/:brandId/catalog-publications
 * - JUNG_CORE_PUBLIC_READ_RESPONSE: 200 de
 *   GET /public/catalog/publications/:publicId
 */

export const JUNG_CORE_PUBLISH_STATUS =
  201;

export const JUNG_CORE_PUBLISH_RESPONSE =
{
  "success": true,
  "message": "Catálogo publicado.",
  "data": {
    "publicId": "mP3vQx9LrT2bN8kW5yZ1aA",
    "status": "active",
    "replayed": false,
    "publication": {
      "publicId": "mP3vQx9LrT2bN8kW5yZ1aA",
      "composition": {
        "mode": "hybrid",
        "filters": {
          "sourceOperator": "union",
          "categoryIds": [
            "flores",
            "peluches"
          ],
          "campaignIds": [
            "dia-de-la-madre"
          ],
          "attributes": {
            "colors": [],
            "tags": []
          }
        },
        "overrides": {
          "includedProductIds": [
            "AKT-RG300",
            "CER001"
          ],
          "excludedProductIds": [
            "G708"
          ]
        }
      },
      "publicationIdentity": {
        "title": "Catálogo Día de la Madre",
        "description": "Selección mayorista de flores y peluches.",
        "cover": {
          "strategy": "auto",
          "customImageUrl": ""
        }
      },
      "publication": {
        "strategy": "fixed",
        "productIds": [
          "AKT-RG300",
          "CER001",
          "G09",
          "G701"
        ],
        "publishedAt": "2026-10-20T15:00:00.000Z",
        "validUntil": "2026-10-27T15:00:00.000Z",
        "version": 1
      },
      "version": 1
    },
    "revokedAt": null,
    "notices": []
  }
} as const;

export const JUNG_CORE_PUBLIC_READ_RESPONSE =
{
  "publicId": "mP3vQx9LrT2bN8kW5yZ1aA",
  "composition": {
    "mode": "hybrid",
    "filters": {
      "sourceOperator": "union",
      "categoryIds": [
        "flores",
        "peluches"
      ],
      "campaignIds": [
        "dia-de-la-madre"
      ],
      "attributes": {
        "colors": [],
        "tags": []
      }
    },
    "overrides": {
      "includedProductIds": [
        "AKT-RG300",
        "CER001"
      ],
      "excludedProductIds": [
        "G708"
      ]
    }
  },
  "publicationIdentity": {
    "title": "Catálogo Día de la Madre",
    "description": "Selección mayorista de flores y peluches.",
    "cover": {
      "strategy": "auto",
      "customImageUrl": ""
    }
  },
  "publication": {
    "strategy": "fixed",
    "productIds": [
      "AKT-RG300",
      "CER001",
      "G09",
      "G701"
    ],
    "publishedAt": "2026-10-20T15:00:00.000Z",
    "validUntil": "2026-10-27T15:00:00.000Z",
    "version": 1
  },
  "version": 1
} as const;
