import {
  isProductPublicationDataValid,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import type {
  SheetProduct,
} from "./normalizeProduct";

/**
 * Devuelve únicamente productos aptos para publicación pública.
 *
 * Estados admitidos:
 * - preventa
 * - publicado
 * - agotado
 *
 * Estados bloqueados:
 * - borrador
 * - oculto
 * - vacío
 * - desconocido
 *
 * Agotado es autoritativo:
 * la cantidad almacenada en stock no gobierna su publicación.
 */
export function validateProducts(
  products: SheetProduct[],
): SheetProduct[] {
  return products.filter(
    isProductPublicationDataValid,
  );
}
