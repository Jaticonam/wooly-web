import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

import {
  normalizeCatalogSelectionValue,
} from "@wooly/contracts/catalog/domain/CatalogSelection";

export interface MixStrategicCatalogProductsParams {
  products:
    readonly Product[];

  campaigns:
    readonly Campaign[];

  selectedCampaignIds:
    readonly string[];
}

const catalogMixerCollator =
  new Intl.Collator(
    "es",
    {
      numeric:
        true,
      sensitivity:
        "base",
    },
  );

const compareText = (
  firstValue:
    unknown,

  secondValue:
    unknown,
) =>
  catalogMixerCollator.compare(
    normalizeCatalogSelectionValue(
      firstValue,
    ),
    normalizeCatalogSelectionValue(
      secondValue,
    ),
  );

const getPriority = (
  value:
    unknown,
) => {
  const priority =
    Number(
      value ?? 0,
    );

  return Number.isFinite(
    priority,
  )
    ? priority
    : 0;
};

const normalizeIds = (
  values:
    readonly string[],
) =>
  Array.from(
    new Set(
      values
        .map(
          normalizeCatalogSelectionValue,
        )
        .filter(
          Boolean,
        ),
    ),
  );

const buildCampaignRegistry = (
  campaigns:
    readonly Campaign[],
) => {
  const registry =
    new Map<
      string,
      Campaign
    >();

  campaigns.forEach(
    (campaign) => {
      const campaignId =
        normalizeCatalogSelectionValue(
          campaign.id,
        );

      if (
        !campaignId ||
        registry.has(
          campaignId,
        )
      ) {
        return;
      }

      registry.set(
        campaignId,
        campaign,
      );
    },
  );

  return registry;
};

const compareProducts = (
  firstProduct:
    Product,

  secondProduct:
    Product,
) => {
  const priorityDifference =
    getPriority(
      secondProduct.priority,
    ) -
    getPriority(
      firstProduct.priority,
    );

  if (
    priorityDifference !==
    0
  ) {
    return priorityDifference;
  }

  return compareText(
    firstProduct.id,
    secondProduct.id,
  );
};

const getCategoryKey = (
  product:
    Product,
) =>
  normalizeCatalogSelectionValue(
    product.category,
  ) ||
  "__sin_categoria__";

const getProductCampaignIds = (
  product:
    Product,
) =>
  new Set(
    normalizeIds(
      product.campaigns ??
        [],
    ),
  );

const mixCategoryProducts = ({
  products,
  orderedCampaignIds,
}: {
  products:
    readonly Product[];

  orderedCampaignIds:
    readonly string[];
}) => {
  const buckets =
    new Map<
      string,
      Product[]
    >(
      orderedCampaignIds.map(
        (campaignId) => [
          campaignId,
          [],
        ],
      ),
    );

  const unassigned:
    Product[] =
      [];

  products.forEach(
    (product) => {
      const productCampaignIds =
        getProductCampaignIds(
          product,
        );

      /**
       * Un producto puede pertenecer a varias campañas.
       *
       * Para fines exclusivamente editoriales se asigna
       * a la campaña seleccionada con mayor precedencia.
       * Nunca se duplica el producto.
       */
      const primaryCampaignId =
        orderedCampaignIds.find(
          (campaignId) =>
            productCampaignIds.has(
              campaignId,
            ),
        );

      if (
        !primaryCampaignId
      ) {
        unassigned.push(
          product,
        );

        return;
      }

      buckets
        .get(
          primaryCampaignId,
        )!
        .push(
          product,
        );
    },
  );

  buckets.forEach(
    (bucket) => {
      bucket.sort(
        compareProducts,
      );
    },
  );

  unassigned.sort(
    compareProducts,
  );

  const mixed:
    Product[] =
      [];

  let round =
    0;

  while (true) {
    let addedInRound =
      false;

    orderedCampaignIds.forEach(
      (campaignId) => {
        const product =
          buckets.get(
            campaignId,
          )?.[
            round
          ];

        if (!product) {
          return;
        }

        mixed.push(
          product,
        );

        addedInRound =
          true;
      },
    );

    if (
      !addedInRound
    ) {
      break;
    }

    round +=
      1;
  }

  /**
   * Fallback defensivo.
   *
   * El resolver V2 ya garantiza que, si existe filtro
   * de campañas, los productos coincidan con al menos
   * una campaña seleccionada. Aun así, ningún producto
   * debe desaparecer si un provider entrega una
   * inconsistencia temporal.
   */
  mixed.push(
    ...unassigned,
  );

  return mixed;
};

