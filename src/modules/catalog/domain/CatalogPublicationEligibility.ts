import type {
  CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import type {
  CatalogCompositionResolution,
} from "@/modules/catalog/domain/CatalogCompositionResolver";

import type {
  CatalogPublicationIdentity,
} from "@/modules/catalog/domain/CatalogPublicationIdentity";

export type CatalogPublicationEligibilityReason =
  | "MANUAL_MODE"
  | "EFFECTIVE_INCLUDED_PRODUCTS"
  | "EFFECTIVE_EXCLUDED_PRODUCTS"
  | "CUSTOM_TITLE"
  | "CUSTOM_DESCRIPTION"
  | "CUSTOM_COVER"
  | "UNSUPPORTED_ATTRIBUTE_FILTERS"
  | "BLOCKED_INCLUDED_PRODUCTS"
  | "MISSING_INCLUDED_PRODUCTS"
  | "UNION_SOURCE_COMBINATION"
  | "UNRESOLVED_COMPOSITION";

export interface CatalogV1PublicationParams {
  categoryId?: string;

  campaignId?: string;
}

export interface CatalogV2PublicationParams {
  categoryIds:
    readonly string[];

  campaignIds:
    readonly string[];
}

export interface ResolveCatalogPublicationEligibilityParams {
  composition:
    CatalogComposition;

  resolution:
    CatalogCompositionResolution;

  publicationIdentity?:
    CatalogPublicationIdentity;
}

interface CatalogPublicationEligibilityBase {
  effectiveAddedProductIds:
    readonly string[];

  effectiveRemovedProductIds:
    readonly string[];
}

export type CatalogPublicationEligibility =
  | (
      CatalogPublicationEligibilityBase & {
        status:
          "v1-publicable";

        v1:
          CatalogV1PublicationParams;

        reasons:
          readonly [];
      }
    )
  | (
      CatalogPublicationEligibilityBase & {
        status:
          "v2-publicable";

        v2:
          CatalogV2PublicationParams;

        reasons:
          readonly [];
      }
    )
  | (
      CatalogPublicationEligibilityBase & {
        status:
          "requires-public-id";

        reasons:
          readonly CatalogPublicationEligibilityReason[];
      }
    );

const normalizeId = (
  value:
    unknown,
) =>
  String(
    value ?? "",
  )
    .trim()
    .toLowerCase();

const uniqueNormalizedIds = (
  values:
    readonly string[],
) => {
  const result:
    string[] = [];

  const seen =
    new Set<string>();

  values.forEach(
    (value) => {
      const normalized =
        normalizeId(
          value,
        );

      if (
        !normalized ||
        seen.has(
          normalized,
        )
      ) {
        return;
      }

      seen.add(
        normalized,
      );

      result.push(
        normalized,
      );
    },
  );

  return result;
};

const uniqueProductIds = (
  values:
    readonly string[],
) => {
  const result:
    string[] = [];

  const seen =
    new Set<string>();

  values.forEach(
    (value) => {
      const normalized =
        normalizeId(
          value,
        );

      if (
        !normalized ||
        seen.has(
          normalized,
        )
      ) {
        return;
      }

      seen.add(
        normalized,
      );

      result.push(
        value,
      );
    },
  );

  return result;
};

const hasText = (
  value:
    unknown,
) =>
  String(
    value ?? "",
  ).trim().length >
  0;

export function resolveCatalogPublicationEligibility({
  composition,
  resolution,
  publicationIdentity,
}: ResolveCatalogPublicationEligibilityParams):
  CatalogPublicationEligibility {
  const categoryIds =
    uniqueNormalizedIds(
      composition
        .filters
        .categoryIds,
    );

  const campaignIds =
    uniqueNormalizedIds(
      composition
        .filters
        .campaignIds,
    );

  const sourceOperator =
    composition.filters
      .sourceOperator ??
    "intersection";

  const automaticIds =
    new Set(
      resolution
        .automaticProductIds
        .map(
          normalizeId,
        ),
    );

  const finalIds =
    new Set(
      resolution
        .productIds
        .map(
          normalizeId,
        ),
    );

  const effectiveAddedProductIds =
    uniqueProductIds(
      resolution
        .productIds
        .filter(
          (productId) =>
            !automaticIds.has(
              normalizeId(
                productId,
              ),
            ),
        ),
    );

  const effectiveRemovedProductIds =
    uniqueProductIds(
      resolution
        .automaticProductIds
        .filter(
          (productId) =>
            !finalIds.has(
              normalizeId(
                productId,
              ),
            ),
        ),
    );

  const reasons:
    CatalogPublicationEligibilityReason[] =
      [];

  /*
   * El enlace PDF V1/V2 actual representa:
   *
   * categorías: OR
   * campañas:   OR
   * entre dimensiones: AND
   *
   * Una composición Admin V2 con:
   *
   * categorías UNION campañas
   *
   * no puede degradarse a esa URL porque seleccionaría
   * una población diferente.
   *
   * Hasta que exista Public ID/CORE para esa composición,
   * se bloquea de manera explícita y segura.
   */
  if (
    sourceOperator ===
      "union" &&
    categoryIds.length >
      0 &&
    campaignIds.length >
      0
  ) {
    reasons.push(
      "UNION_SOURCE_COMBINATION",
    );
  }

  if (
    composition.mode ===
    "manual"
  ) {
    reasons.push(
      "MANUAL_MODE",
    );
  }


  if (
    effectiveAddedProductIds.length >
    0
  ) {
    reasons.push(
      "EFFECTIVE_INCLUDED_PRODUCTS",
    );
  }

  if (
    effectiveRemovedProductIds.length >
    0
  ) {
    reasons.push(
      "EFFECTIVE_EXCLUDED_PRODUCTS",
    );
  }

  if (
    publicationIdentity
  ) {
    if (
      hasText(
        publicationIdentity
          .title,
      )
    ) {
      reasons.push(
        "CUSTOM_TITLE",
      );
    }

    if (
      hasText(
        publicationIdentity
          .description,
      )
    ) {
      reasons.push(
        "CUSTOM_DESCRIPTION",
      );
    }

    if (
      publicationIdentity
        .cover
        .strategy ===
        "custom"
    ) {
      reasons.push(
        "CUSTOM_COVER",
      );
    }
  }

  if (
    resolution
      .unsupportedAttributeFilters
      .length >
    0
  ) {
    reasons.push(
      "UNSUPPORTED_ATTRIBUTE_FILTERS",
    );
  }

  if (
    resolution
      .blockedIncludedProductIds
      .length >
    0
  ) {
    reasons.push(
      "BLOCKED_INCLUDED_PRODUCTS",
    );
  }

  if (
    resolution
      .missingIncludedProductIds
      .length >
    0
  ) {
    reasons.push(
      "MISSING_INCLUDED_PRODUCTS",
    );
  }

  if (
    !resolution
      .isFullyResolved &&
    resolution
      .unsupportedAttributeFilters
      .length ===
      0 &&
    resolution
      .blockedIncludedProductIds
      .length ===
      0 &&
    resolution
      .missingIncludedProductIds
      .length ===
      0
  ) {
    reasons.push(
      "UNRESOLVED_COMPOSITION",
    );
  }

  if (
    reasons.length >
    0
  ) {
    return {
      status:
        "requires-public-id",

      reasons,

      effectiveAddedProductIds,

      effectiveRemovedProductIds,
    };
  }

  if (
    categoryIds.length >
      1 ||
    campaignIds.length >
      1
  ) {
    return {
      status:
        "v2-publicable",

      v2: {
        categoryIds,

        campaignIds,
      },

      reasons: [],

      effectiveAddedProductIds,

      effectiveRemovedProductIds,
    };
  }

  const v1:
    CatalogV1PublicationParams =
      {};

  if (
    categoryIds.length ===
    1
  ) {
    v1.categoryId =
      categoryIds[0];
  }

  if (
    campaignIds.length ===
    1
  ) {
    v1.campaignId =
      campaignIds[0];
  }

  return {
    status:
      "v1-publicable",

    v1,

    reasons: [],

    effectiveAddedProductIds,

    effectiveRemovedProductIds,
  };
}
