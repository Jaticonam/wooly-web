import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "../../types/product";

import {
  createEmptyCatalogComposition,
  type CatalogComposition,
} from "./CatalogComposition";

import {
  resolveCatalogComposition,
} from "./CatalogCompositionResolver";

const createProduct = ({
  id,
  category,
  campaigns = [],
  priority = 0,
  status = "publicado",
  stock = 10,
}: {
  id: string;
  category: string;
  campaigns?: string[];
  priority?: number;
  status?: string;
  stock?: number | null;
}): Product => ({
  id,
  title: id,
  description: `Producto ${id}`,
  category,
  price_1: 10,
  stock,
  img: `/products/${id}.jpg`,
  status,
  campaigns,
  priority,
});

const PRODUCTS: Product[] = [
  createProduct({
    id: "FLOR-001",
    category: "flores",
    campaigns: [
      "dia-novio",
    ],
    priority: 100,
  }),

  createProduct({
    id: "FLOR-002",
    category: "flores",
    campaigns: [
      "flores-amarillas",
    ],
    priority: 80,
  }),

  createProduct({
    id: "PELU-001",
    category: "peluches",
    campaigns: [
      "dia-novio",
    ],
    priority: 100,
  }),

  createProduct({
    id: "PELU-002",
    category: "peluches",
    campaigns: [
      "navidad",
    ],
    priority: 70,
  }),

  createProduct({
    id: "CAJA-001",
    category: "cajas",
    campaigns: [
      "dia-novio",
    ],
    priority: 90,
  }),
];

const composition = (
  value: Omit<Partial<CatalogComposition>, "filters" | "overrides"> & {
    filters?: Partial<CatalogComposition["filters"]>;
    overrides?: Partial<CatalogComposition["overrides"]>;
  } = {},
): CatalogComposition => {
  const base =
    createEmptyCatalogComposition(
      value.mode ??
        "automatic",
    );

  return {
    ...base,
    ...value,

    filters: {
      ...base.filters,
      ...value.filters,
    },

    overrides: {
      ...base.overrides,
      ...value.overrides,
    },
  };
};

