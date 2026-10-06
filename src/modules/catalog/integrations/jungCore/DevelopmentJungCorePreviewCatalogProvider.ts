import {
  requestJson,
} from "@/shared/infrastructure/http";

import {
  PRODUCT_SHEETS_CONFIG,
} from "@/modules/catalog/integrations/googleSheets/sheetsConfig";

import type {
  CatalogCategoryId,
  CatalogProvider,
  CatalogProviderResult,
} from "@/modules/catalog/providers/CatalogProvider";

import type {
  Campaign,
  Product,
} from "@/shared/types/product";

/**
 * C2C.9A
 *
 * Puente EXCLUSIVO de desarrollo para visualizar en Wooly
 * productos DRAFT reales almacenados en JUNG CORE.
 *
 * NO es el contrato público final.
 * NO debe utilizarse en producción.
 *
 * Datos reales desde CORE:
 * - SKU
 * - nombre
 * - descripción
 * - categoría
 *
 * Datos temporales de presentación:
 * - pricing certificado H.2E
 * - stock agregado certificado H.2E
 * - imagen estática por categoría
 * - status="publicado" solo dentro de este preview
 *
 * Cuando Admin + Snapshot V2 estén listos para el cutover,
 * este bridge se elimina.
 */

interface CoreProductRecord {
  readonly sku?: unknown;
  readonly name?: unknown;
  readonly description?: unknown;

  readonly brand?: {
    readonly slug?: unknown;
  } | null;

  readonly category?: {
    readonly slug?: unknown;
  } | null;
}

interface CoreProductsResponse {
  readonly success:
    boolean;

  readonly data:
    readonly CoreProductRecord[];
}

interface PreviewCommercialState {
  readonly price_1:
    number;

  readonly price_3?:
    number;

  readonly price_12?:
    number;

  readonly price_50?:
    number;

  readonly price_100?:
    number;

  readonly stock:
    number;
}

const CORE_PRODUCTS_URL =
  "/jung-core/products?limit=100";

const WOOLY_BRAND_SLUG =
  "wooly";

const PREVIEW_CATEGORIES:
  readonly CatalogCategoryId[] =
    PRODUCT_SHEETS_CONFIG
      .map(
        (
          source,
        ) =>
          source.category,
      );

const TEMPORARY_PREVIEW_COMMERCIAL_BY_SKU:
  Readonly<
    Record<
      string,
      PreviewCommercialState
    >
  > = {
    "AKT-RG300": {
      price_1: 28,
      price_3: 25.5,
      price_12: 16.5,
      stock: 100,
    },

    "AKT-RG600": {
      price_1: 28,
      price_3: 25.5,
      price_12: 16.5,
      stock: 100,
    },

    "AKT-RG702": {
      price_1: 30,
      price_3: 26.5,
      price_50: 14.5,
      stock: 150,
    },

    "AKT-RS102": {
      price_1: 35,
      price_3: 30.5,
      price_100: 15,
      stock: 150,
    },

    "AKT-RS304": {
      price_1: 19,
      price_3: 16.5,
      price_100: 12.5,
      stock: 100,
    },

    CER001: {
      price_1: 28,
      price_3: 25.5,
      price_12: 16.5,
      stock: 100,
    },

    CER002: {
      price_1: 28,
      price_3: 25.5,
      price_12: 16.5,
      stock: 100,
    },

    G09: {
      price_1: 30,
      price_3: 26.5,
      price_50: 14.5,
      stock: 150,
    },

    G701: {
      price_1: 35,
      price_3: 30.5,
      price_100: 15,
      stock: 150,
    },

    G708: {
      price_1: 19,
      price_3: 16.5,
      price_100: 12.5,
      stock: 100,
    },
  };

function cleanText(
  value:
    unknown,
): string {
  return String(
    value ??
      "",
  ).trim();
}

function staticCategoryImage(
  category:
    string,
): string {
  const normalized =
    cleanText(
      category,
    )
      .toLowerCase();

  return normalized
    ? `/og/og-${normalized}.jpg`
    : "/og/og-catalogo.jpg";
}

