import type {
  CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import type {
  CatalogCompositionResolution,
} from "@/modules/catalog/domain/CatalogCompositionResolver";

import type {
  CatalogPublicPublication,
} from "@/modules/catalog/domain/CatalogPublicPublication";

import type {
  CatalogPublicationIdentity,
} from "@/modules/catalog/domain/CatalogPublicationIdentity";

import type {
  CatalogPublicationProvider,
} from "@/modules/catalog/providers/CatalogPublicationProvider";

export type PublishResolvedCatalogBlockedReason =
  | "EMPTY_RESOLUTION"
  | "INCOMPLETE_RESOLUTION";

interface PublishResolvedCatalogContext {
  composition:
    CatalogComposition;

  publicationIdentity:
    CatalogPublicationIdentity;
}

export type PublishResolvedCatalogResult =
  | (
      PublishResolvedCatalogContext & {
        status:
          "ready";

        publicId:
          string;

        publication:
          CatalogPublicPublication;
      }
    )
  | (
      PublishResolvedCatalogContext & {
        status:
          "unavailable";
      }
    )
  | (
      PublishResolvedCatalogContext & {
        status:
          "blocked";

        reason:
          PublishResolvedCatalogBlockedReason;
      }
    )
  | (
      PublishResolvedCatalogContext & {
        status:
          "error";

        error:
          unknown;
      }
    );

export interface PublishResolvedCatalogInput {
  provider:
    CatalogPublicationProvider | null;

  composition:
    CatalogComposition;

  publicationIdentity:
    CatalogPublicationIdentity;

  resolution:
    CatalogCompositionResolution;

  validityDays?:
    number;
}

const hasIncompleteResolution = (
  resolution:
    CatalogCompositionResolution,
): boolean =>
  !resolution.isFullyResolved ||
  resolution
    .blockedIncludedProductIds
    .length > 0 ||
  resolution
    .missingIncludedProductIds
    .length > 0 ||
  resolution
    .unsupportedAttributeFilters
    .length > 0;

/**
 * Publica exactamente la composición ya resuelta por
 * CatalogCompositionResolver.
 *
 * Esta capa NO vuelve a inferir productos a partir de
 * categorías, campañas ni overrides. `resolution.productIds`
 * es el snapshot comercial que recibe el provider.
 */
export async function publishResolvedCatalog({
  provider,
  composition,
  publicationIdentity,
  resolution,
  validityDays,
}: PublishResolvedCatalogInput): Promise<PublishResolvedCatalogResult> {
  const context:
    PublishResolvedCatalogContext = {
      composition,
      publicationIdentity,
    };

  if (!provider) {
    return {
      ...context,
      status:
        "unavailable",
    };
  }

  if (
    resolution
      .productIds
      .length === 0
  ) {
    return {
      ...context,
      status:
        "blocked",
      reason:
        "EMPTY_RESOLUTION",
    };
  }

  if (
    hasIncompleteResolution(
      resolution,
    )
  ) {
    return {
      ...context,
      status:
        "blocked",
      reason:
        "INCOMPLETE_RESOLUTION",
    };
  }

  try {
    const publication =
      await provider.publish({
        composition,
        publicationIdentity,
        resolvedProductIds: [
          ...resolution
            .productIds,
        ],

        ...(
          validityDays !==
            undefined
            ? {
                validityDays,
              }
            : {}
        ),
      });

    return {
      ...context,
      status:
        "ready",
      publicId:
        publication.publicId,
      publication,
    };
  } catch (error: unknown) {
    return {
      ...context,
      status:
        "error",
      error,
    };
  }
}
