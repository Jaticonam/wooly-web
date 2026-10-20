import {
  sanitizeCatalogComposition,
  type CatalogComposition,
} from "./CatalogComposition";

import {
  resolveCatalogPublicationStrategy,
  sanitizeCatalogPublicationSnapshot,
  type CatalogPublicationSnapshot,
} from "./CatalogPublication";

import {
  sanitizeCatalogPublicationIdentity,
  type CatalogPublicationIdentity,
} from "./CatalogPublicationIdentity";

/**
 * Versión del recurso público persistido.
 *
 * Es independiente de la versión interna del snapshot
 * para permitir que ambos contratos evolucionen sin
 * quedar artificialmente acoplados.
 */
export const CATALOG_PUBLIC_PUBLICATION_VERSION =
  1 as const;

/**
 * Recurso mínimo que un lector público necesita para
 * reconstruir un catálogo publicado por Public ID.
 *
 * Deliberadamente no expone identidad del borrador,
 * nombre interno, status administrativo ni timestamps
 * de autoría.
 */
export interface CatalogPublicPublication {
  publicId:
    string;

  composition:
    CatalogComposition;

  publicationIdentity:
    CatalogPublicationIdentity;

  publication:
    CatalogPublicationSnapshot;

  version:
    typeof CATALOG_PUBLIC_PUBLICATION_VERSION;
}

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

/**
 * Reconstruye un recurso público desde una frontera
 * externa sin confiar en la forma recibida.
 *
 * Public ID mantiene mayúsculas y minúsculas. El
 * alfabeto definitivo pertenece al futuro adapter de
 * persistencia; aquí solo se exige un identificador no
 * vacío.
 */
export function sanitizeCatalogPublicPublication(
  value: unknown,
): CatalogPublicPublication | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.version !==
      CATALOG_PUBLIC_PUBLICATION_VERSION
  ) {
    return null;
  }

  if (
    typeof value.publicId !==
      "string"
  ) {
    return null;
  }

  const publicId =
    value.publicId.trim();

  if (!publicId) {
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
    sanitizeCatalogPublicationIdentity(
      value.publicationIdentity,
    );

  if (!publicationIdentity) {
    return null;
  }

  const publication =
    sanitizeCatalogPublicationSnapshot(
      value.publication,
    );

  if (!publication) {
    return null;
  }

  const expectedStrategy =
    resolveCatalogPublicationStrategy(
      composition.mode,
    );

  if (
    publication.strategy !==
      expectedStrategy
  ) {
    return null;
  }

  return {
    publicId,
    composition,
    publicationIdentity,
    publication,
    version:
      CATALOG_PUBLIC_PUBLICATION_VERSION,
  };
}
