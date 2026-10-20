import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  shouldUseCatalogFallback,
} from "../../providers/CatalogFallbackPolicy";

import {
  HttpJungCoreSnapshotLoader,
  HttpJungCoreSnapshotLoaderError,
} from "./HttpJungCoreSnapshotLoader";

const HTTPS_URL =
  "https://core.example.com/catalog/snapshot";

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

async function captureLoaderError(
  loader:
    HttpJungCoreSnapshotLoader,
): Promise<
  HttpJungCoreSnapshotLoaderError
> {
  let caught:
    unknown;

  try {
    await loader
      .loadSnapshot();
  } catch (cause: unknown) {
    caught =
      cause;
  }

  expect(
    caught,
  ).toBeInstanceOf(
    HttpJungCoreSnapshotLoaderError,
  );

  return caught as
    HttpJungCoreSnapshotLoaderError;
}

function captureConfigurationError(
  create:
    () => unknown,
): HttpJungCoreSnapshotLoaderError {
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
    HttpJungCoreSnapshotLoaderError,
  );

  return caught as
    HttpJungCoreSnapshotLoaderError;
}

describe(
  "HttpJungCoreSnapshotLoader",
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
      "devuelve JSON sin validar el contrato de catalogo",
      async () => {
        const snapshot = {
          contractVersion:
            "catalog-snapshot.v1",

          brandId:
            "wooly",
        };

        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify(
                snapshot,
              ),
            ),
          );

        await expect(
          new HttpJungCoreSnapshotLoader({
            url:
              HTTPS_URL,
          }).loadSnapshot(),
        ).resolves.toEqual(
          snapshot,
        );

        expect(
          fetch,
        ).toHaveBeenCalledWith(
          HTTPS_URL,

          expect.objectContaining({
            signal:
              expect.any(
                AbortSignal,
              ),
          }),
        );
      },
    );

    it(
      "traduce timeout como recuperable",
      async () => {
        vi.useFakeTimers();

        vi.stubGlobal(
          "fetch",
          abortableFetch(),
        );

        const loader =
          new HttpJungCoreSnapshotLoader({
            url:
              HTTPS_URL,

            timeoutMs:
              20,
          });

        const request =
          captureLoaderError(
            loader,
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

        expect(
          shouldUseCatalogFallback(
            error,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "traduce errores de red como recuperables",
      async () => {
        vi.mocked(fetch)
          .mockRejectedValue(
            new TypeError(
              "Failed to fetch",
            ),
          );

        const error =
          await captureLoaderError(
            new HttpJungCoreSnapshotLoader({
              url:
                HTTPS_URL,
            }),
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

    it.each([
      [401, "HTTP_401", false],
      [403, "HTTP_403", false],
      [404, "HTTP_404", false],
      [502, "HTTP_502", true],
      [503, "HTTP_503", true],
      [504, "HTTP_504", true],
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
          await captureLoaderError(
            new HttpJungCoreSnapshotLoader({
              url:
                HTTPS_URL,
            }),
          );

        expect(
          error,
        ).toMatchObject({
          code,
          status,
          retryable,
        });

        expect(
          shouldUseCatalogFallback(
            error,
          ),
        ).toBe(
          retryable,
        );
      },
    );

    it(
      "bloquea estados HTTP no clasificados",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              "{}",
              500,
            ),
          );

        const error =
          await captureLoaderError(
            new HttpJungCoreSnapshotLoader({
              url:
                HTTPS_URL,
            }),
          );

        expect(
          error.code,
        ).toBe(
          "UNKNOWN_ERROR",
        );

        expect(
          shouldUseCatalogFallback(
            error,
          ),
        ).toBe(
          false,
        );
      },
    );

    it.each([
      [
        "",
        "application/json",
      ],
      [
        "<html>Error</html>",
        "text/html",
      ],
      [
        "{invalid",
        "application/json",
      ],
    ])(
      "clasifica respuesta estructuralmente invalida",

      async (
        body,
        contentType,
      ) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              body,
              200,
              contentType,
            ),
          );

        const error =
          await captureLoaderError(
            new HttpJungCoreSnapshotLoader({
              url:
                HTTPS_URL,
            }),
          );

        expect(
          error,
        ).toMatchObject({
          code:
            "JUNG_CORE_SNAPSHOT_INVALID",

          retryable:
            false,
        });

        expect(
          shouldUseCatalogFallback(
            error,
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "preserva cancelacion externa como error bloqueado",
      async () => {
        vi.stubGlobal(
          "fetch",
          abortableFetch(),
        );

        const controller =
          new AbortController();

        const request =
          captureLoaderError(
            new HttpJungCoreSnapshotLoader({
              url:
                HTTPS_URL,

              signal:
                controller.signal,
            }),
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

    it.each([
      "",
      "no-es-una-url",
      "ftp://core.example.com/snapshot",
      "http://core.example.com/snapshot",
      "https://user:password@core.example.com/snapshot",
    ])(
      "rechaza configuracion insegura: %s",

      (
        url,
      ) => {
        const error =
          captureConfigurationError(
            () =>
              new HttpJungCoreSnapshotLoader({
                url,
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
      "permite HTTP solo mediante autorizacion explicita",
      async () => {
        const snapshot = {
          ok:
            true,
        };

        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              JSON.stringify(
                snapshot,
              ),
            ),
          );

        await expect(
          new HttpJungCoreSnapshotLoader({
            url:
              "http://localhost:3000/catalog/snapshot",

            allowInsecureHttp:
              true,
          }).loadSnapshot(),
        ).resolves.toEqual(
          snapshot,
        );
      },
    );

    it(
      "rechaza timeout no positivo",
      () => {
        const error =
          captureConfigurationError(
            () =>
              new HttpJungCoreSnapshotLoader({
                url:
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
  },
);