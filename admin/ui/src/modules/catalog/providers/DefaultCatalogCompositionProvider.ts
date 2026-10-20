import {
  LocalCatalogCompositionProvider,
} from "@/modules/catalog/integrations/local/LocalCatalogCompositionProvider";

import type {
  CatalogCompositionProvider,
} from "@/modules/catalog/providers/CatalogCompositionProvider";

/**
 * Punto único de resolución del provider de composiciones.
 *
 * La versión actual usa persistencia local como adapter temporal.
 * La UI depende del contrato CatalogCompositionProvider,
 * no de localStorage.
 *
 * JUNG CORE podrá reemplazar este provider sin modificar
 * el compositor comercial.
 */
export const catalogCompositionProvider:
  CatalogCompositionProvider =
    new LocalCatalogCompositionProvider();