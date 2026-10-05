import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
  sanitizeCatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  CATALOG_PUBLIC_PUBLICATION_VERSION,
  sanitizeCatalogPublicPublication,
  type CatalogPublicPublication,
} from "@/modules/catalog/domain/CatalogPublicPublication";

import {
  createDefaultCatalogPublicationIdentity,
} from "@/modules/catalog/domain/CatalogPublicationIdentity";

type ExpectedPublicPublicationKeys =
  | "publicId"
  | "composition"
  | "publicationIdentity"
  | "publication"
  | "version";

type MissingPublicPublicationKeys =
  Exclude<
    ExpectedPublicPublicationKeys,
    keyof CatalogPublicPublication
  >;

type UnexpectedPublicPublicationKeys =
  Exclude<
    keyof CatalogPublicPublication,
    ExpectedPublicPublicationKeys
  >;

const HAS_ALL_PUBLIC_KEYS:
  [MissingPublicPublicationKeys] extends [never]
    ? true
    : false =
  true;

const HAS_NO_PRIVATE_KEYS:
  [UnexpectedPublicPublicationKeys] extends [never]
    ? true
    : false =
  true;

describe(
  "CatalogPublicPublication",
  () => {
    it(
      "congela la versión pública en 1",
      () => {
        expect(
          CATALOG_PUBLIC_PUBLICATION_VERSION,
        ).toBe(
          1,
        );
      },
    );

    it(
      "expone únicamente el contrato público aprobado",
      () => {
        expect(
          HAS_ALL_PUBLIC_KEYS,
        ).toBe(
          true,
        );

        expect(
          HAS_NO_PRIVATE_KEYS,
        ).toBe(
          true,
        );

        const resource:
          CatalogPublicPublication =
        {
          publicId:
            "PUB-AbC123",

          composition:
            createEmptyCatalogComposition(
              "hybrid",
            ),

          publicationIdentity:
            createDefaultCatalogPublicationIdentity(
              "Catálogo cliente",
            ),

          publication: {
            strategy:
              "fixed",

            productIds: [
              "P-1",
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

        expect(
          Object.keys(
            resource,
          ).sort(),
        ).toEqual(
          [
            "composition",
            "publicId",
            "publication",
            "publicationIdentity",
            "version",
          ],
        );

        expect(
          resource,
        ).not.toHaveProperty(
          "draftId",
        );

        expect(
          resource,
        ).not.toHaveProperty(
          "name",
        );

        expect(
          resource,
        ).not.toHaveProperty(
          "status",
        );

        expect(
          resource,
        ).not.toHaveProperty(
          "createdAt",
        );

        expect(
          resource,
        ).not.toHaveProperty(
          "updatedAt",
        );
      },
    );

    it(
      "acepta la semántica dynamic existente sin inventar otro snapshot",
      () => {
        const resource:
          CatalogPublicPublication =
        {
          publicId:
            "PUB-DYNAMIC",

          composition:
            createEmptyCatalogComposition(
              "automatic",
            ),

          publicationIdentity:
            createDefaultCatalogPublicationIdentity(),

          publication: {
            strategy:
              "dynamic",

            productIds:
              [],

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

        expect(
          resource.publication.strategy,
        ).toBe(
          "dynamic",
        );

        expect(
          resource.publication.productIds,
        ).toEqual(
          [],
        );
      },
    );
  },
);
describe(
  "sanitizeCatalogComposition",
  () => {
    it(
      "normaliza y deduplica la composición sin cambiar su semántica",
      () => {
        expect(
          sanitizeCatalogComposition({
            mode:
              "hybrid",

            filters: {
              categoryIds: [
                " flores ",
                "flores",
                "",
                "peluches",
              ],

              campaignIds: [
                " premium ",
                "premium",
              ],

              attributes: {
                colors: [
                  " rojo ",
                  "rojo",
                ],

                tags: [
                  " nuevo ",
                  "nuevo",
                ],
              },
            },

            overrides: {
              includedProductIds: [
                " P-1 ",
                "P-1",
              ],

              excludedProductIds: [
                " P-2 ",
                "P-2",
              ],
            },
          }),
        ).toEqual({
          mode:
            "hybrid",

          filters: {
            categoryIds: [
              "flores",
              "peluches",
            ],

            campaignIds: [
              "premium",
            ],

            sourceOperator:
              "intersection",

            attributes: {
              colors: [
                "rojo",
              ],

              tags: [
                "nuevo",
              ],
            },
          },

          overrides: {
            includedProductIds: [
              "P-1",
            ],

            excludedProductIds: [
              "P-2",
            ],
          },
        });
      },
    );

    it(
      "rechaza una composición estructuralmente inválida",
      () => {
        expect(
          sanitizeCatalogComposition({
            mode:
              "automatic",

            filters: {
              categoryIds:
                "flores",

              campaignIds:
                [],
            },

            overrides: {
              includedProductIds:
                [],

              excludedProductIds:
                [],
            },
          }),
        ).toBeNull();
      },
    );
  },
);

const validFixedResource = {
  publicId:
    " PUB-AbC123 ",

  composition: {
    mode:
      "hybrid",

    filters: {
      categoryIds: [
        " flores ",
        "flores",
      ],

      campaignIds:
        [],

      attributes: {
        colors:
          [],

        tags:
          [],
      },
    },

    overrides: {
      includedProductIds: [
        " P-1 ",
      ],

      excludedProductIds:
        [],
    },
  },

  publicationIdentity: {
    title:
      " Catálogo cliente ",

    description:
      " Selección especial ",

    cover: {
      strategy:
        "auto",

      customImageUrl:
        "",
    },
  },

  publication: {
    strategy:
      "fixed",

    productIds: [
      " P-1 ",
      "P-1",
    ],

    publishedAt:
      "2026-08-13T20:00:00.000Z",

    validUntil:
      "2026-08-20T20:00:00.000Z",

    version:
      1,
  },

  version:
    1,
} as const;

describe(
  "sanitizeCatalogPublicPublication",
  () => {
    it(
      "acepta una publicación fixed válida y normaliza sus subcontratos",
      () => {
        const result =
          sanitizeCatalogPublicPublication(
            validFixedResource,
          );

        expect(
          result,
        ).not.toBeNull();

        expect(
          result?.publicId,
        ).toBe(
          "PUB-AbC123",
        );

        expect(
          result?.publicationIdentity.title,
        ).toBe(
          "Catálogo cliente",
        );

        expect(
          result?.composition.filters.categoryIds,
        ).toEqual([
          "flores",
        ]);

        expect(
          result?.publication.productIds,
        ).toEqual([
          "P-1",
        ]);
      },
    );

    it(
      "acepta automatic con snapshot dynamic",
      () => {
        const result =
          sanitizeCatalogPublicPublication({
            ...validFixedResource,

            publicId:
              "PUB-DYNAMIC",

            composition:
              createEmptyCatalogComposition(
                "automatic",
              ),

            publication: {
              ...validFixedResource.publication,

              strategy:
                "dynamic",

              productIds: [
                "IGNORADO",
              ],
            },
          });

        expect(
          result?.publication.strategy,
        ).toBe(
          "dynamic",
        );

        expect(
          result?.publication.productIds,
        ).toEqual(
          [],
        );
      },
    );

    it(
      "rechaza una versión pública futura",
      () => {
        expect(
          sanitizeCatalogPublicPublication({
            ...validFixedResource,
            version:
              2,
          }),
        ).toBeNull();
      },
    );

    it(
      "rechaza Public ID vacío",
      () => {
        expect(
          sanitizeCatalogPublicPublication({
            ...validFixedResource,
            publicId:
              "   ",
          }),
        ).toBeNull();
      },
    );

    it(
      "preserva mayúsculas y minúsculas del Public ID",
      () => {
        expect(
          sanitizeCatalogPublicPublication(
            validFixedResource,
          )?.publicId,
        ).toBe(
          "PUB-AbC123",
        );
      },
    );

    it(
      "rechaza una composición inválida",
      () => {
        expect(
          sanitizeCatalogPublicPublication({
            ...validFixedResource,

            composition: {
              ...validFixedResource.composition,

              mode:
                "desconocido",
            },
          }),
        ).toBeNull();
      },
    );

    it(
      "rechaza una identidad pública inválida",
      () => {
        expect(
          sanitizeCatalogPublicPublication({
            ...validFixedResource,

            publicationIdentity: {
              ...validFixedResource.publicationIdentity,

              cover: {
                strategy:
                  "invalid",

                customImageUrl:
                  "",
              },
            },
          }),
        ).toBeNull();
      },
    );

    it(
      "rechaza un snapshot inválido",
      () => {
        expect(
          sanitizeCatalogPublicPublication({
            ...validFixedResource,

            publication: {
              ...validFixedResource.publication,

              productIds:
                [],
            },
          }),
        ).toBeNull();
      },
    );

    it(
      "rechaza automatic con estrategia fixed",
      () => {
        expect(
          sanitizeCatalogPublicPublication({
            ...validFixedResource,

            composition:
              createEmptyCatalogComposition(
                "automatic",
              ),
          }),
        ).toBeNull();
      },
    );

    it(
      "rechaza hybrid con estrategia dynamic",
      () => {
        expect(
          sanitizeCatalogPublicPublication({
            ...validFixedResource,

            publication: {
              ...validFixedResource.publication,

              strategy:
                "dynamic",
            },
          }),
        ).toBeNull();
      },
    );

    it(
      "rechaza manual con estrategia dynamic",
      () => {
        expect(
          sanitizeCatalogPublicPublication({
            ...validFixedResource,

            composition:
              createEmptyCatalogComposition(
                "manual",
              ),

            publication: {
              ...validFixedResource.publication,

              strategy:
                "dynamic",
            },
          }),
        ).toBeNull();
      },
    );

    it(
      "descarta campos privados al reconstruir el recurso público",
      () => {
        const result =
          sanitizeCatalogPublicPublication({
            ...validFixedResource,

            draftId:
              "CAT-INTERNO",

            name:
              "Nombre privado",

            status:
              "published",

            createdAt:
              "2026-08-01T00:00:00.000Z",

            updatedAt:
              "2026-08-13T00:00:00.000Z",
          });

        expect(
          result,
        ).not.toBeNull();

        expect(
          Object.keys(
            result ?? {},
          ).sort(),
        ).toEqual([
          "composition",
          "publicId",
          "publication",
          "publicationIdentity",
          "version",
        ]);

        expect(
          result,
        ).not.toHaveProperty(
          "draftId",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "name",
        );
      },
    );
  },
);
