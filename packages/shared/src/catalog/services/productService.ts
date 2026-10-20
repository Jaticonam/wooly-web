import type {
  Product,
} from "@wooly/contracts/types/product";

import type {
  CatalogSourceMode,
} from "../../config/application/CatalogSourceMode";

import {
  getCatalogCacheCompatibleSources,
  isCatalogCacheSourceCompatible,
  loadCatalogCategoryProductsDetailed,
  resolveCatalogCacheSource,
  type CatalogCategoryId,
} from "../providers/CatalogProvider";

import {
  catalogProvider,
} from "../providers/DefaultCatalogProvider";

import {
  readStorageEnvelope,
  serializeStorageEnvelope,
} from "@wooly/contracts/infrastructure/storage/StorageEnvelope";

import {
  loadCatalogCampaigns,
} from "./campaignService";

/* =========================================================
   TIPOS INTERNOS
   ========================================================= */

type CategoryCacheEntry = {
  savedAt:
    number;

  items:
    Product[];

  source:
    CatalogSourceMode;
};

export type CatalogCategory =
  CatalogCategoryId |
  "todas";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const CACHE_TTL =
  1000 * 60 * 5;

const CATEGORY_CACHE_SCHEMA_VERSION =
  1;

/* =========================================================
   CACHE EN MEMORIA
   ========================================================= */

const memoryCache =
  new Map<
    CatalogCategoryId,
    CategoryCacheEntry
  >();

const pendingRequests =
  new Map<
    CatalogCategoryId,
    Promise<Product[]>
  >();

/* =========================================================
   HELPERS
   ========================================================= */

const productKey = (
  category:
    string,
) =>
  `jung_catalog_v3_${category}`;

const now = () =>
  Date.now();

const isFresh = (
  savedAt:
    number,
) =>
  now() - savedAt <=
  CACHE_TTL;

const compatibleSources = () =>
  getCatalogCacheCompatibleSources(
    catalogProvider,
  );

export const getCatalogCategories =
  (): CatalogCategoryId[] => [
    ...catalogProvider
      .getCategories(),
  ];

const sortProducts = (
  items:
    Product[],
) =>
  [...items].sort(
    (a, b) =>
      (b.priority ?? 0) -
      (a.priority ?? 0),
  );

const flattenByCategory = (
  byCategory:
    Partial<
      Record<
        CatalogCategoryId,
        Product[]
      >
    >,
) =>
  sortProducts(
    Object.values(
      byCategory,
    ).flatMap(
      (items) =>
        items ?? [],
    ),
  );

function sanitizeCachedProducts(
  value:
    unknown,
): Product[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter(
    (item): item is Product => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return false;
      }

      const candidate =
        item as
          Record<string, unknown>;

      return (
        typeof candidate.id === "string" &&
        candidate.id.trim().length > 0 &&
        typeof candidate.title === "string" &&
        candidate.title.trim().length > 0 &&
        typeof candidate.category === "string" &&
        candidate.category.trim().length > 0 &&
        typeof candidate.img === "string" &&
        candidate.img.trim().length > 0 &&
        typeof candidate.price_1 === "number" &&
        Number.isFinite(
          candidate.price_1,
        )
      );
    },
  );
}

export function readCategoryCachePayload(
  raw:
    string | null,
) {
  return readStorageEnvelope({
    raw,

    schemaVersion:
      CATEGORY_CACHE_SCHEMA_VERSION,

    requireSavedAt:
      true,

    validateData:
      sanitizeCachedProducts,

    migrateLegacy:
      (legacy) => {
        if (
          typeof legacy !== "object" ||
          legacy === null
        ) {
          return null;
        }

        const candidate =
          legacy as
            Record<string, unknown>;

        const data =
          sanitizeCachedProducts(
            candidate.items,
          );

        return data === null
          ? null
          : {
              data,

              savedAt:
                candidate.savedAt as
                  number,
            };
      },
  });
}

/* =========================================================
   CACHE LOCAL DE PRODUCTOS
   ========================================================= */

function readStorageCache(
  category:
    CatalogCategoryId,
): CategoryCacheEntry | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      localStorage.getItem(
        productKey(
          category,
        ),
      );

    const result =
      readCategoryCachePayload(
        raw,
      );

    if (
      !result.success ||
      result.savedAt ===
        undefined ||
      !isFresh(
        result.savedAt,
      )
    ) {
      return null;
    }

    const source =
      resolveCatalogCacheSource(
        result.source,
        compatibleSources(),
      );

    if (!source) {
      return null;
    }

    const entry:
      CategoryCacheEntry = {
      savedAt:
        result.savedAt,

      items:
        result.data,

      source,
    };

    memoryCache.set(
      category,
      entry,
    );

    return entry;
  } catch {
    return null;
  }
}

