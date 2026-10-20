import {
  CatalogProviderHealthCollector,
} from "../../monitoring/collectors/CatalogProviderHealthCollector";

import type {
  ApplicationConfig,
  ApplicationRuntimeMode,
  CatalogSourceMode,
} from "../../config/application";

import type {
  CatalogProvider,
} from "./CatalogProvider";

import {
  createCatalogProvider,
} from "./CatalogProviderFactory";

export type CatalogRuntimeTransport =
  | "google-sheets"
  | "contract-fixture"
  | "jung-core-simulation"
  | "jung-core-http";

export interface CatalogRuntimeCircuitBreakerOptions {
  readonly enabled?:
    boolean;

  readonly failureThreshold?:
    number;

  readonly cooldownMs?:
    number;
}

export interface CatalogRuntimeHttpJungCoreOptions {
  readonly snapshotUrl:
    string;

  readonly timeoutMs?:
    number;

  readonly allowInsecureHttp?:
    boolean;

  readonly fallbackEnabled?:
    boolean;

  readonly circuitBreaker?:
    CatalogRuntimeCircuitBreakerOptions;
}

export interface CatalogRuntimeCompositionOptions {
  readonly jungCoreHttp?:
    CatalogRuntimeHttpJungCoreOptions;

  readonly now?:
    () => number;
}

export interface HttpJungCoreProviderFactoryOptions {
  readonly brandId:
    string;

  readonly snapshotUrl:
    string;

  readonly timeoutMs?:
    number;

  readonly allowInsecureHttp:
    boolean;

  readonly circuitBreaker: {
    readonly enabled:
      boolean;

    readonly failureThreshold?:
      number;

    readonly cooldownMs?:
      number;
  };

  readonly now?:
    () => number;
}

export type HttpJungCoreProviderFactory =
  (
    options:
      HttpJungCoreProviderFactoryOptions,
  ) => CatalogProvider;

export interface CatalogRuntimeCompositionDependencies {
  readonly googleSheets?:
    CatalogProvider;

  readonly contractFixture?:
    CatalogProvider;

  readonly developmentJungCore?:
    CatalogProvider;

  readonly createHttpJungCoreProvider?:
    HttpJungCoreProviderFactory;
}

export interface CatalogRuntimeComposition {
  readonly requestedSource:
    CatalogSourceMode;

  readonly effectiveSource:
    CatalogSourceMode;

  readonly transport:
    CatalogRuntimeTransport;

  readonly fallbackEnabled:
    boolean;

  readonly provider:
    CatalogProvider;

  readonly healthCollector:
    CatalogProviderHealthCollector;
}

class CatalogRuntimeDependencyUnavailableError
  extends Error {
  readonly code =
    "CONFIGURATION_ERROR" as const;

  constructor(
    dependency:
      string,
  ) {
    super(
      `La dependencia runtime ${dependency} no esta disponible.`,
    );

    this.name =
      "CatalogRuntimeDependencyUnavailableError";
  }
}

function createUnavailableProvider(
  source:
    CatalogProvider["source"],

  dependency:
    string,
): CatalogProvider {
  const createError =
    () =>
      new CatalogRuntimeDependencyUnavailableError(
        dependency,
      );

  return {
    source,

    getCategories:
      () => [],

    loadCampaigns:
      async () => {
        throw createError();
      },

    loadCategoryProducts:
      async () => {
        throw createError();
      },
  };
}

export function resolveCatalogRuntimeSource(
  requestedSource:
    CatalogSourceMode,

  mode:
    ApplicationRuntimeMode,
): CatalogSourceMode {
  if (
    mode ===
      "production" &&
    requestedSource !==
      "google-sheets"
  ) {
    return "google-sheets";
  }

  return requestedSource;
}

function resolveTransport(
  effectiveSource:
    CatalogSourceMode,

  httpEnabled:
    boolean,
): CatalogRuntimeTransport {
  if (
    effectiveSource ===
      "google-sheets"
  ) {
    return "google-sheets";
  }

  if (
    effectiveSource ===
      "contract-fixture"
  ) {
    return "contract-fixture";
  }

  return httpEnabled
    ? "jung-core-http"
    : "jung-core-simulation";
}

export function createCatalogRuntimeComposition(
  config:
    ApplicationConfig,

  mode:
    ApplicationRuntimeMode,

  options:
    CatalogRuntimeCompositionOptions = {},

  dependencies:
    CatalogRuntimeCompositionDependencies = {},
): CatalogRuntimeComposition {
  const requestedSource =
    config.catalog.source;

  const effectiveSource =
    resolveCatalogRuntimeSource(
      requestedSource,
      mode,
    );

  const googleSheets =
    dependencies.googleSheets ??
    createUnavailableProvider(
      "google-sheets",
      "googleSheets",
    );

  const contractFixture =
    dependencies.contractFixture ??
    createUnavailableProvider(
      "contract-fixture",
      "contractFixture",
    );

  const developmentJungCore =
    dependencies.developmentJungCore ??
    createUnavailableProvider(
      "jung-core",
      "developmentJungCore",
    );

  const httpOptions =
    effectiveSource ===
      "jung-core"
      ? options.jungCoreHttp
      : undefined;

  let jungCore =
    developmentJungCore;

  if (httpOptions) {
    const createHttpProvider =
      dependencies
        .createHttpJungCoreProvider;

    if (!createHttpProvider) {
      throw new CatalogRuntimeDependencyUnavailableError(
        "createHttpJungCoreProvider",
      );
    }

    jungCore =
      createHttpProvider({
        brandId:
          config.app.brandId,

        snapshotUrl:
          httpOptions.snapshotUrl,

        allowInsecureHttp:
          mode !==
            "production" &&
          httpOptions
            .allowInsecureHttp ===
            true,

        circuitBreaker: {
          enabled:
            httpOptions
              .circuitBreaker
              ?.enabled !==
            false,

          ...(
            httpOptions
              .circuitBreaker
              ?.failureThreshold !==
                undefined
              ? {
                  failureThreshold:
                    httpOptions
                      .circuitBreaker
                      .failureThreshold,
                }
              : {}
          ),

          ...(
            httpOptions
              .circuitBreaker
              ?.cooldownMs !==
                undefined
              ? {
                  cooldownMs:
                    httpOptions
                      .circuitBreaker
                      .cooldownMs,
                }
              : {}
          ),
        },

        ...(
          httpOptions.timeoutMs !==
            undefined
            ? {
                timeoutMs:
                  httpOptions.timeoutMs,
              }
            : {}
        ),

        ...(
          options.now
            ? {
                now:
                  options.now,
              }
            : {}
        ),
      });
  }

  const fallbackEnabled =
    effectiveSource ===
      "jung-core" &&
    httpOptions
      ?.fallbackEnabled ===
      true;

  const provider =
    createCatalogProvider(
      effectiveSource,

      {
        googleSheets,
        contractFixture,
        jungCore,
      },

      {
        fallback: {
          enabled:
            fallbackEnabled,

          source:
            "google-sheets",
        },
      },
    );

  const healthCollector =
    new CatalogProviderHealthCollector(
      provider,
      requestedSource,
      options.now ??
        Date.now,
    );

  return {
    requestedSource,
    effectiveSource,

    transport:
      resolveTransport(
        effectiveSource,
        Boolean(httpOptions),
      ),

    fallbackEnabled,
    provider,
    healthCollector,
  };
}
