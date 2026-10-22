import type {
  CatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import type {
  CatalogCompositionResolution,
} from "@wooly/contracts/catalog/domain/CatalogCompositionResolver";

import type {
  CatalogPublicPublication,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import {
  prepareCatalogPublicationIdentity,
  type CatalogPublicationIdentity,
} from "@wooly/contracts/catalog/domain/CatalogPublicationIdentity";

import type {
  CatalogPublicationProvider,
} from "@wooly/shared/catalog/providers/CatalogPublicationProvider";

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

  /** Marca de la sesión Admin; sin ella la publicación no está disponible. */
  brandId:
    string | null;

  /** Clave de idempotencia reutilizada en reintentos de la misma publicación. */
  requestId:
    string;

  sourceReference?:
    string | null;

  composition:
    CatalogComposition;

  publicationIdentity:
    CatalogPublicationIdentity;

  resolution:
    CatalogCompositionResolution;

  validityDays?:
    number;
}

/**
 * JUNG CORE exige un título de 1–120 caracteres y WOOLY permite dejarlo
 * vacío. Se usa el mismo título general que muestra el PDF
 * (`buildCatalogPdfCopy`) para que la publicación sea válida y legible.
 */
export const CATALOG_PUBLICATION_FALLBACK_TITLE =
  "Catálogo Mayorista";

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
  brandId,
  requestId,
  sourceReference,
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

  if (
    !provider ||
    !String(brandId ?? "").trim()
  ) {
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
        brandId:
          String(brandId).trim(),
        requestId,
        ...(
          sourceReference
            ? {
                sourceReference,
              }
            : {}
        ),
        composition,
        publicationIdentity:
          prepareCatalogPublicationIdentity(
            publicationIdentity,
            CATALOG_PUBLICATION_FALLBACK_TITLE,
          ),
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
