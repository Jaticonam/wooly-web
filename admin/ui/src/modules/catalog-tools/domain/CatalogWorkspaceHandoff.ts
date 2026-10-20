export const CATALOG_WORKSPACE_HANDOFF_VERSION = 1 as const;

export interface CatalogWorkspaceHandoffV1 {
  readonly version:
    typeof CATALOG_WORKSPACE_HANDOFF_VERSION;

  readonly source:
    "product-explorer";

  readonly productIds:
    readonly string[];
}

function normalizeProductIds(
  productIds: readonly string[],
): string[] {
  return [
    ...new Set(
      productIds
        .map((productId) =>
          productId.trim(),
        )
        .filter(Boolean),
    ),
  ];
}

export function createCatalogWorkspaceHandoff(
  productIds: readonly string[],
): CatalogWorkspaceHandoffV1 {
  return {
    version:
      CATALOG_WORKSPACE_HANDOFF_VERSION,

    source:
      "product-explorer",

    productIds:
      normalizeProductIds(
        productIds,
      ),
  };
}

export function parseCatalogWorkspaceHandoff(
  value: unknown,
): CatalogWorkspaceHandoffV1 | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const candidate =
    value as Partial<CatalogWorkspaceHandoffV1>;

  if (
    candidate.version !==
      CATALOG_WORKSPACE_HANDOFF_VERSION ||
    candidate.source !==
      "product-explorer" ||
    !Array.isArray(
      candidate.productIds,
    )
  ) {
    return null;
  }

  const productIds =
    candidate.productIds.filter(
      (productId):
        productId is string =>
          typeof productId ===
          "string",
    );

  return createCatalogWorkspaceHandoff(
    productIds,
  );
}
