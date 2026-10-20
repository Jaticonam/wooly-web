import type {
  ApplicationConfig,
  ApplicationRuntimeMode,
} from "./ApplicationConfig";

export type ApplicationConfigIssueCode =
  | "MISSING_REQUIRED_FIELD"
  | "EMPTY_IDENTIFIER"
  | "INVALID_ORIGIN"
  | "INVALID_DOMAIN"
  | "INVALID_LOCALE"
  | "INVALID_CURRENCY"
  | "INVALID_PHONE"
  | "INVALID_ROUTE"
  | "INVALID_ASSET_URL"
  | "INVALID_NUMBER"
  | "INVALID_PUBLICATION_API_URL"
  | "UNKNOWN_CATALOG_SOURCE";

export interface ApplicationConfigIssue {
  readonly code: ApplicationConfigIssueCode;
  readonly field: string;
}

export type ApplicationConfigValidationResult =
  | {
      readonly ok: true;
      readonly config: ApplicationConfig;
      readonly warnings: readonly ApplicationConfigIssue[];
    }
  | {
      readonly ok: false;
      readonly errors: readonly ApplicationConfigIssue[];
      readonly warnings: readonly ApplicationConfigIssue[];
    };

function deepFreeze<T extends object>(value: T): T {
  Object.freeze(value);
  Object.values(value).forEach((item) => {
    if (item && typeof item === "object" && !Object.isFrozen(item)) {
      deepFreeze(item);
    }
  });
  return value;
}

function isAsset(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isCatalogPublicationApiBaseUrl(
  value: unknown,
  mode: ApplicationRuntimeMode,
): boolean {
  if (value === null) return true;

  if (
    typeof value !== "string" ||
    !value.trim() ||
    value !== value.trim()
  ) {
    return false;
  }

  try {
    const url = new URL(value);

    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return false;
    }

    return (
      url.protocol === "https:" ||
      (
        mode !== "production" &&
        url.protocol === "http:"
      )
    );
  } catch {
    return false;
  }
}

export function validateApplicationConfig(
  value: unknown,
  mode: ApplicationRuntimeMode = "production",
): ApplicationConfigValidationResult {
  const errors: ApplicationConfigIssue[] = [];
  const issue = (code: ApplicationConfigIssueCode, field: string) =>
    errors.push({ code, field });
  if (!value || typeof value !== "object") {
    issue("MISSING_REQUIRED_FIELD", "config");
    return { ok: false, errors, warnings: [] };
  }
  const config = value as ApplicationConfig;
  const required = [
    ["app.id", config.app?.id],
    ["app.brandId", config.app?.brandId],
    ["app.name", config.app?.name],
  ] as const;
  required.forEach(([field, current]) => {
    if (typeof current !== "string") issue("MISSING_REQUIRED_FIELD", field);
    else if (!current.trim()) issue("EMPTY_IDENTIFIER", field);
  });
  try {
    const origin = new URL(config.publicSite?.origin);
    if (
      origin.origin !== config.publicSite.origin ||
      (origin.protocol !== "https:" &&
        !(mode !== "production" && origin.protocol === "http:"))
    ) issue("INVALID_ORIGIN", "publicSite.origin");
  } catch {
    issue("INVALID_ORIGIN", "publicSite.origin");
  }
  const domain = config.publicSite?.domain;
  if (
    typeof domain !== "string" ||
    domain.includes("/") ||
    domain.includes(":") ||
    !domain.includes(".")
  ) issue("INVALID_DOMAIN", "publicSite.domain");
  if (!/^[a-z]{2}-[A-Z]{2}$/.test(config.locale?.locale ?? ""))
    issue("INVALID_LOCALE", "locale.locale");
  if (!/^[A-Z]{3}$/.test(config.locale?.currency ?? ""))
    issue("INVALID_CURRENCY", "locale.currency");
  if (!/^\d+$/.test(config.contact?.whatsappNumber ?? ""))
    issue("INVALID_PHONE", "contact.whatsappNumber");
  Object.entries(config.routes ?? {}).forEach(([key, route]) => {
    if (
      typeof route !== "string" ||
      !route.startsWith("/") ||
      route.startsWith("//")
    ) issue("INVALID_ROUTE", `routes.${key}`);
  });
  Object.entries(config.assets ?? {}).forEach(([key, asset]) => {
    if (typeof asset !== "string" || !isAsset(asset))
      issue("INVALID_ASSET_URL", `assets.${key}`);
  });
  if (
    !Number.isInteger(config.commerce?.pdfValidityDays) ||
    config.commerce.pdfValidityDays <= 0
  ) issue("INVALID_NUMBER", "commerce.pdfValidityDays");
  if (
    !isCatalogPublicationApiBaseUrl(
      config.catalogPublication?.apiBaseUrl,
      mode,
    )
  ) {
    issue(
      "INVALID_PUBLICATION_API_URL",
      "catalogPublication.apiBaseUrl",
    );
  }
  const catalogSource =
    config.catalog?.source;
  const catalogSourceAllowed =
    catalogSource === "google-sheets" ||
    (mode !== "production" &&
      (catalogSource === "contract-fixture" ||
        catalogSource === "jung-core"));
  if (!catalogSourceAllowed)
    issue("UNKNOWN_CATALOG_SOURCE", "catalog.source");
  if (errors.length) return { ok: false, errors, warnings: [] };
  return {
    ok: true,
    config: deepFreeze(structuredClone(config)),
    warnings: [],
  };
}
