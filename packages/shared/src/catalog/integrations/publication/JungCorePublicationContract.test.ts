import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  isCatalogPublicationExpired,
} from "@wooly/contracts/catalog/domain/CatalogPublication";

import {
  sanitizeCatalogPublicPublication,
  type CatalogPublicPublication,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import {
  HttpCatalogPublicationProvider,
} from "./HttpCatalogPublicationProvider";

import {
  JUNG_CORE_PUBLIC_READ_RESPONSE,
  JUNG_CORE_PUBLISH_RESPONSE,
  JUNG_CORE_PUBLISH_STATUS,
} from "./JungCorePublicationFixtures";

/**
 * B4.6 / Contrato CORE ↔ WOOLY con respuestas reales de JUNG CORE.
 */
const READ_BASE =
  "https://core.example/public/catalog/publications";

function respond(
  body:
    unknown,

  status =
    200,
): Response {
  return new Response(
    JSON.stringify(
      body,
    ),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
      },
    },
  );
}

function provider() {
  return new HttpCatalogPublicationProvider({
    baseUrl:
      READ_BASE,

    publishBaseUrl:
      "/jung-core",
  });
}

const publication =
  JUNG_CORE_PUBLISH_RESPONSE.data
    .publication as unknown as CatalogPublicPublication;

describe(
  "Contrato JUNG CORE ↔ WOOLY (Public ID v1)",
  () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn(),
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it(
      "el recurso público de CORE pasa el sanitizador de WOOLY sin pérdida",
      () => {
        expect(
          sanitizeCatalogPublicPublication(
            JUNG_CORE_PUBLIC_READ_RESPONSE,
          ),
        ).toEqual(
          JUNG_CORE_PUBLIC_READ_RESPONSE,
        );

        expect(
          JUNG_CORE_PUBLIC_READ_RESPONSE,
        ).toEqual(
          publication,
        );
      },
    );

    it(
      "publish desenvuelve el sobre 201 de CORE",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            respond(
              JUNG_CORE_PUBLISH_RESPONSE,
              JUNG_CORE_PUBLISH_STATUS,
            ),
          );

        await expect(
          provider().publish({
            brandId:
              "6f0d3b8e-2a71-4f5c-9a3e-1c2b3d4e5f60",

            requestId:
              "3f6c1e2a-9b4d-4c7e-8a1f-2d3e4f5a6b7c",

            composition:
              publication.composition,

            publicationIdentity:
              publication.publicationIdentity,

            resolvedProductIds:
              publication.publication.productIds,
          }),
        ).resolves.toEqual(
          publication,
        );
      },
    );

    it(
      "getByPublicId acepta la lectura pública de CORE",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            respond(
              JUNG_CORE_PUBLIC_READ_RESPONSE,
            ),
          );

        await expect(
          provider().getByPublicId(
            JUNG_CORE_PUBLIC_READ_RESPONSE.publicId,
          ),
        ).resolves.toEqual(
          publication,
        );

        expect(
          vi.mocked(fetch)
            .mock
            .calls[0]?.[0],
        ).toBe(
          `${READ_BASE}/${JUNG_CORE_PUBLIC_READ_RESPONSE.publicId}`,
        );
      },
    );

    it(
      "el vencimiento de WOOLY coincide con CORE (validUntil <= now)",
      () => {
        const snapshot =
          publication.publication;

        expect(
          isCatalogPublicationExpired(
            snapshot,
            new Date(
              Date.parse(
                snapshot.validUntil,
              ) - 1,
            ),
          ),
        ).toBe(
          false,
        );

        expect(
          isCatalogPublicationExpired(
            snapshot,
            new Date(
              snapshot.validUntil,
            ),
          ),
        ).toBe(
          true,
        );
      },
    );

    it.each([
      [410, "HTTP_410", "CATALOG_PUBLICATION_REVOKED"],
      [409, "HTTP_409", "CATALOG_PUBLICATION_IDEMPOTENCY_CONFLICT"],
      [503, "HTTP_5XX", "CATALOG_PUBLICATION_UNAVAILABLE"],
    ] as const)(
      "traduce el error %i de CORE a %s",
      async (
        status,
        code,
        errorCode,
      ) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            respond(
              {
                success:
                  false,
                errorCode,
                message:
                  "x",
                statusCode:
                  status,
              },
              status,
            ),
          );

        await expect(
          provider().getByPublicId(
            JUNG_CORE_PUBLIC_READ_RESPONSE.publicId,
          ),
        ).rejects.toMatchObject({
          code,
          status,
        });
      },
    );
  },
);
