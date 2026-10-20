import {
  resolveCatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogCompositionResolver";

import type {
  CatalogPublicPublication,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import {
  isProductPubliclyVisible,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

import {
  mixStrategicCatalogProducts,
} from "./StrategicCatalogMixer";

export interface ResolveCatalogPublicPublicationSelectionParams {
  publication:
    CatalogPublicPublication;

  products:
    readonly Product[];

  campaigns:
    readonly Campaign[];
}

export interface CatalogPublicPublicationSelectionResult {
  products:
    Product[];

  strategy:
    CatalogPublicPublication["publication"]["strategy"];

  effectiveCategoryIds:
    string[];

  showCategorySections:
    boolean;
}

const normalizeId = (
  value:
    unknown,
): string =>
  String(
    value ?? "",
  )
    .trim()
    .toLowerCase();

function resolveFixedProducts(
  publication:
    CatalogPublicPublication,

  products:
    readonly Product[],
): Product[] {
  const visibleProductById =
    new Map<string, Product>();

  products.forEach(
    (product) => {
      if (
        !isProductPubliclyVisible(
          product,
        )
      ) {
        return;
      }

      const productId =
        normalizeId(
          product.id,
        );

      if (
        !productId ||
        visibleProductById.has(
          productId,
        )
      ) {
        return;
      }

      visibleProductById.set(
        productId,
        product,
      );
    },
  );

  const result:
    Product[] = [];

  const seen =
    new Set<string>();

  publication
    .publication
    .productIds
    .forEach(
      (snapshotProductId) => {
        const productId =
          normalizeId(
            snapshotProductId,
          );

        if (
          !productId ||
          seen.has(
            productId,
          )
        ) {
          return;
        }

        seen.add(
          productId,
        );

        const product =
          visibleProductById.get(
            productId,
          );

        if (!product) {
          return;
        }

        result.push(
          product,
        );
      },
    );

  return result;
}

function resolveEffectiveCategoryIds(
  products:
    readonly Product[],
): string[] {
  const result:
    string[] = [];

  const seen =
    new Set<string>();

  products.forEach(
    (product) => {
      const categoryId =
        normalizeId(
          product.category,
        );

      if (
        !categoryId ||
        seen.has(
          categoryId,
        )
      ) {
        return;
      }

      seen.add(
        categoryId,
      );

      result.push(
        categoryId,
      );
    },
  );

  return result;
}

/**
 * Resuelve una publicación pública contra el catálogo
 * comercial actualmente disponible.
 *
 * dynamic:
 * reevalúa la composición almacenada.
 *
 * fixed:
 * conserva exclusivamente los IDs congelados al publicar,
 * retirando solamente productos inexistentes o que dejaron
 * de cumplir la política pública.
 *
 * La mezcla estratégica ocurre después de resolver
 * el conjunto comercial.
 */
export function resolveCatalogPublicPublicationSelection({
  publication,
  products,
  campaigns,
}: ResolveCatalogPublicPublicationSelectionParams):
  CatalogPublicPublicationSelectionResult {
  const strategy =
    publication
      .publication
      .strategy;

  const selectedProducts =
    strategy ===
      "dynamic"
      ? resolveCatalogComposition({
          products,

          composition:
            publication
              .composition,
        }).products
      : resolveFixedProducts(
          publication,
          products,
        );

  const editorialProducts =
    mixStrategicCatalogProducts({
      products:
        selectedProducts,

      campaigns,

      selectedCampaignIds:
        publication
          .composition
          .filters
          .campaignIds,
    });

  const effectiveCategoryIds =
    resolveEffectiveCategoryIds(
      editorialProducts,
    );

  return {
    products:
      editorialProducts,

    strategy,

    effectiveCategoryIds,

    showCategorySections:
      effectiveCategoryIds.length >
      1,
  };
}
