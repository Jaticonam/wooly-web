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

import type {
  PublishCatalogInput,
} from "../../providers/CatalogPublicationProvider";

const HTTPS_URL =
  "https://api.example.com/catalog-publications/";

const PUBLISH_BASE =
  "/jung-core";

const BRAND_ID =
  "brand wooly/1";

const REQUEST_ID =
  "3f6c1e2a-9b4d-4c7e-8a1f-2d3e4f5a6b7c";

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

function coreEnvelope(
  publication:
    unknown = FIXED_PUBLICATION,
): string {
  return JSON.stringify({
    success:
      true,

    message:
      "Catálogo publicado.",

    data: {
      publicId:
        (publication as { publicId: string })
          .publicId,

      status:
        "active",

      replayed:
        false,

      publication,

      revokedAt:
        null,

      notices:
        [],
    },
  });
}

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

function publishInput(
  overrides:
    Partial<PublishCatalogInput> = {},
): PublishCatalogInput {
  return {
    brandId:
      BRAND_ID,

    requestId:
      REQUEST_ID,

    composition:
      FIXED_PUBLICATION.composition,

    publicationIdentity:
      FIXED_PUBLICATION.publicationIdentity,

    resolvedProductIds: [
      "P-1",
    ],

    ...overrides,
  };
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
      "publica por POST en la ruta de marca de JUNG CORE con el contrato v1",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              coreEnvelope(),
              201,
            ),
          );

        const provider =
          new HttpCatalogPublicationProvider({
            baseUrl:
              HTTPS_URL,

            publishBaseUrl:
              `${PUBLISH_BASE}/`,
          });

        await expect(
          provider.publish({
            brandId:
              ` ${BRAND_ID} `,

            requestId:
              REQUEST_ID,

            sourceReference:
              " CAT-2026-3F6C1E2A ",

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
          "/jung-core/catalog-commercial/brands/brand%20wooly%2F1/catalog-publications",
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

        expect(
          init,
        ).not.toHaveProperty(
          "credentials",
        );

        const body =
          JSON.parse(
            String(
              init?.body,
            ),
          ) as Record<string, unknown>;

        expect(
          body,
        ).toEqual({
          contractVersion:
            "jung.catalog-publication.v1",

          appId:
            "wooly-web",

          requestId:
            REQUEST_ID,

          compositionSchema:
            "catalog-composition.v1",

          composition:
            FIXED_PUBLICATION.composition,

          publicationIdentity:
            FIXED_PUBLICATION.publicationIdentity,

          resolvedProductIds: [
            "P-1",
          ],

          validityDays:
            7,

          sourceReference:
            "CAT-2026-3F6C1E2A",
        });

        for (
          const forbidden
          of [
            "brandId",
            "publicId",
            "publishedAt",
            "validUntil",
            "strategy",
            "version",
            "createdById",
          ]
        ) {
          expect(
            body,
          ).not.toHaveProperty(
            forbidden,
          );
        }
      },
    );

    it(
      "acepta la repetición idempotente (200) de JUNG CORE",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              coreEnvelope(),
              200,
            ),
          );

        await expect(
          new HttpCatalogPublicationProvider({
            baseUrl:
              HTTPS_URL,

            publishBaseUrl:
              PUBLISH_BASE,
          }).publish(
            publishInput(),
          ),
        ).resolves.toEqual(
          FIXED_PUBLICATION,
        );
      },
    );

    it(
      "omite validityDays y sourceReference cuando no se especifican",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              coreEnvelope(),
            ),
          );

        await new HttpCatalogPublicationProvider({
          baseUrl:
            HTTPS_URL,

          publishBaseUrl:
            PUBLISH_BASE,
        }).publish(
          publishInput(),
        );

        const body =
          JSON.parse(
            String(
              vi.mocked(fetch)
                .mock
                .calls[0]?.[1]
                ?.body,
            ),
          ) as Record<string, unknown>;

        expect(
          body,
        ).not.toHaveProperty(
          "validityDays",
        );

        expect(
          body,
        ).not.toHaveProperty(
          "sourceReference",
        );
      },
    );

    it.each([
      [
        "recurso directo sin sobre",
        () => JSON.stringify(FIXED_PUBLICATION),
      ],
      [
        "sobre sin éxito",
        () =>
          JSON.stringify({
            success: false,
            data: { publicId: FIXED_PUBLICATION.publicId, publication: FIXED_PUBLICATION },
          }),
      ],
      [
        "publicación inválida en el sobre",
        () =>
          coreEnvelope({
            ...FIXED_PUBLICATION,
            version: 2,
          }),
      ],
    ])(
      "rechaza respuesta de publicación inválida: %s",
      async (
        _label,
        body,
      ) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              body(),
            ),
          );

        const error =
          await captureProviderError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,

                publishBaseUrl:
                  PUBLISH_BASE,
              }).publish(
                publishInput(),
              ),
          );

        expect(
          error.code,
        ).toBe(
          "INVALID_PUBLICATION_RESPONSE",
        );
      },
    );

    it(
      "rechaza un sobre cuyo publicId no coincide con el recurso",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify({
                success:
                  true,

                data: {
                  publicId:
                    "OTRO",

                  publication:
                    FIXED_PUBLICATION,
                },
              }),
            ),
          );

        const error =
          await captureProviderError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,

                publishBaseUrl:
                  PUBLISH_BASE,
              }).publish(
                publishInput(),
              ),
          );

        expect(
          error.code,
        ).toBe(
          "PUBLIC_ID_MISMATCH",
        );
      },
    );

    it.each([
      [
        "sin base Admin",
        {},
        publishInput(),
      ],
      [
        "sin marca",
        {
          publishBaseUrl:
            PUBLISH_BASE,
        },
        publishInput({
          brandId:
            "  ",
        }),
      ],
      [
        "requestId inválido",
        {
          publishBaseUrl:
            PUBLISH_BASE,
        },
        publishInput({
          requestId:
            "corto",
        }),
      ],
    ] as const)(
      "no envía la solicitud %s",
      async (
        _label,
        options,
        input,
      ) => {
        const error =
          await captureProviderError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,

                ...options,
              }).publish(
                input,
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
      "//evil.example/jung-core",
      "/jung-core?x=1",
      "http://core.example",
    ])(
      "rechaza la base Admin insegura %s",
      (
        publishBaseUrl,
      ) => {
        const error =
          captureConfigurationError(
            () =>
              new HttpCatalogPublicationProvider({
                baseUrl:
                  HTTPS_URL,

                publishBaseUrl,
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

                publishBaseUrl:
                  PUBLISH_BASE,
              }).publish(
                publishInput(),
              ),
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
      [400, "HTTP_400", false],
      [401, "HTTP_401", false],
      [403, "HTTP_403", false],
      [409, "HTTP_409", false],
      [410, "HTTP_410", false],
      [413, "HTTP_413", false],
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

                publishBaseUrl:
                  PUBLISH_BASE,
              }).publish(
                publishInput(),
              ),
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