function isRecord(
  value:
    unknown,
): value is
  Record<
    string,
    unknown
  > {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

export function mapDevelopmentCoreProduct(
  value:
    unknown,
): Product | null {
  if (
    !isRecord(
      value,
    )
  ) {
    return null;
  }

  const sku =
    cleanText(
      value.sku,
    );

  const title =
    cleanText(
      value.name,
    );

  const description =
    cleanText(
      value.description,
    );

  const brand =
    isRecord(
      value.brand,
    )
      ? value.brand
      : null;

  const categoryRecord =
    isRecord(
      value.category,
    )
      ? value.category
      : null;

  const brandSlug =
    cleanText(
      brand?.slug,
    )
      .toLowerCase();

  const category =
    cleanText(
      categoryRecord?.slug,
    )
      .toLowerCase();

  if (
    brandSlug !==
      WOOLY_BRAND_SLUG ||
    !sku ||
    !title ||
    !category
  ) {
    return null;
  }

  const commercial =
    TEMPORARY_PREVIEW_COMMERCIAL_BY_SKU[
      sku
    ];

  /*
   * C2C.9A solo certifica los primeros diez productos.
   * No inventamos pricing para productos futuros.
   */
  if (!commercial) {
    return null;
  }

  return {
    id:
      sku,

    title,

    description,

    category,

    price_1:
      commercial.price_1,

    price_3:
      commercial.price_3 ??
      null,

    price_12:
      commercial.price_12 ??
      null,

    price_50:
      commercial.price_50 ??
      null,

    price_100:
      commercial.price_100 ??
      null,

    price_offer:
      null,

    stock:
      commercial.stock,

    /*
     * Media corresponde a JUNG Media.
     * Mientras no exista ProductAsset público,
     * usamos únicamente una imagen estática
     * de categoría para la vista local.
     */
    img:
      staticCategoryImage(
        category,
      ),

    gallery:
      undefined,

    /*
     * El producto permanece DRAFT en CORE.
     * Este valor solo habilita su visualización
     * dentro del preview local de Wooly.
     */
    status:
      "publicado",

    badges:
      [],

    campaigns:
      [],

    priority:
      0,
  };
}

let pendingProducts:
  Promise<Product[]> |
  null =
    null;

async function loadPreviewProducts():
  Promise<Product[]> {
  if (
    pendingProducts
  ) {
    return pendingProducts;
  }

  const request =
    requestJson<
      CoreProductsResponse
    >(
      CORE_PRODUCTS_URL,

      {
        source:
          "JUNG CORE local product preview",

        timeoutMs:
          8_000,
      },
    )
      .then(
        (
          result,
        ) => {
          if (
            result.ok ===
              false
          ) {
            throw new Error(
              result.error
                .message,
            );
          }

          if (
            result.data
              .success !==
                true ||
            !Array.isArray(
              result.data
                .data,
            )
          ) {
            throw new Error(
              "JUNG CORE devolvió una respuesta de productos inválida.",
            );
          }

          return result.data
            .data
            .map(
              (
                product,
              ) =>
                mapDevelopmentCoreProduct(
                  product,
                ),
            )
            .filter(
              (
                product,
              ): product is
                Product =>
                  product !==
                    null,
            )
            .sort(
              (
                left,
                right,
              ) =>
                left.id
                  .localeCompare(
                    right.id,
                  ),
            );
        },
      )
      .finally(
        () => {
          pendingProducts =
            null;
        },
      );

  pendingProducts =
    request;

  return request;
}

export const developmentJungCorePreviewCatalogProvider:
  CatalogProvider = {
    source:
      "jung-core",

    getCategories():
      readonly CatalogCategoryId[] {
      return [
        ...PREVIEW_CATEGORIES,
      ];
    },

    async loadCampaigns():
      Promise<Campaign[]> {
      /*
       * Campañas quedan fuera de C2C.9A.
       * Admin/CORE las resolverán en la convergencia final.
       */
      return [];
    },

    async loadCategoryProducts(
      category:
        CatalogCategoryId,
    ): Promise<Product[]> {
      const products =
        await loadPreviewProducts();

      return products.filter(
        (
          product,
        ) =>
          product.category ===
            category,
      );
    },

    async loadCategoryProductsDetailed(
      category:
        CatalogCategoryId,
    ): Promise<
      CatalogProviderResult<Product[]>
    > {
      const products =
        await loadPreviewProducts();

      return {
        data:
          products.filter(
            (
              product,
            ) =>
              product.category ===
                category,
          ),

        source:
          "jung-core",

        issues: [
          {
            code:
              "DEVELOPMENT_PREVIEW_STATIC_PRESENTATION",

            message:
              "C2C.9A usa pricing/stock certificados temporalmente, imagen estática y publication status de preview. CORE permanece DRAFT.",
          },
        ],
      };
    },
  };
