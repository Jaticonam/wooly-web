import type {
  Campaign,
} from "@wooly/contracts/types/product";

import type {
  CatalogSourceMode,
} from "../../config/application/CatalogSourceMode";

import {
  buildCampaignNameToIdMap,
  filterActiveCampaigns,
  getCampaignComputedStatus,
} from "@wooly/contracts/catalog/domain/CampaignRules";

import {
  readStorageEnvelope,
  serializeStorageEnvelope,
} from "@wooly/contracts/infrastructure/storage/StorageEnvelope";

import {
  catalogProvider,
} from "../providers/DefaultCatalogProvider";

import {
  getCatalogCacheCompatibleSources,
  isCatalogCacheSourceCompatible,
  loadCatalogCampaignsDetailed,
  resolveCatalogCacheSource,
} from "../providers/CatalogProvider";

/* =========================================================
   TIPOS
   ========================================================= */

type CampaignCacheEntry = {
  savedAt:
    number;

  items:
    Campaign[];

  source:
    CatalogSourceMode;
};

type CampaignProviderLoad = {
  items:
    Campaign[];

  source:
    CatalogSourceMode;
};

export interface LoadCatalogCampaignsOptions {
  includeInactive?:
    boolean;

  forceRefresh?:
    boolean;
}

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const CACHE_TTL =
  1000 * 60 * 5;

const CAMPAIGN_CACHE_SCHEMA_VERSION =
  1;

const CAMPAIGNS_CACHE_KEY =
  "jung_catalog_campaigns_v3";

/* =========================================================
   CACHE EN MEMORIA
   ========================================================= */

let campaignsMemoryCache:
  CampaignCacheEntry | null =
    null;

let pendingCampaignsRequest:
  Promise<Campaign[]> | null =
    null;

const now = () =>
  Date.now();

const isFresh = (
  savedAt:
    number,
): boolean =>
  now() - savedAt <=
  CACHE_TTL;

const compatibleSources = () =>
  getCatalogCacheCompatibleSources(
    catalogProvider,
  );

const sortCampaigns = (
  campaigns:
    Campaign[],
): Campaign[] =>
  [...campaigns].sort(
    (a, b) =>
      b.priority -
      a.priority,
  );

function sanitizeCachedCampaigns(
  value:
    unknown,
): Campaign[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.flatMap(
    (item): Campaign[] => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return [];
      }

      const candidate =
        item as
          Record<string, unknown>;

      if (
        typeof candidate.id !== "string" ||
        !candidate.id.trim() ||
        typeof candidate.name !== "string" ||
        !candidate.name.trim() ||
        typeof candidate.startDate !== "string" ||
        typeof candidate.endDate !== "string" ||
        typeof candidate.publicationStatus !== "string" ||
        typeof candidate.priority !== "number" ||
        !Number.isFinite(
          candidate.priority,
        )
      ) {
        return [];
      }

      const campaign =
        candidate as
          unknown as Campaign;

      return [{
        ...campaign,

        computedStatus:
          getCampaignComputedStatus(
            campaign,
          ),
      }];
    },
  );
}

export function readCampaignCachePayload(
  raw:
    string | null,
) {
  return readStorageEnvelope({
    raw,

    schemaVersion:
      CAMPAIGN_CACHE_SCHEMA_VERSION,

    requireSavedAt:
      true,

    validateData:
      sanitizeCachedCampaigns,

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
          sanitizeCachedCampaigns(
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
   CACHE LOCAL
   ========================================================= */

function readStoredCampaigns():
  CampaignCacheEntry | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      localStorage.getItem(
        CAMPAIGNS_CACHE_KEY,
      );

    const result =
      readCampaignCachePayload(
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
      CampaignCacheEntry = {
      savedAt:
        result.savedAt,

      items:
        result.data,

      source,
    };

    campaignsMemoryCache =
      entry;

    return entry;
  } catch {
    return null;
  }
}

function writeCampaignsCache(
  campaigns:
    Campaign[],

  source:
    CatalogSourceMode,
): void {
  const entry:
    CampaignCacheEntry = {
    savedAt:
      now(),

    items:
      campaigns,

    source,
  };

  campaignsMemoryCache =
    entry;

  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    localStorage.setItem(
      CAMPAIGNS_CACHE_KEY,

      serializeStorageEnvelope({
        schemaVersion:
          CAMPAIGN_CACHE_SCHEMA_VERSION,

        savedAt:
          entry.savedAt,

        data:
          entry.items,

        source:
          entry.source,
      }),
    );
  } catch {
    // La caché en memoria continúa disponible.
  }
}

/* =========================================================
   FUENTE OFICIAL
   ========================================================= */

async function fetchCampaignsFromProvider():
  Promise<CampaignProviderLoad> {
  const result =
    await loadCatalogCampaignsDetailed(
      catalogProvider,
    );

  return {
    items:
      sortCampaigns(
        result.data,
      ),

    source:
      result.metadata
        .resolvedSource,
  };
}

/* =========================================================
   CARGA INTERNA
   ========================================================= */

async function loadAllCatalogCampaigns(
  options: Pick<
    LoadCatalogCampaignsOptions,
    "forceRefresh"
  > = {},
): Promise<Campaign[]> {
  if (
    !options.forceRefresh
  ) {
    if (
      campaignsMemoryCache &&
      isFresh(
        campaignsMemoryCache
          .savedAt,
      ) &&
      isCatalogCacheSourceCompatible(
        campaignsMemoryCache
          .source,

        compatibleSources(),
      )
    ) {
      return campaignsMemoryCache
        .items;
    }

    campaignsMemoryCache =
      null;

    const storedCampaigns =
      readStoredCampaigns();

    if (storedCampaigns) {
      return storedCampaigns
        .items;
    }
  }

  if (
    pendingCampaignsRequest
  ) {
    return pendingCampaignsRequest;
  }

  pendingCampaignsRequest =
    fetchCampaignsFromProvider()
      .then((result) => {
        writeCampaignsCache(
          result.items,
          result.source,
        );

        return result.items;
      })
      .catch(
        (error: unknown) => {
          console.error(
            "No se pudieron cargar las campañas del provider de catálogo:",

            error,
          );

          /**
           * No se inventan campañas.
           * Tampoco se persiste un vacío originado por un error.
           */
          return [];
        },
      )
      .finally(() => {
        pendingCampaignsRequest =
          null;
      });

  return pendingCampaignsRequest;
}

/* =========================================================
   API PÚBLICA
   ========================================================= */

export async function loadCatalogCampaigns(
  options:
    LoadCatalogCampaignsOptions = {},
): Promise<Campaign[]> {
  const campaigns =
    await loadAllCatalogCampaigns({
      forceRefresh:
        options.forceRefresh,
    });

  if (
    options.includeInactive
  ) {
    return campaigns;
  }

  return filterActiveCampaigns(
    campaigns,
  );
}
export async function refreshCatalogCampaigns(
  options: Pick<
    LoadCatalogCampaignsOptions,
    "includeInactive"
  > = {},
): Promise<Campaign[]> {
  const result =
    await fetchCampaignsFromProvider();

  writeCampaignsCache(
    result.items,
    result.source,
  );

  if (
    options.includeInactive
  ) {
    return result.items;
  }

  return filterActiveCampaigns(
    result.items,
  );
}

export async function getCampaignNameToIdMap() {
  const campaigns =
    await loadCatalogCampaigns({
      includeInactive:
        true,
    });

  return buildCampaignNameToIdMap(
    campaigns,
  );
}
