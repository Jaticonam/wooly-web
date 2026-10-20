import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
  type CatalogComposition,
} from "./CatalogComposition";

import {
  resolveCatalogComposition,
} from "./CatalogCompositionResolver";

import type {
  Product,
} from "../../types/product";

const product = ({
  id,
  category,
  status = "publicado",
}: {
  id: string;
  category: string;
  status?: string;
}): Product => ({
  id,
  title: id,
  description: `Producto ${id}`,
  category,
  price_1: 10,
  stock: 10,
  img: `/${id}.jpg`,
  status,
});

const products: Product[] = [
  product({
    id: "FLOR-001",
    category: "flores",
  }),

  product({
    id: "PELU-001",
    category: "peluches",
  }),

  product({
    id: "CAJA-001",
    category: "cajas",
  }),

  product({
    id: "OCULTO-001",
    category: "flores",
    status: "oculto",
  }),
];

const manualComposition = (
  includedProductIds:
    readonly string[],
): CatalogComposition => {
  const base =
    createEmptyCatalogComposition(
      "manual",
    );

  return {
    ...base,

    filters: {
      ...base.filters,

      categoryIds: [
        "flores",
      ],
    },

    overrides: {
      ...base.overrides,

      includedProductIds,
    },
  };
};

describe(
  "CatalogComposition manual selection",
  () => {
    it(
      "incluye productos elegidos explicitamente",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              manualComposition([
                "FLOR-001",
                "PELU-001",
              ]),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
          "PELU-001",
        ]);
      },
    );

    it(
      "ignora filtros automaticos en modo manual",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              manualComposition([
                "PELU-001",
              ]),
          });

        expect(
          result.productIds,
        ).toEqual([
          "PELU-001",
        ]);

        expect(
          result.automaticProductIds,
        ).toEqual([]);
      },
    );

    it(
      "retirar un id lo elimina del catalogo manual",
      () => {
        const before =
          resolveCatalogComposition({
            products,

            composition:
              manualComposition([
                "FLOR-001",
                "CAJA-001",
              ]),
          });

        const after =
          resolveCatalogComposition({
            products,

            composition:
              manualComposition([
                "CAJA-001",
              ]),
          });

        expect(
          before.productIds,
        ).toEqual([
          "FLOR-001",
          "CAJA-001",
        ]);

        expect(
          after.productIds,
        ).toEqual([
          "CAJA-001",
        ]);
      },
    );

    it(
      "no permite agregar manualmente un producto oculto",
      () => {
        const result =
          resolveCatalogComposition({
            products,

            composition:
              manualComposition([
                "OCULTO-001",
              ]),
          });

        expect(
          result.productIds,
        ).toEqual([]);

        expect(
          result.blockedIncludedProductIds,
        ).toEqual([
          "oculto-001",
        ]);

        expect(
          result.isFullyResolved,
        ).toBe(
          false,
        );
      },
    );
  },
);