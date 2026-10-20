import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createEmptyCatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import {
  createDefaultCatalogPublicationIdentity,
} from "@wooly/contracts/catalog/domain/CatalogPublicationIdentity";

import {
  HttpCatalogPublicationProvider,
  HttpCatalogPublicationProviderError,
} from "./HttpCatalogPublicationProvider";

const HTTPS_URL =
  "https://api.example.com/catalog-publications/";

const FIXED_PUBLICATION = {
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
      "2026-08-14T05:00:00.000Z",

    validUntil:
      "2026-08-21T05:00:00.000Z",

    version:
      1,
  },

  version:
    1,
} as const;

function jsonResponse(
  body:
    string,

  status = 200,

  contentType =
    "application/json",
): Response {
  return new Response(
    body,

    {
      status,

      headers: {
        "content-type":
          contentType,
      },
    },
  );
}

function abortableFetch() {
  return vi.fn(
    (
      _input:
        RequestInfo |
        URL,

      init?:
        RequestInit,
    ) =>
      new Promise<Response>(
        (
          _resolve,
          reject,
        ) => {
          init?.signal
            ?.addEventListener(
              "abort",

              () =>
                reject(
                  new DOMException(
                    "Aborted",
                    "AbortError",
                  ),
                ),

              {
                once:
                  true,
              },
            );
        },
      ),
  );
}

async function captureProviderError(
  action:
    () => Promise<unknown>,
): Promise<HttpCatalogPublicationProviderError> {
  let caught:
    unknown;

  try {
    await action();
  } catch (cause: unknown) {
    caught =
      cause;
  }

  expect(
    caught,
  ).toBeInstanceOf(
    HttpCatalogPublicationProviderError,
  );

  return caught as
    HttpCatalogPublicationProviderError;
}

function captureConfigurationError(
  create:
    () => unknown,
): HttpCatalogPublicationProviderError {
  let caught:
    unknown;

  try {
    create();
  } catch (cause: unknown) {
    caught =
      cause;
  }

  expect(
    caught,
  ).toBeInstanceOf(
    HttpCatalogPublicationProviderError,
  );

  return caught as
    HttpCatalogPublicationProviderError;
}

