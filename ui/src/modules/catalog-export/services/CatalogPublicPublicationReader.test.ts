import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createEmptyCatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import {
  CATALOG_PUBLIC_PUBLICATION_VERSION,
  type CatalogPublicPublication,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import {
  createDefaultCatalogPublicationIdentity,
} from "@wooly/contracts/catalog/domain/CatalogPublicationIdentity";

import type {
  CatalogPublicationProvider,
} from "@wooly/shared/catalog/providers/CatalogPublicationProvider";

import {
  createCatalogPublicPublicationReaderInitialState,
  readCatalogPublicPublication,
} from "./CatalogPublicPublicationReader";

const createValidPublication = (
  overrides:
    Partial<CatalogPublicPublication> = {},
): CatalogPublicPublication => ({
  publicId:
    "PUB-AbC123",

  composition:
    createEmptyCatalogComposition(
      "automatic",
    ),

  publicationIdentity:
    createDefaultCatalogPublicationIdentity(
      "Catálogo cliente",
    ),

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

  ...overrides,
});

const createProvider = (
  getByPublicId:
    CatalogPublicationProvider["getByPublicId"],
): CatalogPublicationProvider => ({
  source:
    "test",

  publish:
    async () => {
      throw new Error(
        "publish no participa en estos tests",
      );
    },

  getByPublicId,
});

describe(
  "CatalogPublicPublicationReader",
  () => {
    it(
      "permanece idle sin Public ID y no consulta provider",
      async () => {
        const getByPublicId =
          vi.fn(
            async () =>
              createValidPublication(),
          );

        const provider =
          createProvider(
            getByPublicId,
          );

        const result =
          await readCatalogPublicPublication({
            publicId:
              "   ",

            provider,
          });

        expect(
          result,
        ).toEqual({
          status:
            "idle",

          publication:
            null,
        });

        expect(
          getByPublicId,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "declara unavailable cuando todavía no existe provider público",
      async () => {
        expect(
          await readCatalogPublicPublication({
            publicId:
              "PUB-AbC123",

            provider:
              null,
          }),
        ).toEqual({
          status:
            "unavailable",

          publication:
            null,
        });
      },
    );

    it(
      "declara loading como estado inicial cuando existe provider",
      () => {
        const provider =
          createProvider(
            async () =>
              createValidPublication(),
          );

        expect(
          createCatalogPublicPublicationReaderInitialState(
            "PUB-AbC123",
            provider,
          ),
        ).toEqual({
          status:
            "loading",

          publication:
            null,
        });
      },
    );

    it(
      "declara not-found cuando el provider responde null",
      async () => {
        const result =
          await readCatalogPublicPublication({
            publicId:
              "PUB-AbC123",

            provider:
              createProvider(
                async () =>
                  null,
              ),
          });

        expect(
          result,
        ).toEqual({
          status:
            "not-found",

          publication:
            null,
        });
      },
    );

    it(
      "declara error cuando el provider falla",
      async () => {
        const result =
          await readCatalogPublicPublication({
            publicId:
              "PUB-AbC123",

            provider:
              createProvider(
                async () => {
                  throw new Error(
                    "fallo remoto",
                  );
                },
              ),
          });

        expect(
          result,
        ).toEqual({
          status:
            "error",

          publication:
            null,
        });
      },
    );

    it(
      "declara error ante un recurso remoto inválido",
      async () => {
        const invalidResource =
          {
            publicId:
              "PUB-AbC123",

            version:
              999,
          } as unknown as CatalogPublicPublication;

        const result =
          await readCatalogPublicPublication({
            publicId:
              "PUB-AbC123",

            provider:
              createProvider(
                async () =>
                  invalidResource,
              ),
          });

        expect(
          result,
        ).toEqual({
          status:
            "error",

          publication:
            null,
        });
      },
    );

    it(
      "rechaza un recurso válido asociado a otro Public ID",
      async () => {
        const result =
          await readCatalogPublicPublication({
            publicId:
              "PUB-AbC123",

            provider:
              createProvider(
                async () =>
                  createValidPublication({
                    publicId:
                      "PUB-OTHER",
                  }),
              ),
          });

        expect(
          result,
        ).toEqual({
          status:
            "error",

          publication:
            null,
        });
      },
    );

    it(
      "declara revoked cuando JUNG CORE responde 410",
      async () => {
        const result =
          await readCatalogPublicPublication({
            publicId:
              "PUB-AbC123",

            provider:
              createProvider(
                async () => {
                  throw Object.assign(
                    new Error(
                      "HTTP 410",
                    ),
                    {
                      code:
                        "HTTP_410",
                      status:
                        410,
                    },
                  );
                },
              ),
          });

        expect(
          result,
        ).toEqual({
          status:
            "revoked",

          publication:
            null,
        });
      },
    );

    it(
      "declara expired cuando validUntil ya venció",
      async () => {
        const result =
          await readCatalogPublicPublication({
            publicId:
              "PUB-AbC123",

            provider:
              createProvider(
                async () =>
                  createValidPublication(),
              ),

            now:
              new Date(
                "2026-08-21T00:00:00.000Z",
              ),
          });

        expect(
          result,
        ).toEqual({
          status:
            "expired",

          publication:
            null,
        });
      },
    );

    it(
      "declara ready únicamente para una publicación válida y vigente",
      async () => {
        const result =
          await readCatalogPublicPublication({
            publicId:
              "PUB-AbC123",

            provider:
              createProvider(
                async () =>
                  createValidPublication(),
              ),

            now:
              new Date(
                "2026-08-14T00:00:00.000Z",
              ),
          });

        expect(
          result.status,
        ).toBe(
          "ready",
        );

        expect(
          result.publication,
        ).toMatchObject({
          publicId:
            "PUB-AbC123",

          version:
            1,
        });
      },
    );

    it(
      "recorta espacios sin alterar mayúsculas ni minúsculas del Public ID",
      async () => {
        const getByPublicId =
          vi.fn(
            async () =>
              createValidPublication(),
          );

        const result =
          await readCatalogPublicPublication({
            publicId:
              "  PUB-AbC123  ",

            provider:
              createProvider(
                getByPublicId,
              ),

            now:
              new Date(
                "2026-08-14T00:00:00.000Z",
              ),
          });

        expect(
          getByPublicId,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          getByPublicId,
        ).toHaveBeenCalledWith(
          "PUB-AbC123",
        );

        expect(
          result.publication
            ?.publicId,
        ).toBe(
          "PUB-AbC123",
        );
      },
    );
  },
);
