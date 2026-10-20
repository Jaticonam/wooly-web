export const RECOVERABLE_CATALOG_FALLBACK_ERROR_CODES = [
  "JUNG_CORE_SNAPSHOT_LOAD_FAILED",
  "JUNG_CORE_CIRCUIT_OPEN",
  "HTTP_TIMEOUT",
  "HTTP_NETWORK_ERROR",
  "HTTP_502",
  "HTTP_503",
  "HTTP_504",
] as const;

export const BLOCKING_CATALOG_FALLBACK_ERROR_CODES = [
  "JUNG_CORE_SNAPSHOT_INVALID",
  "JUNG_CORE_BRAND_MISMATCH",
  "HTTP_401",
  "HTTP_403",
  "HTTP_404",
  "CONFIGURATION_ERROR",
  "UNKNOWN_ERROR",
] as const;

export type CatalogRecoverableFallbackErrorCode =
  typeof RECOVERABLE_CATALOG_FALLBACK_ERROR_CODES[number];

export type CatalogBlockingFallbackErrorCode =
  typeof BLOCKING_CATALOG_FALLBACK_ERROR_CODES[number];

export type CatalogFallbackErrorCode =
  | CatalogRecoverableFallbackErrorCode
  | CatalogBlockingFallbackErrorCode;

export type CatalogFallbackClassification =
  | "recoverable"
  | "blocked"
  | "unknown";

export interface CatalogFallbackAssessment {
  readonly code:
    string | null;

  readonly classification:
    CatalogFallbackClassification;

  readonly shouldFallback:
    boolean;
}

export type CatalogFallbackPredicate =
  (
    cause:
      unknown,
  ) => boolean;

const recoverableCodes =
  new Set<string>(
    RECOVERABLE_CATALOG_FALLBACK_ERROR_CODES,
  );

const blockingCodes =
  new Set<string>(
    BLOCKING_CATALOG_FALLBACK_ERROR_CODES,
  );

export function getCatalogFallbackErrorCode(
  cause:
    unknown,
): string | null {
  if (
    typeof cause !== "object" ||
    cause === null
  ) {
    return null;
  }

  const value =
    (cause as {
      readonly code?:
        unknown;
    }).code;

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

export function classifyCatalogFallbackError(
  cause:
    unknown,
): CatalogFallbackAssessment {
  const code =
    getCatalogFallbackErrorCode(
      cause,
    );

  if (
    code &&
    recoverableCodes.has(
      code,
    )
  ) {
    return {
      code,
      classification:
        "recoverable",
      shouldFallback:
        true,
    };
  }

  if (
    code &&
    blockingCodes.has(
      code,
    )
  ) {
    return {
      code,
      classification:
        "blocked",
      shouldFallback:
        false,
    };
  }

  return {
    code,
    classification:
      "unknown",
    shouldFallback:
      false,
  };
}

export function shouldUseCatalogFallback(
  cause:
    unknown,
): boolean {
  return classifyCatalogFallbackError(
    cause,
  ).shouldFallback;
}

export function getCatalogFallbackReason(
  cause:
    unknown,
): string {
  const code =
    getCatalogFallbackErrorCode(
      cause,
    );

  if (code) {
    return code;
  }

  if (
    cause instanceof Error &&
    cause.name
  ) {
    return cause.name;
  }

  return "PROVIDER_ERROR";
}