export function readCachedCategoryProducts(
  category:
    CatalogCategoryId,
): Product[] | null {
  const memoryEntry =
    memoryCache.get(
      category,
    );

  if (
    memoryEntry &&
    isFresh(
      memoryEntry.savedAt,
    ) &&
    isCatalogCacheSourceCompatible(
      memoryEntry.source,
      compatibleSources(),
    )
  ) {
    return sortProducts(
      memoryEntry.items,
    );
  }

  if (memoryEntry) {
    memoryCache.delete(
      category,
    );
  }

  const storageEntry =
    readStorageCache(
      category,
    );

  return storageEntry
    ? sortProducts(
        storageEntry.items,
      )
    : null;
}

function writeCache(
  category:
    CatalogCategoryId,

  items:
    Product[],

  source:
    CatalogSourceMode,
): void {
  const entry:
    CategoryCacheEntry = {
    savedAt:
      now(),

    items,

    source,
  };

  memoryCache.set(
    category,
    entry,
  );

  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    localStorage.setItem(
      productKey(
        category,
      ),

      serializeStorageEnvelope({
        schemaVersion:
          CATEGORY_CACHE_SCHEMA_VERSION,

        savedAt:
          entry.savedAt,

        data:
          entry.items,

        source:
          entry.source,
      }),
    );
  } catch {
    // Si localStorage falla, se conserva la caché en memoria.
  }
}

/* =========================================================
   SNAPSHOT DEL CATÁLOGO
   ========================================================= */

export function getCachedCatalogSnapshot() {
  const categories =
    getCatalogCategories();

  const byCategory:
    Partial<
      Record<
        CatalogCategoryId,
        Product[]
      >
    > = {};

  categories.forEach(
    (category) => {
      const cached =
        readCachedCategoryProducts(
          category,
        );

      if (cached) {
        byCategory[category] =
          cached;
      }
    },
  );

  const loadedCategories =
    categories.filter(
      (category) =>
        byCategory[category],
    );

  const isFullCatalogLoaded =
    loadedCategories.length ===
    categories.length;

  return {
    byCategory,

    products:
      flattenByCategory(
        byCategory,
      ),

    loadedCategories,
    isFullCatalogLoaded,
  };
}

/* =========================================================
   CARGA DESDE EL PROVIDER
   ========================================================= */

async function fetchCategoryProducts(
  category:
    CatalogCategoryId,
): Promise<Product[]> {
  const campaigns =
    await loadCatalogCampaigns({
      includeInactive:
        true,
    });

  const result =
    await loadCatalogCategoryProductsDetailed(
      catalogProvider,
      category,
      campaigns,
    );

  const sortedProducts =
    sortProducts(
      result.data,
    );

  writeCache(
    category,
    sortedProducts,
    result.metadata
      .resolvedSource,
  );

  return sortedProducts;
}

/* =========================================================
   API DE CARGA POR CATEGORÍA
   ========================================================= */

export async function loadCategoryProducts(
  category:
    CatalogCategoryId,

  options: {
    forceRefresh?:
      boolean;
  } = {},
): Promise<Product[]> {
  if (
    !options.forceRefresh
  ) {
    const cached =
      readCachedCategoryProducts(
        category,
      );

    if (cached) {
      return cached;
    }
  }

  const pendingRequest =
    pendingRequests.get(
      category,
    );

  if (pendingRequest) {
    return pendingRequest;
  }

  const request =
    fetchCategoryProducts(
      category,
    ).finally(() => {
      pendingRequests.delete(
        category,
      );
    });

  pendingRequests.set(
    category,
    request,
  );

  return request;
}

export async function loadAllProducts():
  Promise<Product[]> {
  const categories =
    getCatalogCategories();

  const results =
    await Promise.all(
      categories.map(
        (category) =>
          loadCategoryProducts(
            category,
          ).catch(
            (error: unknown) => {
              console.error(
                `Error en categoría "${category}":`,

                error,
              );

              return [];
            },
          ),
      ),
    );

  return sortProducts(
    results.flat(),
  );
}

/* =========================================================
   CARGA PROGRESIVA
   ========================================================= */

export async function loadCatalogProgressive(
  activeCategory:
    CatalogCategory,

  onUpdate: (
    products:
      Product[],

    isFullCatalogLoaded:
      boolean,
  ) => void,
): Promise<void> {
  const categories =
    getCatalogCategories();

  const preferredCategory =
    activeCategory !== "todas"
      ? activeCategory
      : null;

  const categoryOrder =
    preferredCategory
      ? [
          preferredCategory,

          ...categories.filter(
            (category) =>
              category !==
              preferredCategory,
          ),
        ]
      : categories;

  const byCategory =
    getCachedCatalogSnapshot()
      .byCategory;

  onUpdate(
    flattenByCategory(
      byCategory,
    ),

    Object.keys(
      byCategory,
    ).length ===
      categories.length,
  );

  for (
    const category of
    categoryOrder
  ) {
    if (
      byCategory[category]
    ) {
      continue;
    }

    try {
      byCategory[category] =
        await loadCategoryProducts(
          category,
        );
    } catch (error: unknown) {
      console.error(
        `Error cargando "${category}":`,

        error,
      );

      byCategory[category] =
        [];
    }

    onUpdate(
      flattenByCategory(
        byCategory,
      ),

      Object.keys(
        byCategory,
      ).length ===
        categories.length,
    );
  }
}