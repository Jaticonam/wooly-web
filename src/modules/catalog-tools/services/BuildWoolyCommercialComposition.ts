import {
  toWoolyCommercialComposition,
  type WoolyCommercialCompositionOptions,
} from "@/modules/catalog/adapters/WoolyCommercialCompositionAdapter";

import type {
  CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  resolveCatalogComposition,
  type CatalogCompositionResolution,
} from "@/modules/catalog/domain/CatalogCompositionResolver";

import type {
  CommercialCompositionV1,
} from "@/shared/contracts/commercial";

import type {
  Product,
} from "@/shared/types/product";

export interface BuildWoolyCommercialCompositionInput {
  products: readonly Product[];
  selection: CatalogComposition;
  output: WoolyCommercialCompositionOptions;
}

export interface WoolyCommercialCompositionBuildResult {
  composition: CommercialCompositionV1;
  resolution: CatalogCompositionResolution;
}

/**
 * Caso de uso de frontera del admin Wooly.
 *
 * Resuelve primero la selección V3 y proyecta únicamente los productos
 * comercialmente válidos hacia el contrato que consumirá JUNG CORE.
 */
export const buildWoolyCommercialComposition = ({
  products,
  selection,
  output,
}: BuildWoolyCommercialCompositionInput): WoolyCommercialCompositionBuildResult => {
  const resolution = resolveCatalogComposition({
    products,
    composition: selection,
  });

  return {
    composition: toWoolyCommercialComposition(
      resolution.products,
      output,
    ),
    resolution,
  };
};
