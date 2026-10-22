import type {
  CatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import type {
  CatalogPublicPublication,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import type {
  CatalogPublicationIdentity,
} from "@wooly/contracts/catalog/domain/CatalogPublicationIdentity";

/**
 * Datos preparados por la capa de aplicación al
 * solicitar una publicación pública.
 *
 * El provider es responsable de asignar Public ID,
 * publishedAt, validUntil y versión del recurso.
 */
export interface PublishCatalogInput {
  /**
   * Marca de la sesión Admin (`AdminAuthContext`), nunca de
   * configuración. JUNG CORE la recibe en la ruta.
   */
  brandId:
    string;

  /**
   * Clave de idempotencia (16–80 caracteres `[A-Za-z0-9_-]`).
   * Se reutiliza al reintentar la misma publicación.
   */
  requestId:
    string;

  /** Referencia opcional al borrador local; nunca es pública. */
  sourceReference?:
    string | null;

  composition:
    CatalogComposition;

  publicationIdentity:
    CatalogPublicationIdentity;

  /**
   * Resolución comercial actual de la composición.
   *
   * El snapshot existente decide si estos IDs deben
   * conservarse como fixed o descartarse como dynamic.
   */
  resolvedProductIds:
    readonly string[];

  validityDays?:
    number;
}

/**
 * Frontera de persistencia pública.
 *
 * Es deliberadamente independiente de
 * CatalogCompositionProvider, cuya responsabilidad
 * continúa siendo la gestión privada de borradores.
 */
export interface CatalogPublicationProvider {
  readonly source:
    string;

  publish(
    input:
      PublishCatalogInput,
  ):
    Promise<
      CatalogPublicPublication
    >;

  getByPublicId(
    publicId:
      string,
  ):
    Promise<
      CatalogPublicPublication | null
    >;
}