/**
 * Orden editorial determinista del PDF V2.
 *
 * Reglas:
 *
 * - Solo actúa con 2+ campañas seleccionadas.
 * - No decide pertenencia comercial.
 * - No agrega ni duplica productos.
 * - Mezcla campañas round-robin dentro de cada categoría.
 * - campaign.priority decide qué campaña participa primero.
 * - product.priority decide el orden dentro de cada bucket.
 * - Los empates se resuelven por ID.
 * - Conserva las posiciones relativas de las categorías
 *   en el stream global; BuildPdfCategorySections continúa
 *   siendo responsable de crear las secciones.
 */
export function mixStrategicCatalogProducts({
  products,
  campaigns,
  selectedCampaignIds,
}: MixStrategicCatalogProductsParams):
  Product[] {
  const normalizedCampaignIds =
    normalizeIds(
      selectedCampaignIds,
    );

  if (
    normalizedCampaignIds.length <=
    1
  ) {
    return [
      ...products,
    ];
  }

  const campaignRegistry =
    buildCampaignRegistry(
      campaigns,
    );

  const orderedCampaignIds =
    [
      ...normalizedCampaignIds,
    ].sort(
      (
        firstCampaignId,
        secondCampaignId,
      ) => {
        const firstPriority =
          getPriority(
            campaignRegistry.get(
              firstCampaignId,
            )?.priority,
          );

        const secondPriority =
          getPriority(
            campaignRegistry.get(
              secondCampaignId,
            )?.priority,
          );

        const priorityDifference =
          secondPriority -
          firstPriority;

        if (
          priorityDifference !==
          0
        ) {
          return priorityDifference;
        }

        return compareText(
          firstCampaignId,
          secondCampaignId,
        );
      },
    );

  const productsByCategory =
    new Map<
      string,
      Product[]
    >();

  products.forEach(
    (product) => {
      const categoryKey =
        getCategoryKey(
          product,
        );

      const categoryProducts =
        productsByCategory.get(
          categoryKey,
        ) ??
        [];

      categoryProducts.push(
        product,
      );

      productsByCategory.set(
        categoryKey,
        categoryProducts,
      );
    },
  );

  const mixedByCategory =
    new Map<
      string,
      Product[]
    >();

  productsByCategory.forEach(
    (
      categoryProducts,
      categoryKey,
    ) => {
      mixedByCategory.set(
        categoryKey,
        mixCategoryProducts({
          products:
            categoryProducts,

          orderedCampaignIds,
        }),
      );
    },
  );

  const categoryOffsets =
    new Map<
      string,
      number
    >();

  /**
   * Conservamos el patrón de categorías del stream original.
   *
   * Solo sustituimos cada "slot" de categoría por el
   * siguiente producto de la cola editorial ya mezclada.
   * Esto evita que el mixer asuma responsabilidades de
   * agrupación que pertenecen a BuildPdfCategorySections.
   */
  return products.map(
    (product) => {
      const categoryKey =
        getCategoryKey(
          product,
        );

      const offset =
        categoryOffsets.get(
          categoryKey,
        ) ??
        0;

      const replacement =
        mixedByCategory.get(
          categoryKey,
        )?.[
          offset
        ] ??
        product;

      categoryOffsets.set(
        categoryKey,
        offset +
          1,
      );

      return replacement;
    },
  );
}
