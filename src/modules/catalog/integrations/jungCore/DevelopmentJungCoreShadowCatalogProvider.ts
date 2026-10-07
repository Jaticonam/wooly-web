import {
  getCampaignColorClass,
} from "@/modules/catalog/domain/CampaignColorClass";

import {
  PRODUCT_SHEETS_CONFIG,
} from "@/modules/catalog/integrations/googleSheets/sheetsConfig";

import type {
  CatalogProvider,
} from "@/modules/catalog/providers/CatalogProvider";

import {
  HttpJungCoreSnapshotLoader,
} from "./HttpJungCoreSnapshotLoader";

import {
  JungCoreCatalogProvider,
} from "./JungCoreCatalogProvider";

import type {
  JungCoreSnapshotLoader,
} from "./JungCoreSnapshotLoader";

const SHADOW_PROXY_PATH =
  "/jung-core-shadow/catalog/snapshot";

const WOOLY_BRAND_ID =
  "wooly";

const bootstrapCategories =
  PRODUCT_SHEETS_CONFIG.map(
    (source) =>
      source.category,
  );

export interface DevelopmentJungCoreShadowCatalogProviderOptions {
  readonly origin?:
    string;

  readonly isDevelopment?:
    boolean;

  readonly loader?:
    JungCoreSnapshotLoader;

  readonly timeoutMs?:
    number;
}

export class DevelopmentJungCoreShadowUnavailableError
  extends Error {
  constructor(
    message:
      string,
  ) {
    super(message);

    this.name =
      "DevelopmentJungCoreShadowUnavailableError";
  }
}

function resolveOrigin(
  value:
    string | undefined,
): string {
  const explicit =
    String(
      value ?? "",
    ).trim();

  if (explicit) {
    return explicit;
  }

  if (
    typeof window !==
      "undefined"
  ) {
    return window.location
      .origin;
  }

  throw new DevelopmentJungCoreShadowUnavailableError(
    "Shadow de JUNG CORE requiere un origen HTTP de desarrollo.",
  );
}

export function buildDevelopmentJungCoreShadowSnapshotUrl(
  origin:
    string,
): string {
  const normalizedOrigin =
    String(
      origin ?? "",
    ).trim();

  if (!normalizedOrigin) {
    throw new DevelopmentJungCoreShadowUnavailableError(
      "El origen de desarrollo es obligatorio.",
    );
  }

  try {
    return new URL(
      SHADOW_PROXY_PATH,
      normalizedOrigin,
    ).toString();
  } catch {
    throw new DevelopmentJungCoreShadowUnavailableError(
      "El origen de desarrollo no es válido.",
    );
  }
}

export function createDevelopmentJungCoreShadowCatalogProvider(
  options:
    DevelopmentJungCoreShadowCatalogProviderOptions =
      {},
): CatalogProvider {
  const isDevelopment =
    options.isDevelopment ??
    import.meta.env.DEV;

  if (!isDevelopment) {
    throw new DevelopmentJungCoreShadowUnavailableError(
      "JUNG CORE Shadow solo está disponible en development.",
    );
  }

  const loader =
    options.loader ??
    (() => {
      const snapshotUrl =
        buildDevelopmentJungCoreShadowSnapshotUrl(
          resolveOrigin(
            options.origin,
          ),
        );

      const protocol =
        new URL(
          snapshotUrl,
        ).protocol;

      return new HttpJungCoreSnapshotLoader({
        url:
          snapshotUrl,

        timeoutMs:
          options.timeoutMs ??
          8_000,

        allowInsecureHttp:
          protocol ===
          "http:",
      });
    })();

  return new JungCoreCatalogProvider({
    loader,

    expectedBrandId:
      WOOLY_BRAND_ID,

    bootstrapCategories,

    resolveColorClass:
      getCampaignColorClass,

    circuitBreaker: {
      enabled:
        false,
    },
  });
}