describe(
  "HttpCatalogPublicationProvider",
  () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn(),
      );
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it(
      "publica por POST JSON sin enviar identidad remota",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify(
                FIXED_PUBLICATION,
              ),
            ),
          );

        const provider =
          new HttpCatalogPublicationProvider({
            baseUrl:
              HTTPS_URL,
          });

        await expect(
          provider.publish({
            composition:
              FIXED_PUBLICATION.composition,

            publicationIdentity:
              FIXED_PUBLICATION.publicationIdentity,

            resolvedProductIds: [
              "P-1",
            ],

            validityDays:
              7,
          }),
        ).resolves.toEqual(
          FIXED_PUBLICATION,
        );

        expect(
          fetch,
        ).toHaveBeenCalledTimes(
          1,
        );

        const [
          url,
          init,
        ] =
          vi.mocked(fetch)
            .mock
            .calls[0];

        expect(
          url,
        ).toBe(
          "https://api.example.com/catalog-publications",
        );

        expect(
          init?.method,
        ).toBe(
          "POST",
        );

        expect(
          init?.headers,
        ).toEqual({
          "content-type":
            "application/json",
        });

        const body =
          JSON.parse(
            String(
              init?.body,
            ),
          ) as Record<string, unknown>;

        expect(
          body,
        ).toEqual({
          composition:
            FIXED_PUBLICATION.composition,

          publicationIdentity:
            FIXED_PUBLICATION.publicationIdentity,

          resolvedProductIds: [
            "P-1",
          ],

          validityDays:
            7,
        });

        expect(
          body,
        ).not.toHaveProperty(
          "publicId",
        );

        expect(
          body,
        ).not.toHaveProperty(
          "publishedAt",
        );

        expect(
          body,
        ).not.toHaveProperty(
          "validUntil",
        );

        expect(
          body,
        ).not.toHaveProperty(
          "version",
        );
      },
    );

    it(
      "omite validityDays cuando no fue especificado",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify(
                FIXED_PUBLICATION,
              ),
            ),
          );

        const provider =
          new HttpCatalogPublicationProvider({
            baseUrl:
              HTTPS_URL,
          });

        await provider.publish({
          composition:
            FIXED_PUBLICATION.composition,

          publicationIdentity:
            FIXED_PUBLICATION.publicationIdentity,

          resolvedProductIds: [
            "P-1",
          ],
        });

        const init =
          vi.mocked(fetch)
            .mock
            .calls[0]?.[1];

        const body =
          JSON.parse(
            String(
              init?.body,
            ),
          ) as Record<string, unknown>;

        expect(
          body,
        ).not.toHaveProperty(
          "validityDays",
        );
      },
    );

    it(
      "lee por Public ID codificado y conserva GET implícito",
      async () => {
        const publication = {
          ...FIXED_PUBLICATION,

          publicId:
            "PUB A/B",
        };

        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify(
                publication,
              ),
            ),
          );

        const provider =
          new HttpCatalogPublicationProvider({
            baseUrl:
              HTTPS_URL,
          });

        await expect(
          provider.getByPublicId(
            " PUB A/B ",
          ),
        ).resolves.toEqual(
          publication,
        );

        const [
          url,
          init,
        ] =
          vi.mocked(fetch)
            .mock
            .calls[0];

        expect(
          url,
        ).toBe(
          "https://api.example.com/catalog-publications/PUB%20A%2FB",
        );

        expect(
          init,
        ).not.toHaveProperty(
          "method",
        );

        expect(
          init,
        ).not.toHaveProperty(
          "body",
        );
      },
    );

    it(
      "convierte HTTP 404 de lectura en null",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              "{}",
              404,
            ),
          );

        await expect(
          new HttpCatalogPublicationProvider({
            baseUrl:
              HTTPS_URL,
          }).getByPublicId(
            "PUB-404",
          ),
        ).resolves.toBeNull();
      },
    );

    it(
      "mantiene HTTP 404 de publicación como error",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              "{}",
              404,
            ),
          );

        const error =
          await captureProviderError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,
              }).publish({
                composition:
                  FIXED_PUBLICATION.composition,

                publicationIdentity:
                  FIXED_PUBLICATION.publicationIdentity,

                resolvedProductIds: [
                  "P-1",
                ],
              }),
          );

        expect(
          error,
        ).toMatchObject({
          code:
            "HTTP_404",

          status:
            404,

          retryable:
            false,
        });
      },
    );

    it.each([
      [401, "HTTP_401", false],
      [403, "HTTP_403", false],
      [409, "HTTP_409", false],
      [422, "HTTP_422", false],
      [429, "HTTP_429", true],
      [500, "HTTP_5XX", true],
      [503, "HTTP_5XX", true],
    ] as const)(
      "traduce HTTP %i como %s",

      async (
        status,
        code,
        retryable,
      ) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              "{}",
              status,
            ),
          );

        const error =
          await captureProviderError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,
              }).publish({
                composition:
                  FIXED_PUBLICATION.composition,

                publicationIdentity:
                  FIXED_PUBLICATION.publicationIdentity,

                resolvedProductIds: [
                  "P-1",
                ],
              }),
          );

        expect(
          error,
        ).toMatchObject({
          code,
          status,
          retryable,
        });
      },
    );

    it(
      "traduce timeout como HTTP_TIMEOUT recuperable",
      async () => {
        vi.useFakeTimers();

        vi.stubGlobal(
          "fetch",
          abortableFetch(),
        );

        const provider =
          new HttpCatalogPublicationProvider({
            baseUrl:
              HTTPS_URL,

            timeoutMs:
              20,
          });

        const request =
          captureProviderError(
            () =>
              provider.getByPublicId(
                "PUB-AbC123",
              ),
          );

        await vi
          .advanceTimersByTimeAsync(
            20,
          );

        const error =
          await request;

        expect(
          error,
        ).toMatchObject({
          code:
            "HTTP_TIMEOUT",

          retryable:
            true,
        });
      },
    );

    it(
      "traduce error de red como HTTP_NETWORK_ERROR recuperable",
      async () => {
        vi.mocked(fetch)
          .mockRejectedValue(
            new TypeError(
              "Failed to fetch",
            ),
          );

        const error =
          await captureProviderError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,
              }).getByPublicId(
                "PUB-AbC123",
              ),
          );

        expect(
          error,
        ).toMatchObject({
          code:
            "HTTP_NETWORK_ERROR",

          retryable:
            true,
        });
      },
    );

    it(
      "traduce cancelación externa como UNKNOWN_ERROR no recuperable",
      async () => {
        vi.stubGlobal(
          "fetch",
          abortableFetch(),
        );

        const controller =
          new AbortController();

        const provider =
          new HttpCatalogPublicationProvider({
            baseUrl:
              HTTPS_URL,

            signal:
              controller.signal,
          });

        const request =
          captureProviderError(
            () =>
              provider.getByPublicId(
                "PUB-AbC123",
              ),
          );

        controller.abort();

        const error =
          await request;

        expect(
          error,
        ).toMatchObject({
          code:
            "UNKNOWN_ERROR",

          retryable:
            false,
        });
      },
    );

    it(
      "rechaza respuesta pública inválida",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify({
                publicId:
                  "PUB-INVALID",
              }),
            ),
          );

        const error =
          await captureProviderError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,
              }).getByPublicId(
                "PUB-INVALID",
              ),
          );

        expect(
          error,
        ).toMatchObject({
          code:
            "INVALID_PUBLICATION_RESPONSE",

          retryable:
            false,
        });
      },
    );

    it(
      "rechaza Public ID remoto diferente al solicitado",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify(
                FIXED_PUBLICATION,
              ),
            ),
          );

        const error =
          await captureProviderError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,
              }).getByPublicId(
                "PUB-DIFFERENT",
              ),
          );

        expect(
          error,
        ).toMatchObject({
          code:
            "PUBLIC_ID_MISMATCH",

          retryable:
            false,
        });
      },
    );

    it(
      "rechaza Public ID vacío sin hacer request",
      async () => {
        const provider =
          new HttpCatalogPublicationProvider({
            baseUrl:
              HTTPS_URL,
          });

        const error =
          await captureProviderError(
            () =>
              provider.getByPublicId(
                "   ",
              ),
          );

        expect(
          error.code,
        ).toBe(
          "CONFIGURATION_ERROR",
        );

        expect(
          fetch,
        ).not.toHaveBeenCalled();
      },
    );

    it.each([
      "",
      "no-es-url",
      "ftp://api.example.com/catalog-publications",
      "http://api.example.com/catalog-publications",
      "https://user:password@api.example.com/catalog-publications",
      "https://api.example.com/catalog-publications?tenant=wooly",
      "https://api.example.com/catalog-publications#fragment",
    ])(
      "rechaza URL insegura o inválida: %s",

      (
        baseUrl,
      ) => {
        const error =
          captureConfigurationError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl,
              }),
          );

        expect(
          error,
        ).toMatchObject({
          code:
            "CONFIGURATION_ERROR",

          retryable:
            false,
        });
      },
    );

    it(
      "permite HTTP solo con autorización explícita",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify(
                FIXED_PUBLICATION,
              ),
            ),
          );

        await expect(
          new HttpCatalogPublicationProvider({
            baseUrl:
              "http://localhost:3000/catalog-publications",

            allowInsecureHttp:
              true,
          }).getByPublicId(
            "PUB-AbC123",
          ),
        ).resolves.toEqual(
          FIXED_PUBLICATION,
        );
      },
    );

    it(
      "rechaza timeout no positivo",
      () => {
        const error =
          captureConfigurationError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,

                timeoutMs:
                  0,
              }),
          );

        expect(
          error.code,
        ).toBe(
          "CONFIGURATION_ERROR",
        );
      },
    );

    it(
      "propaga timeout y señal al cliente HTTP compartido",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify(
                FIXED_PUBLICATION,
              ),
            ),
          );

        const controller =
          new AbortController();

        await new HttpCatalogPublicationProvider({
          baseUrl:
            HTTPS_URL,

          timeoutMs:
            1500,

          signal:
            controller.signal,
        }).getByPublicId(
          "PUB-AbC123",
        );

        const init =
          vi.mocked(fetch)
            .mock
            .calls[0]?.[1];

        expect(
          init?.signal,
        ).toBeInstanceOf(
          AbortSignal,
        );
      },
    );
  },
);
