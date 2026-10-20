import type {
  ApplicationConfig,
  ApplicationPublicOverrides,
  ApplicationRuntimeMode,
} from "./ApplicationConfig";
import {
  type ApplicationConfigIssue,
  validateApplicationConfig,
} from "./ApplicationConfigValidation";
import { woolyApplicationConfig } from "./woolyApplicationConfig";

export interface ResolvedApplicationConfig {
  readonly config: ApplicationConfig;
  readonly issues: readonly ApplicationConfigIssue[];
}

function resolveCatalogPublicationApiBaseUrl(
  value: unknown,
  mode: ApplicationRuntimeMode,
): {
  readonly apiBaseUrl: string | null;
  readonly invalid: boolean;
} {
  if (value === undefined) {
    return {
      apiBaseUrl:
        woolyApplicationConfig
          .catalogPublication
          .apiBaseUrl,
      invalid: false,
    };
  }

  if (value === null) {
    return {
      apiBaseUrl: null,
      invalid: false,
    };
  }

  if (typeof value !== "string") {
    return {
      apiBaseUrl: null,
      invalid: true,
    };
  }

  const normalized =
    value
      .trim()
      .replace(/\/+$/, "");

  if (!normalized) {
    return {
      apiBaseUrl: null,
      invalid: false,
    };
  }

  try {
    const url =
      new URL(normalized);

    const protocolAllowed =
      url.protocol === "https:" ||
      (
        mode !== "production" &&
        url.protocol === "http:"
      );

    if (
      !protocolAllowed ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return {
        apiBaseUrl: null,
        invalid: true,
      };
    }

    return {
      apiBaseUrl: normalized,
      invalid: false,
    };
  } catch {
    return {
      apiBaseUrl: null,
      invalid: true,
    };
  }
}

export function resolveApplicationConfig(
  overrides: ApplicationPublicOverrides = {},
  mode: ApplicationRuntimeMode = "production",
): ResolvedApplicationConfig {
  const issues: ApplicationConfigIssue[] = [];
  const requestedSource = overrides.catalogSource;
  const source =
    requestedSource === "google-sheets" ||
    ((requestedSource === "contract-fixture" ||
      requestedSource === "jung-core") &&
      mode !== "production")
      ? requestedSource
      : woolyApplicationConfig.catalog.source;
  if (
    requestedSource !== undefined &&
    source !== requestedSource
  ) issues.push({ code: "UNKNOWN_CATALOG_SOURCE", field: "catalog.source" });

  const originCandidate =
    typeof overrides.publicSiteOrigin === "string"
      ? overrides.publicSiteOrigin.replace(/\/+$/, "")
      : woolyApplicationConfig.publicSite.origin;

  const publicationApi =
    resolveCatalogPublicationApiBaseUrl(
      overrides.catalogPublicationApiBaseUrl,
      mode,
    );

  if (publicationApi.invalid) {
    issues.push({
      code:
        "INVALID_PUBLICATION_API_URL",
      field:
        "catalogPublication.apiBaseUrl",
    });
  }

  const candidate = {
    ...woolyApplicationConfig,
    publicSite: {
      ...woolyApplicationConfig.publicSite,
      origin: originCandidate,
    },
    catalog: { source },
    catalogPublication: {
      apiBaseUrl:
        publicationApi.apiBaseUrl,
    },
  };
  const validation = validateApplicationConfig(candidate, mode);
  if (validation.ok) return { config: validation.config, issues };
  if (overrides.publicSiteOrigin !== undefined)
    issues.push({ code: "INVALID_ORIGIN", field: "publicSite.origin" });
  const fallback = validateApplicationConfig(woolyApplicationConfig, mode);
  if (!fallback.ok) throw new Error("La configuración Wooly incluida es inválida.");
  return { config: fallback.config, issues };
}

let cachedConfig: ApplicationConfig | undefined;

export function getApplicationConfig(): ApplicationConfig {
  if (!cachedConfig) {
    const viteEnv =
      (import.meta as ImportMeta & {
        readonly env?: ImportMetaEnv;
      }).env;

    cachedConfig = resolveApplicationConfig(
      {
        catalogSource:
          viteEnv?.VITE_CATALOG_SOURCE,
        publicSiteOrigin:
          viteEnv?.VITE_PUBLIC_SITE_ORIGIN,
        catalogPublicationApiBaseUrl:
          viteEnv?.VITE_CATALOG_PUBLICATION_API_BASE_URL,
      },
      viteEnv?.PROD === false
        ? "development"
        : "production",
    ).config;
  }
  return cachedConfig;
}
