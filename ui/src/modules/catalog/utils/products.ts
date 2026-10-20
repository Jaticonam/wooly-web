import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  isProductPublicationDataValid,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import {
  loadAllProducts,
} from "@wooly/shared/catalog/services/fetchProducts";
import {
  readStorageEnvelope,
  serializeStorageEnvelope,
} from "@wooly/contracts/infrastructure/storage/StorageEnvelope";

const CACHE_KEY =
  "wooly_products_cache";

const CACHE_DURATION =
  10 * 1000;
const PRODUCTS_CACHE_SCHEMA_VERSION =
  1;

interface CacheEntry {
  data:
    Product[];

  timestamp:
    number;

  source:
    "sheets" |
    "fallback";
}
interface ProductsCacheData {
  products: Product[];
  source: CacheEntry["source"];
}

/* =========================================================
   SANEAMIENTO
   ========================================================= */

function sanitizePublicProducts(
  products:
    Product[],
): Product[] {
  return products.filter(
    isProductPublicationDataValid,
  );
}

/* =========================================================
   CACHE
   ========================================================= */

function setCache(
  data:
    Product[],
  source:
    CacheEntry["source"],
) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      serializeStorageEnvelope({
        schemaVersion:
          PRODUCTS_CACHE_SCHEMA_VERSION,
        savedAt:
          Date.now(),
        data: {
          products:
            sanitizePublicProducts(
              data,
            ),
          source,
        },
      }),
    );
  } catch {
    // Ignorar errores de storage.
  }
}

export function readProductsCachePayload(
  raw: string | null,
) {
  return readStorageEnvelope<ProductsCacheData>({
    raw,
    schemaVersion:
      PRODUCTS_CACHE_SCHEMA_VERSION,
    requireSavedAt: true,
    validateData: (value) => {
      if (typeof value !== "object" || value === null) return null;
      const candidate = value as Record<string, unknown>;

      return (
        Array.isArray(candidate.products) &&
        (candidate.source === "sheets" ||
          candidate.source === "fallback")
      )
        ? {
            products: candidate.products as Product[],
            source: candidate.source,
          }
        : null;
    },
    migrateLegacy: (legacy) => {
      if (typeof legacy !== "object" || legacy === null) return null;
      const candidate = legacy as Record<string, unknown>;

      return (
        Array.isArray(candidate.data) &&
        typeof candidate.timestamp === "number" &&
        (candidate.source === "sheets" ||
          candidate.source === "fallback")
      )
        ? {
            data: {
              products: candidate.data as Product[],
              source: candidate.source,
            },
            savedAt: candidate.timestamp,
          }
        : null;
    },
  });
}

function getCached():
  Product[] |
  null {
  try {
    const raw =
      sessionStorage.getItem(
        CACHE_KEY,
      );

    const result =
      readProductsCachePayload(raw);

    if (
      !result.success ||
      result.savedAt === undefined ||
      Date.now() -
        result.savedAt >
      CACHE_DURATION
    ) {
      sessionStorage.removeItem(
        CACHE_KEY,
      );

      return null;
    }

    /*
     * Una caché creada antes de estas reglas también
     * queda saneada al momento de ser leída.
     */
    const sanitized =
      sanitizePublicProducts(
        result.data.products,
      );

    if (
      sanitized.length !==
      result.data.products.length
    ) {
      setCache(
        sanitized,
        result.data.source,
      );
    }

    return sanitized;
  } catch {
    return null;
  }
}

/* =========================================================
   FALLBACK
   ========================================================= */

async function loadFallbackProducts():
  Promise<Product[]> {
  const {
    FALLBACK_PRODUCTS,
  } = await import(
    "@/modules/catalog/data/fallback-products"
  );

  return sanitizePublicProducts(
    FALLBACK_PRODUCTS,
  );
}

/* =========================================================
   CARGA
   ========================================================= */

export async function fetchProducts():
  Promise<Product[]> {
  const cached =
    getCached();

  if (cached !== null) {
    return cached;
  }

  try {
    const loadedProducts =
      await loadAllProducts();

    const publicProducts =
      sanitizePublicProducts(
        loadedProducts ?? [],
      );

    /*
     * Un resultado vacío de Google Sheets no es un error.
     *
     * Puede significar que todos los productos fueron
     * ocultados, están en borrador o fueron bloqueados
     * correctamente por la política.
     */
    setCache(
      publicProducts,
      "sheets",
    );

    if (
      publicProducts.length === 0
    ) {
      console.warn(
        "Google Sheets respondió correctamente, pero no existen productos aptos para publicación.",
      );
    }

    return publicProducts;
  } catch (error) {
    /*
     * El fallback se utiliza únicamente ante una falla
     * técnica real de carga.
     */
    console.error(
      "Error técnico cargando catálogo desde Sheets. Usando fallback validado:",
      error,
    );

    const fallbackProducts =
      await loadFallbackProducts();

    setCache(
      fallbackProducts,
      "fallback",
    );

    return fallbackProducts;
  }
}
