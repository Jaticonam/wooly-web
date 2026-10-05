import {
  sanitizeCatalogComposition,
  type CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  cloneCatalogPublicationIdentity,
  createDefaultCatalogPublicationIdentity,
  sanitizeCatalogPublicationIdentity,
  type CatalogPublicationIdentity,
} from "@/modules/catalog/domain/CatalogPublicationIdentity";

import {
  cloneCatalogPublicationSnapshot,
  sanitizeCatalogPublicationSnapshot,
  type CatalogPublicationSnapshot,
} from "@/modules/catalog/domain/CatalogPublication";

export const CATALOG_COMPOSITION_DRAFT_VERSION =
  3 as const;

export type CatalogCompositionDraftStatus =
  | "draft"
  | "published"
  | "expired"
  | "archived";

export interface CatalogCompositionDraft {
  id: string;

  name: string;

  status:
    CatalogCompositionDraftStatus;

  composition:
    CatalogComposition;

  publicationIdentity:
    CatalogPublicationIdentity;

  publication:
    CatalogPublicationSnapshot | null;

  createdAt:
    string;

  updatedAt:
    string;

  version:
    typeof CATALOG_COMPOSITION_DRAFT_VERSION;
}

const VALID_STATUSES:
  readonly CatalogCompositionDraftStatus[] =
  [
    "draft",
    "published",
    "expired",
    "archived",
  ];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isValidIsoDate(
  value: unknown,
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

export function cloneCatalogComposition(
  composition:
    CatalogComposition,
): CatalogComposition {
  return {
    mode:
      composition.mode,

    filters: {
      sourceOperator:
        composition.filters
          .sourceOperator ??
        "intersection",

      categoryIds: [
        ...composition
          .filters
          .categoryIds,
      ],

      campaignIds: [
        ...composition
          .filters
          .campaignIds,
      ],

      attributes: {
        colors: [
          ...(
            composition
              .filters
              .attributes
              ?.colors ??
            []
          ),
        ],

        tags: [
          ...(
            composition
              .filters
              .attributes
              ?.tags ??
            []
          ),
        ],
      },
    },

    overrides: {
      includedProductIds: [
        ...composition
          .overrides
          .includedProductIds,
      ],

      excludedProductIds: [
        ...composition
          .overrides
          .excludedProductIds,
      ],
    },
  };
}

export function cloneCatalogCompositionDraft(
  draft:
    CatalogCompositionDraft,
): CatalogCompositionDraft {
  return {
    ...draft,

    composition:
      cloneCatalogComposition(
        draft.composition,
      ),

    publicationIdentity:
      cloneCatalogPublicationIdentity(
        draft.publicationIdentity,
      ),

    publication:
      draft.publication
        ? cloneCatalogPublicationSnapshot(
            draft.publication,
          )
        : null,
  };
}

export function sanitizeCatalogCompositionDraft(
  value: unknown,
): CatalogCompositionDraft | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.version !==
      1 &&
    value.version !==
      2 &&
    value.version !==
      CATALOG_COMPOSITION_DRAFT_VERSION
  ) {
    return null;
  }

  if (
    typeof value.id !==
      "string" ||
    !value.id.trim()
  ) {
    return null;
  }

  if (
    typeof value.name !==
      "string" ||
    !value.name.trim()
  ) {
    return null;
  }

  if (
    typeof value.status !==
      "string" ||
    !VALID_STATUSES.includes(
      value.status as CatalogCompositionDraftStatus,
    )
  ) {
    return null;
  }

  if (
    !isValidIsoDate(
      value.createdAt,
    ) ||
    !isValidIsoDate(
      value.updatedAt,
    )
  ) {
    return null;
  }

  const composition =
    sanitizeCatalogComposition(
      value.composition,
    );

  if (!composition) {
    return null;
  }

  const publicationIdentity =
    value.version ===
      1
      ? createDefaultCatalogPublicationIdentity(
          value.name,
        )
      : sanitizeCatalogPublicationIdentity(
          value.publicationIdentity,
        );

  if (!publicationIdentity) {
    return null;
  }

  let publication:
    CatalogPublicationSnapshot | null =
      null;

  if (
    value.version ===
      CATALOG_COMPOSITION_DRAFT_VERSION
  ) {
    if (
      value.publication !==
        null
    ) {
      publication =
        sanitizeCatalogPublicationSnapshot(
          value.publication,
        );

      if (!publication) {
        return null;
      }
    }
  }

  return {
    id:
      value.id.trim(),

    name:
      value.name.trim(),

    status:
      value.status as CatalogCompositionDraftStatus,

    composition,

    publicationIdentity,

    publication,

    createdAt:
      value.createdAt,

    updatedAt:
      value.updatedAt,

    version:
      CATALOG_COMPOSITION_DRAFT_VERSION,
  };
}

export function sanitizeCatalogCompositionDraftList(
  value: unknown,
): CatalogCompositionDraft[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const result:
    CatalogCompositionDraft[] =
      [];

  const ids =
    new Set<string>();

  for (const candidate of value) {
    const draft =
      sanitizeCatalogCompositionDraft(
        candidate,
      );

    if (!draft) {
      return null;
    }

    if (
      ids.has(
        draft.id,
      )
    ) {
      return null;
    }

    ids.add(
      draft.id,
    );

    result.push(
      draft,
    );
  }

  return result;
}