describe(
  "CatalogCompositionResolver",
  () => {
    it(
      "resuelve varias categorías con OR",
      () => {
        const result =
          resolveCatalogComposition({
            products:
              PRODUCTS,

            composition:
              composition({
                filters: {
                  categoryIds: [
                    "flores",
                    "peluches",
                  ],
                },
              }),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
          "FLOR-002",
          "PELU-001",
          "PELU-002",
        ]);
      },
    );

    it(
      "resuelve varias campañas con OR",
      () => {
        const result =
          resolveCatalogComposition({
            products:
              PRODUCTS,

            composition:
              composition({
                filters: {
                  campaignIds: [
                    "dia-novio",
                    "navidad",
                  ],
                },
              }),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
          "PELU-001",
          "PELU-002",
          "CAJA-001",
        ]);
      },
    );

    it(
      "aplica AND entre categorías y campañas",
      () => {
        const result =
          resolveCatalogComposition({
            products:
              PRODUCTS,

            composition:
              composition({
                filters: {
                  categoryIds: [
                    "flores",
                    "peluches",
                  ],

                  campaignIds: [
                    "dia-novio",
                  ],
                },
              }),
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
      "aplica exclusiones e inclusiones manuales en modo híbrido",
      () => {
        const result =
          resolveCatalogComposition({
            products:
              PRODUCTS,

            composition:
              composition({
                mode:
                  "hybrid",

                filters: {
                  categoryIds: [
                    "flores",
                  ],
                },

                overrides: {
                  excludedProductIds: [
                    "FLOR-002",
                  ],

                  includedProductIds: [
                    "CAJA-001",
                  ],
                },
              }),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
          "CAJA-001",
        ]);

        expect(
          result.automaticProductIds,
        ).toEqual([
          "FLOR-001",
          "FLOR-002",
        ]);

        expect(
          result.manuallyIncludedProductIds,
        ).toEqual([
          "CAJA-001",
        ]);
      },
    );

    it(
      "da precedencia final a una inclusión sobre una exclusión",
      () => {
        const result =
          resolveCatalogComposition({
            products:
              PRODUCTS,

            composition:
              composition({
                mode:
                  "hybrid",

                filters: {
                  categoryIds: [
                    "flores",
                  ],
                },

                overrides: {
                  excludedProductIds: [
                    "FLOR-001",
                  ],

                  includedProductIds: [
                    "FLOR-001",
                  ],
                },
              }),
          });

        expect(
          result.productIds,
        ).toContain(
          "FLOR-001",
        );
      },
    );

    it(
      "en modo manual devuelve únicamente productos incluidos explícitamente",
      () => {
        const result =
          resolveCatalogComposition({
            products:
              PRODUCTS,

            composition:
              composition({
                mode:
                  "manual",

                overrides: {
                  includedProductIds: [
                    "PELU-001",
                    "CAJA-001",
                  ],
                },
              }),
          });

        expect(
          result.automaticProductIds,
        ).toEqual([]);

        expect(
          result.productIds,
        ).toEqual([
          "PELU-001",
          "CAJA-001",
        ]);
      },
    );

    it(
      "informa inclusiones que ya no existen en el catálogo",
      () => {
        const result =
          resolveCatalogComposition({
            products:
              PRODUCTS,

            composition:
              composition({
                mode:
                  "manual",

                overrides: {
                  includedProductIds: [
                    "FLOR-001",
                    "NO-EXISTE",
                  ],
                },
              }),
          });

        expect(
          result.productIds,
        ).toEqual([
          "FLOR-001",
        ]);

        expect(
          result.missingIncludedProductIds,
        ).toEqual([
          "no-existe",
        ]);
      },
    );

    it(
      "detecta atributos aún no soportados sin fingir resolución completa",
      () => {
        const result =
          resolveCatalogComposition({
            products:
              PRODUCTS,

            composition:
              composition({
                filters: {
                  categoryIds: [
                    "flores",
                  ],

                  attributes: {
                    colors: [
                      "amarillo",
                    ],

                    tags: [
                      "premium",
                    ],
                  },
                },
              }),
          });

        expect(
          result.unsupportedAttributeFilters,
        ).toEqual([
          "colors",
          "tags",
        ]);

        expect(
          result.isFullyResolved,
        ).toBe(
          false,
        );
      },
    );

    it(
      "un catálogo automático sin filtros representa todo el pool recibido",
      () => {
        const result =
          resolveCatalogComposition({
            products:
              PRODUCTS,

            composition:
              createEmptyCatalogComposition(
                "automatic",
              ),
          });

        expect(
          result.productIds,
        ).toEqual(
          PRODUCTS.map(
            (product) =>
              product.id,
          ),
        );
      },
    );

    it(
      "elimina IDs duplicados conservando el primer producto recibido",
      () => {
        const duplicated = [
          ...PRODUCTS,

          createProduct({
            id:
              "FLOR-001",

            category:
              "peluches",

            campaigns: [
              "navidad",
            ],
          }),
        ];

        const result =
          resolveCatalogComposition({
            products:
              duplicated,

            composition:
              createEmptyCatalogComposition(
                "automatic",
              ),
          });

        expect(
          result.productIds.filter(
            (id) =>
              id ===
              "FLOR-001",
          ),
        ).toHaveLength(
          1,
        );

        expect(
          result.products.find(
            (product) =>
              product.id ===
              "FLOR-001",
          )?.category,
        ).toBe(
          "flores",
        );
      },
    );
    it(
      "excluye productos que la política comercial no permite publicar",
      () => {
        const pool = [
          ...PRODUCTS,

          createProduct({
            id:
              "OCULTO-001",

            category:
              "flores",

            status:
              "oculto",
          }),

          createProduct({
            id:
              "BORRADOR-001",

            category:
              "flores",

            status:
              "borrador",
          }),
        ];

        const result =
          resolveCatalogComposition({
            products:
              pool,

            composition:
              createEmptyCatalogComposition(
                "automatic",
              ),
          });

        expect(
          result.productIds,
        ).not.toContain(
          "OCULTO-001",
        );

        expect(
          result.productIds,
        ).not.toContain(
          "BORRADOR-001",
        );
      },
    );

    it(
      "una inclusión manual no puede saltarse la política comercial",
      () => {
        const pool = [
          ...PRODUCTS,

          createProduct({
            id:
              "OCULTO-001",

            category:
              "flores",

            status:
              "oculto",
          }),
        ];

        const result =
          resolveCatalogComposition({
            products:
              pool,

            composition:
              composition({
                mode:
                  "manual",

                overrides: {
                  includedProductIds: [
                    "OCULTO-001",
                  ],
                },
              }),
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
          result.missingIncludedProductIds,
        ).toEqual([]);

        expect(
          result.isFullyResolved,
        ).toBe(
          false,
        );
      },
    );

    it(
      "distingue un producto bloqueado de uno inexistente",
      () => {
        const pool = [
          ...PRODUCTS,

          createProduct({
            id:
              "OCULTO-001",

            category:
              "flores",

            status:
              "oculto",
          }),
        ];

        const result =
          resolveCatalogComposition({
            products:
              pool,

            composition:
              composition({
                mode:
                  "manual",

                overrides: {
                  includedProductIds: [
                    "OCULTO-001",
                    "NO-EXISTE",
                  ],
                },
              }),
          });

        expect(
          result.blockedIncludedProductIds,
        ).toEqual([
          "oculto-001",
        ]);

        expect(
          result.missingIncludedProductIds,
        ).toEqual([
          "no-existe",
        ]);
      },
    );
    it(
      "excluye productos que la política comercial no permite publicar",
      () => {
        const pool = [
          ...PRODUCTS,

          createProduct({
            id:
              "OCULTO-001",

            category:
              "flores",

            status:
              "oculto",
          }),

          createProduct({
            id:
              "BORRADOR-001",

            category:
              "flores",

            status:
              "borrador",
          }),
        ];

        const result =
          resolveCatalogComposition({
            products:
              pool,

            composition:
              createEmptyCatalogComposition(
                "automatic",
              ),
          });

        expect(
          result.productIds,
        ).not.toContain(
          "OCULTO-001",
        );

        expect(
          result.productIds,
        ).not.toContain(
          "BORRADOR-001",
        );
      },
    );

    it(
      "una inclusión manual no puede saltarse la política comercial",
      () => {
        const pool = [
          ...PRODUCTS,

          createProduct({
            id:
              "OCULTO-001",

            category:
              "flores",

            status:
              "oculto",
          }),
        ];

        const result =
          resolveCatalogComposition({
            products:
              pool,

            composition:
              composition({
                mode:
                  "manual",

                overrides: {
                  includedProductIds: [
                    "OCULTO-001",
                  ],
                },
              }),
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
          result.missingIncludedProductIds,
        ).toEqual([]);

        expect(
          result.isFullyResolved,
        ).toBe(
          false,
        );
      },
    );

    it(
      "distingue un producto bloqueado de uno inexistente",
      () => {
        const pool = [
          ...PRODUCTS,

          createProduct({
            id:
              "OCULTO-001",

            category:
              "flores",

            status:
              "oculto",
          }),
        ];

        const result =
          resolveCatalogComposition({
            products:
              pool,

            composition:
              composition({
                mode:
                  "manual",

                overrides: {
                  includedProductIds: [
                    "OCULTO-001",
                    "NO-EXISTE",
                  ],
                },
              }),
          });

        expect(
          result.blockedIncludedProductIds,
        ).toEqual([
          "oculto-001",
        ]);

        expect(
          result.missingIncludedProductIds,
        ).toEqual([
          "no-existe",
        ]);
      },
    );
  },
);