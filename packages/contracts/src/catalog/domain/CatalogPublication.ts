import type {
  CatalogCompositionMode,
} from "./CatalogComposition";

export const CATALOG_PUBLICATION_VERSION =
  1 as const;

export const DEFAULT_CATALOG_VALIDITY_DAYS =
  7;

export type CatalogPublicationStrategy =
  | "dynamic"
  | "fixed";

export interface CatalogPublicationSnapshot {
  strategy:
    CatalogPublicationStrategy;

  productIds:
    readonly string[];

  publishedAt:
    string;

  validUntil:
    string;

  version:
    typeof CATALOG_PUBLICATION_VERSION;
}

function normalizeProductIds(
  productIds:
    readonly string[],
): string[] {
  const result:
    string[] = [];

  const seen =
    new Set<string>();

  for (const value of productIds) {
    const id =
      String(
        value,
      ).trim();

    if (
      !id ||
      seen.has(
        id,
      )
    ) {
      continue;
    }

    seen.add(
      id,
    );

    result.push(
      id,
    );
  }

  return result;
}

export function resolveCatalogPublicationStrategy(
  mode:
    CatalogCompositionMode,
): CatalogPublicationStrategy {
  return mode ===
    "automatic"
    ? "dynamic"
    : "fixed";
}

export function createCatalogPublicationSnapshot(
  input: {
    mode:
      CatalogCompositionMode;

    resolvedProductIds:
      readonly string[];

    publishedAt?:
      Date;

    validityDays?:
      number;
  },
): CatalogPublicationSnapshot {
  const resolvedProductIds =
    normalizeProductIds(
      input.resolvedProductIds,
    );

  if (
    resolvedProductIds.length ===
    0
  ) {
    throw new Error(
      "No se puede publicar un catálogo sin productos.",
    );
  }

  const validityDays =
    input.validityDays ??
    DEFAULT_CATALOG_VALIDITY_DAYS;

  if (
    !Number.isInteger(
      validityDays,
    ) ||
    validityDays <
      1
  ) {
    throw new Error(
      "La vigencia del catálogo no es válida.",
    );
  }

  const publishedAt =
    input.publishedAt ??
    new Date();

  const validUntil =
    new Date(
      publishedAt.getTime(),
    );

  validUntil.setDate(
    validUntil.getDate() +
      validityDays,
  );

  const strategy =
    resolveCatalogPublicationStrategy(
      input.mode,
    );

  return {
    strategy,

    productIds:
      strategy ===
      "fixed"
        ? resolvedProductIds
        : [],

    publishedAt:
      publishedAt
        .toISOString(),

    validUntil:
      validUntil
        .toISOString(),

    version:
      CATALOG_PUBLICATION_VERSION,
  };
}

export function cloneCatalogPublicationSnapshot(
  publication:
    CatalogPublicationSnapshot,
): CatalogPublicationSnapshot {
  return {
    ...publication,

    productIds: [
      ...publication
        .productIds,
    ],
  };
}

function isIsoDate(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0 &&
    !Number.isNaN(
      Date.parse(
        value,
      ),
    )
  );
}

export function sanitizeCatalogPublicationSnapshot(
  value:
    unknown,
): CatalogPublicationSnapshot | null {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return null;
  }

  const candidate =
    value as Record<
      string,
      unknown
    >;

  if (
    candidate.version !==
      CATALOG_PUBLICATION_VERSION
  ) {
    return null;
  }

  if (
    candidate.strategy !==
      "dynamic" &&
    candidate.strategy !==
      "fixed"
  ) {
    return null;
  }

  if (
    !Array.isArray(
      candidate.productIds,
    ) ||
    !candidate.productIds.every(
      (item) =>
        typeof item ===
        "string",
    )
  ) {
    return null;
  }

  if (
    !isIsoDate(
      candidate.publishedAt,
    ) ||
    !isIsoDate(
      candidate.validUntil,
    )
  ) {
    return null;
  }

  const productIds =
    normalizeProductIds(
      candidate.productIds,
    );

  if (
    candidate.strategy ===
      "fixed" &&
    productIds.length ===
      0
  ) {
    return null;
  }

  return {
    strategy:
      candidate.strategy,

    productIds:
      candidate.strategy ===
        "fixed"
        ? productIds
        : [],

    publishedAt:
      candidate.publishedAt,

    validUntil:
      candidate.validUntil,

    version:
      CATALOG_PUBLICATION_VERSION,
  };
}

export function isCatalogPublicationExpired(
  publication:
    CatalogPublicationSnapshot,

  now:
    Date = new Date(),
): boolean {
  return (
    Date.parse(
      publication.validUntil,
    ) <=
    now.getTime()
  );
}