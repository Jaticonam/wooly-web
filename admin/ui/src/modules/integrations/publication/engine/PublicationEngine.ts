import {
  canProductExportToTransactionalChannel,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import type {
  Product,
} from "@wooly/contracts/types/product";

import type {
  PublicationPlan,
} from "../models/PublicationPlan";

import type {
  PublicationResult,
} from "../models/PublicationResult";
import {
  getBaseUnitPrice,
} from "@wooly/contracts/domain/volumePricing/VolumePricing";

const normalize = (
  value?:
    string,
) =>
  String(
    value ||
    "",
  )
    .trim()
    .toLowerCase();

const byDirection = (
  direction:
    "asc" |
    "desc",
) =>
  direction ===
  "asc"
    ? 1
    : -1;

const sortProducts = (
  items:
    Product[],

  plan:
    PublicationPlan,
) => {
  if (!plan.sorting) {
    return items;
  }

  const direction =
    byDirection(
      plan.sorting.direction,
    );

  return [
    ...items,
  ].sort(
    (
      a,
      b,
    ) => {
      if (
        plan.sorting?.by ===
        "priority"
      ) {
        return (
          (
            a.priority ||
            0
          ) -
          (
            b.priority ||
            0
          )
        ) *
          direction;
      }

      if (
        plan.sorting?.by ===
        "price"
      ) {
        return (
          (
            getBaseUnitPrice(
              a,
            )
          ) -
          (
            getBaseUnitPrice(
              b,
            )
          )
        ) *
          direction;
      }

      if (
        plan.sorting?.by ===
        "title"
      ) {
        return (
          a.title.localeCompare(
            b.title,
          ) *
          direction
        );
      }

      return 0;
    },
  );
};

const shuffle = <T,>(
  items:
    T[],
) =>
  [
    ...items,
  ].sort(
    () =>
      Math.random() -
      0.5,
  );

export const PublicationEngine = {
  apply(
    products:
      Product[],

    plan:
      PublicationPlan,
  ): PublicationResult<Product> {
    /*
     * Todo plan de este motor termina en canales comerciales
     * transaccionales.
     *
     * Preventa, agotado, oculto, borrador e inválidos quedan
     * fuera antes de aplicar cualquier filtro opcional.
     */
    let items =
      products.filter(
        canProductExportToTransactionalChannel,
      );

    if (!plan.enabled) {
      items = [];
    }

    if (
      plan.mode ===
        "campaign" &&
      plan.filters?.campaign
    ) {
      const target =
        normalize(
          plan.filters.campaign,
        );

      items =
        items.filter(
          (
            product,
          ) =>
            (
              product.campaigns ||
              []
            ).some(
              (
                campaign,
              ) =>
                normalize(
                  campaign,
                ) ===
                target,
            ),
        );
    }

    if (
      plan.mode ===
        "category" &&
      plan.filters?.category
    ) {
      const target =
        normalize(
          plan.filters.category,
        );

      items =
        items.filter(
          (
            product,
          ) =>
            normalize(
              product.category,
            ) ===
            target,
        );
    }

    if (
      plan.mode ===
        "selected" &&
      plan.filters?.ids
        ?.length
    ) {
      const ids =
        new Set(
          plan.filters.ids
            .map(
              normalize,
            ),
        );

      items =
        items.filter(
          (
            product,
          ) =>
            ids.has(
              normalize(
                product.id,
              ),
            ),
        );
    }

    if (
      plan.filters?.status
        ?.length
    ) {
      const statuses =
        new Set(
          plan.filters.status
            .map(
              normalize,
            ),
        );

      items =
        items.filter(
          (
            product,
          ) =>
            statuses.has(
              normalize(
                product.status,
              ),
            ),
        );
    }

    if (
      plan.filters
        ?.excludeOutOfStock
    ) {
      items =
        items.filter(
          (
            product,
          ) =>
            Number(
              product.stock ||
              0,
            ) > 0,
        );
    }

    if (
      plan.filters
        ?.excludePreorder
    ) {
      items =
        items.filter(
          (
            product,
          ) =>
            normalize(
              product.status,
            ) !==
            "preventa",
        );
    }

    items =
      sortProducts(
        items,
        plan,
      );

    if (
      plan.randomize
    ) {
      items =
        shuffle(
          items,
        );
    }

    if (
      plan.limit &&
      plan.limit > 0
    ) {
      items =
        items.slice(
          0,
          plan.limit,
        );
    }

    return {
      plan,

      totalItems:
        products.length,

      selectedItems:
        items.length,

      omittedItems:
        products.length -
        items.length,

      items,

      generatedAt:
        new Date()
          .toISOString(),
    };
  },
};
