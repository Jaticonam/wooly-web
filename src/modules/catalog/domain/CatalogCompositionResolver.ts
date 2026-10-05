import {
  isProductPubliclyVisible,
} from "@/modules/catalog/domain/ProductCommercialPolicy";

import type {
  Product,
} from "@/shared/types/product";

import type {
  CatalogComposition,
} from "./CatalogComposition";

export type UnsupportedCatalogAttributeFilter =
  | "colors"
  | "tags";

export interface CatalogCompositionResolution {
  /**
   * Selección comercial final.
   */
  products: Product[];

  /**
   * IDs finales en el orden estable del pool fuente.
   *
   * La organización editorial definitiva pertenece al
   * pipeline PDF y no a este resolver.
   */
  productIds: string[];

  /**
   * Resultado automático previo a overrides manuales.
   */
  automaticProductIds: string[];

  /**
   * Inclusiones manuales válidas y comercialmente visibles.
   */
  manuallyIncludedProductIds: string[];

  /**
   * Exclusiones normalizadas solicitadas.
   */
  excludedProductIds: string[];

  /**
   * Productos solicitados manualmente que existen en la
   * fuente, pero que la política comercial no permite
   * publicar.
   */
  blockedIncludedProductIds: string[];

  /**
   * IDs solicitados manualmente que ya no existen en el
   * catálogo fuente.
   */
  missingIncludedProductIds: string[];

  /**
   * Filtros declarados por V3 cuyo dato todavía no existe
   * de manera estructurada en Product.
   */
  unsupportedAttributeFilters:
    UnsupportedCatalogAttributeFilter[];

  /**
   * La composición está completamente resuelta únicamente
   * si no tiene atributos pendientes, productos bloqueados
   * ni productos manuales inexistentes.
   */
  isFullyResolved: boolean;
}

export interface ResolveCatalogCompositionParams {
  /**
   * Pool de productos recibido desde la capa de catálogo.
   *
   * V3 aplica internamente la misma fachada de visibilidad
   * pública utilizada por CatalogSelection V2.
   */
  products: readonly Product[];

  composition: CatalogComposition;
}

const normalizeId = (
  value?: string | null,
) =>
  String(
    value ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );

const uniqueNormalizedIds = (
  values: readonly string[],
) =>
  Array.from(
    new Set(
      values
        .map(
          normalizeId,
        )
        .filter(
          Boolean,
        ),
    ),
  );

const productMatchesCategories = (
  product: Product,
  categoryIds: ReadonlySet<string>,
) => {
  if (
    categoryIds.size === 0
  ) {
    return true;
  }

  return categoryIds.has(
    normalizeId(
      product.category,
    ),
  );
};

const productMatchesCampaigns = (
  product: Product,
  campaignIds: ReadonlySet<string>,
) => {
  if (
    campaignIds.size === 0
  ) {
    return true;
  }

  return (
    product.campaigns ??
    []
  ).some(
    (campaignId) =>
      campaignIds.has(
        normalizeId(
          campaignId,
        ),
      ),
  );
};

const getUnsupportedAttributeFilters = (
  composition: CatalogComposition,
): UnsupportedCatalogAttributeFilter[] => {
  const unsupported:
    UnsupportedCatalogAttributeFilter[] = [];

  const colors =
    composition.filters.attributes?.colors ??
    [];

  const tags =
    composition.filters.attributes?.tags ??
    [];

  if (
    uniqueNormalizedIds(
      colors,
    ).length > 0
  ) {
    unsupported.push(
      "colors",
    );
  }

  if (
    uniqueNormalizedIds(
      tags,
    ).length > 0
  ) {
    unsupported.push(
      "tags",
    );
  }

  return unsupported;
};

/**
 * Álgebra V3:
 *
 * categorías:
 *   OR
 *
 * campañas:
 *   OR
 *
 * entre dimensiones:
 *
 *   intersection:
 *     categorías AND campañas
 *
 *   union:
 *     categorías OR campañas
 *
 * `intersection` es la semántica histórica.
 * `union` es la semántica de fuentes de Wooly Admin V2.
 *
 * overrides:
 *   (AUTOMÁTICOS - EXCLUIDOS) ∪ INCLUIDOS
 *
 * Restricción superior:
 *
 * Todo producto final debe cumplir
 * isProductPubliclyVisible().
 *
 * Ninguna inclusión manual puede saltarse la política
 * comercial.
 */
