import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
  type CatalogCompositionMode,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import {
  CATALOG_PUBLIC_PUBLICATION_VERSION,
  type CatalogPublicPublication,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import {
  createDefaultCatalogPublicationIdentity,
} from "@wooly/contracts/catalog/domain/CatalogPublicationIdentity";

import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

import {
  resolveCatalogPublicPublicationSelection,
} from "./CatalogPublicPublicationSelection";

const product = ({
  id,
  category = "flores",
  status = "publicado",
  campaigns = [],
  priority = 0,
}: {
  id:
    string;

  category?:
    string;

  status?:
    string;

  campaigns?:
    string[];

  priority?:
    number;
}): Product => ({
  id,

  title:
    id,

  description:
    `Producto ${id}`,

  category,

  price_1:
    10,

  stock:
    10,

  img:
    `/${id}.jpg`,

  status,

  campaigns,

  priority,
});

const CAMPAIGNS =
  [
    {
      id:
        "camp-a",

      name:
        "Campaña A",

      priority:
        100,
    },

    {
      id:
        "camp-b",

      name:
        "Campaña B",

      priority:
        90,
    },
  ] as unknown as Campaign[];

function createPublication({
  strategy,
  mode,
  productIds = [],
  categoryIds = [],
  campaignIds = [],
}: {
  strategy:
    "dynamic" |
    "fixed";

  mode:
    CatalogCompositionMode;

  productIds?:
    readonly string[];

  categoryIds?:
    readonly string[];

  campaignIds?:
    readonly string[];
}): CatalogPublicPublication {
  const base =
    createEmptyCatalogComposition(
      mode,
    );

  return {
    publicId:
      "PUB-TEST",

    composition: {
      ...base,

      filters: {
        ...base.filters,

        categoryIds: [
          ...categoryIds,
        ],

        campaignIds: [
          ...campaignIds,
        ],
      },
    },

    publicationIdentity:
      createDefaultCatalogPublicationIdentity(
        "Catálogo personalizado",
      ),

    publication: {
      strategy,

      productIds: [
        ...productIds,
      ],

      publishedAt:
        "2026-08-13T20:00:00.000Z",

      validUntil:
        "2026-08-20T20:00:00.000Z",

      version:
        1,
    },

    version:
      CATALOG_PUBLIC_PUBLICATION_VERSION,
  };
}

const ids = (
  products:
    readonly Product[],
): string[] =>
  products.map(
    (currentProduct) =>
      currentProduct.id,
  );

describe(
  "CatalogPublicPublicationSelection",
  () => {
    it(
      "dynamic reevalúa la composición contra el catálogo actual",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "dynamic",

                mode:
                  "automatic",

                categoryIds: [
                  "flores",
                ],
              }),

            products: [
              product({
                id:
                  "FLOR-001",
              }),

              product({
                id:
                  "FLOR-NEW",
              }),

              product({
                id:
                  "PELU-001",

                category:
                  "peluches",
              }),
            ],

            campaigns:
              [],
          });

        expect(
          ids(
            result.products,
          ),
        ).toEqual([
          "FLOR-001",
          "FLOR-NEW",
        ]);
      },
    );

    it(
      "dynamic respeta la política comercial actual",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "dynamic",

                mode:
                  "automatic",

                categoryIds: [
                  "flores",
                ],
              }),

            products: [
              product({
                id:
                  "VISIBLE",
              }),

              product({
                id:
                  "OCULTO",

                status:
                  "oculto",
              }),

              product({
                id:
                  "BORRADOR",

                status:
                  "borrador",
              }),
            ],

            campaigns:
              [],
          });

        expect(
          ids(
            result.products,
          ),
        ).toEqual([
          "VISIBLE",
        ]);
      },
    );

    it(
      "fixed utiliza únicamente los IDs congelados en el snapshot",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "fixed",

                mode:
                  "manual",

                productIds: [
                  "PELU-001",
                  "FLOR-001",
                ],

                categoryIds: [
                  "flores",
                ],
              }),

            products: [
              product({
                id:
                  "FLOR-001",
              }),

              product({
                id:
                  "FLOR-NEW",
              }),

              product({
                id:
                  "PELU-001",

                category:
                  "peluches",
              }),
            ],

            campaigns:
              [],
          });

        expect(
          ids(
            result.products,
          ),
        ).toEqual([
          "PELU-001",
          "FLOR-001",
        ]);
      },
    );

    it(
      "fixed no agrega productos nuevos aunque coincidan con filtros originales",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "fixed",

                mode:
                  "hybrid",

                productIds: [
                  "FLOR-001",
                ],

                categoryIds: [
                  "flores",
                ],
              }),

            products: [
              product({
                id:
                  "FLOR-001",
              }),

              product({
                id:
                  "FLOR-NEW",
              }),
            ],

            campaigns:
              [],
          });

        expect(
          ids(
            result.products,
          ),
        ).toEqual([
          "FLOR-001",
        ]);
      },
    );

    it(
      "fixed elimina productos inexistentes",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "fixed",

                mode:
                  "manual",

                productIds: [
                  "FLOR-001",
                  "NO-EXISTE",
                  "PELU-001",
                ],
              }),

            products: [
              product({
                id:
                  "FLOR-001",
              }),

              product({
                id:
                  "PELU-001",

                category:
                  "peluches",
              }),
            ],

            campaigns:
              [],
          });

        expect(
          ids(
            result.products,
          ),
        ).toEqual([
          "FLOR-001",
          "PELU-001",
        ]);
      },
    );

    it(
      "fixed elimina productos que dejaron de ser públicos",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "fixed",

                mode:
                  "manual",

                productIds: [
                  "VISIBLE",
                  "OCULTO",
                  "BORRADOR",
                ],
              }),

            products: [
              product({
                id:
                  "VISIBLE",
              }),

              product({
                id:
                  "OCULTO",

                status:
                  "oculto",
              }),

              product({
                id:
                  "BORRADOR",

                status:
                  "borrador",
              }),
            ],

            campaigns:
              [],
          });

        expect(
          ids(
            result.products,
          ),
        ).toEqual([
          "VISIBLE",
        ]);
      },
    );

    it(
      "fixed conserva el orden del snapshot con cero o una campaña",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "fixed",

                mode:
                  "manual",

                productIds: [
                  "P-3",
                  "P-1",
                  "P-2",
                ],

                campaignIds: [
                  "camp-a",
                ],
              }),

            products: [
              product({
                id:
                  "P-1",

                campaigns: [
                  "camp-a",
                ],
              }),

              product({
                id:
                  "P-2",

                campaigns: [
                  "camp-a",
                ],
              }),

              product({
                id:
                  "P-3",

                campaigns: [
                  "camp-a",
                ],
              }),
            ],

            campaigns:
              CAMPAIGNS,
          });

        expect(
          ids(
            result.products,
          ),
        ).toEqual([
          "P-3",
          "P-1",
          "P-2",
        ]);
      },
    );

    it(
      "dos campañas aplican mixer sin cambiar el conjunto",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "fixed",

                mode:
                  "manual",

                productIds: [
                  "A-LOW",
                  "B-LOW",
                  "A-HIGH",
                  "B-HIGH",
                ],

                campaignIds: [
                  "camp-a",
                  "camp-b",
                ],
              }),

            products: [
              product({
                id:
                  "A-LOW",

                campaigns: [
                  "camp-a",
                ],

                priority:
                  10,
              }),

              product({
                id:
                  "B-LOW",

                campaigns: [
                  "camp-b",
                ],

                priority:
                  20,
              }),

              product({
                id:
                  "A-HIGH",

                campaigns: [
                  "camp-a",
                ],

                priority:
                  100,
              }),

              product({
                id:
                  "B-HIGH",

                campaigns: [
                  "camp-b",
                ],

                priority:
                  90,
              }),
            ],

            campaigns:
              CAMPAIGNS,
          });

        expect(
          ids(
            result.products,
          ),
        ).toEqual([
          "A-HIGH",
          "B-HIGH",
          "A-LOW",
          "B-LOW",
        ]);

        expect(
          new Set(
            ids(
              result.products,
            ),
          ).size,
        ).toBe(
          4,
        );
      },
    );

    it(
      "producto multicampaña nunca se duplica",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "fixed",

                mode:
                  "manual",

                productIds: [
                  "AMBAS",
                  "SOLO-A",
                  "SOLO-B",
                ],

                campaignIds: [
                  "camp-a",
                  "camp-b",
                ],
              }),

            products: [
              product({
                id:
                  "AMBAS",

                campaigns: [
                  "camp-a",
                  "camp-b",
                ],

                priority:
                  100,
              }),

              product({
                id:
                  "SOLO-A",

                campaigns: [
                  "camp-a",
                ],
              }),

              product({
                id:
                  "SOLO-B",

                campaigns: [
                  "camp-b",
                ],
              }),
            ],

            campaigns:
              CAMPAIGNS,
          });

        expect(
          ids(
            result.products,
          ).filter(
            (id) =>
              id ===
              "AMBAS",
          ),
        ).toHaveLength(
          1,
        );

        expect(
          new Set(
            ids(
              result.products,
            ),
          ).size,
        ).toBe(
          3,
        );
      },
    );

    it(
      "calcula secciones desde las categorías finales visibles",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "fixed",

                mode:
                  "manual",

                productIds: [
                  "FLOR-001",
                  "PELU-001",
                  "OCULTO",
                ],
              }),

            products: [
              product({
                id:
                  "FLOR-001",

                category:
                  "flores",
              }),

              product({
                id:
                  "PELU-001",

                category:
                  "peluches",
              }),

              product({
                id:
                  "OCULTO",

                category:
                  "cajas",

                status:
                  "oculto",
              }),
            ],

            campaigns:
              [],
          });

        expect(
          result
            .effectiveCategoryIds,
        ).toEqual([
          "flores",
          "peluches",
        ]);

        expect(
          result
            .showCategorySections,
        ).toBe(
          true,
        );
      },
    );

    it(
      "fixed puede quedar vacío si ya no queda ningún producto publicable",
      () => {
        const result =
          resolveCatalogPublicPublicationSelection({
            publication:
              createPublication({
                strategy:
                  "fixed",

                mode:
                  "manual",

                productIds: [
                  "NO-EXISTE",
                ],
              }),

            products:
              [],

            campaigns:
              [],
          });

        expect(
          result.products,
        ).toEqual(
          [],
        );

        expect(
          result
            .effectiveCategoryIds,
        ).toEqual(
          [],
        );

        expect(
          result
            .showCategorySections,
        ).toBe(
          false,
        );
      },
    );
  },
);