export function resolveCatalogComposition({
  products,
  composition,
}: ResolveCatalogCompositionParams): CatalogCompositionResolution {
  const categoryIds =
    new Set(
      uniqueNormalizedIds(
        composition.filters.categoryIds,
      ),
    );

  const campaignIds =
    new Set(
      uniqueNormalizedIds(
        composition.filters.campaignIds,
      ),
    );

  const sourceOperator =
    composition.filters
      .sourceOperator ??
    "intersection";

  const hasCategorySources =
    categoryIds.size > 0;

  const hasCampaignSources =
    campaignIds.size > 0;

  const includedIds =
    new Set(
      uniqueNormalizedIds(
        composition.overrides.includedProductIds,
      ),
    );

  const excludedIds =
    new Set(
      uniqueNormalizedIds(
        composition.overrides.excludedProductIds,
      ),
    );

  /**
   * Índice completo de fuente.
   *
   * Se conserva el primer producto recibido por ID para
   * mantener identidad estable ante duplicados accidentales.
   */
  const sourceProductById =
    new Map<
      string,
      Product
    >();

  products.forEach(
    (product) => {
      const productId =
        normalizeId(
          product.id,
        );

      if (
        !productId ||
        sourceProductById.has(
          productId,
        )
      ) {
        return;
      }

      sourceProductById.set(
        productId,
        product,
      );
    },
  );

  /**
   * Pool comercial V3.
   *
   * Aplica exactamente la fachada pública que protege
   * CatalogSelection V2.
   */
  const productById =
    new Map<
      string,
      Product
    >();

  sourceProductById.forEach(
    (
      product,
      productId,
    ) => {
      if (
        !isProductPubliclyVisible(
          product,
        )
      ) {
        return;
      }

      productById.set(
        productId,
        product,
      );
    },
  );

  const automaticIds =
    new Set<string>();

  /**
   * Manual no crea selección automática.
   *
   * Automatic e hybrid con filtros vacíos representan todo
   * el catálogo comercialmente visible.
   */
  if (
    composition.mode !==
    "manual"
  ) {
    productById.forEach(
      (
        product,
        productId,
      ) => {
        if (
          sourceOperator ===
            "union"
        ) {
          /*
           * Wooly Admin V2 interpreta categorías y campañas
           * como fuentes explícitamente acumuladas.
           *
           * Union sin ninguna fuente automática no significa
           * "todo el catálogo": significa base vacía.
           *
           * Los productos explícitos todavía pueden entrar
           * posteriormente mediante includedProductIds.
           */
          if (
            !hasCategorySources &&
            !hasCampaignSources
          ) {
            return;
          }
          const matchesCategory =
            hasCategorySources &&
            productMatchesCategories(
              product,
              categoryIds,
            );

          const matchesCampaign =
            hasCampaignSources &&
            productMatchesCampaigns(
              product,
              campaignIds,
            );

          if (
            !matchesCategory &&
            !matchesCampaign
          ) {
            return;
          }
        } else {
          if (
            !productMatchesCategories(
              product,
              categoryIds,
            )
          ) {
            return;
          }

          if (
            !productMatchesCampaigns(
              product,
              campaignIds,
            )
          ) {
            return;
          }
        }

        automaticIds.add(
          productId,
        );
      },
    );
  }

  const finalIds =
    new Set(
      Array.from(
        automaticIds,
      ).filter(
        (productId) =>
          !excludedIds.has(
            productId,
          ),
      ),
    );

  /**
   * Included tiene precedencia sobre excluded, pero jamás
   * sobre la política comercial.
   */
  includedIds.forEach(
    (productId) => {
      if (
        productById.has(
          productId,
        )
      ) {
        finalIds.add(
          productId,
        );
      }
    },
  );

  const selectedProducts =
    Array.from(
      productById.entries(),
    )
      .filter(
        ([productId]) =>
          finalIds.has(
            productId,
          ),
      )
      .map(
        ([, product]) =>
          product,
      );

  const manuallyIncludedProductIds =
    Array.from(
      includedIds,
    )
      .filter(
        (productId) =>
          productById.has(
            productId,
          ),
      )
      .map(
        (productId) =>
          productById.get(
            productId,
          )!.id,
      );

  const blockedIncludedProductIds =
    Array.from(
      includedIds,
    ).filter(
      (productId) =>
        sourceProductById.has(
          productId,
        ) &&
        !productById.has(
          productId,
        ),
    );

  const missingIncludedProductIds =
    Array.from(
      includedIds,
    ).filter(
      (productId) =>
        !sourceProductById.has(
          productId,
        ),
    );

  const unsupportedAttributeFilters =
    getUnsupportedAttributeFilters(
      composition,
    );

  return {
    products:
      selectedProducts,

    productIds:
      selectedProducts.map(
        (product) =>
          product.id,
      ),

    automaticProductIds:
      Array.from(
        automaticIds,
      ).map(
        (productId) =>
          productById.get(
            productId,
          )!.id,
      ),

    manuallyIncludedProductIds,

    excludedProductIds:
      Array.from(
        excludedIds,
      ),

    blockedIncludedProductIds,

    missingIncludedProductIds,

    unsupportedAttributeFilters,

    isFullyResolved:
      unsupportedAttributeFilters.length ===
        0 &&
      blockedIncludedProductIds.length ===
        0 &&
      missingIncludedProductIds.length ===
        0,
  };
}
