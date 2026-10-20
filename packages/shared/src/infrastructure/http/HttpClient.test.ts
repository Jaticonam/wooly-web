import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  requestJson,
  requestText,
} from "./HttpClient";

const SOURCE =
  "Test Provider";

function response(
  body: string,
  {
    status = 200,
    contentType = "text/plain",
  }: {
    status?: number;
    contentType?: string;
  } = {},
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
        RequestInfo | URL,
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
                once: true,
              },
            );
        },
      ),
  );
}

describe(
  "HttpClient",
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
      "devuelve texto válido y acepta Content-Type con charset",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            response(
              "id,title\n1,Producto",
              {
                contentType:
                  "text/csv; charset=utf-8",
              },
            ),
          );

        const result =
          await requestText(
            "/data.csv",
            {
              source: SOURCE,
              expectedContentTypes: [
                "text/csv",
              ],
            },
          );

        expect(result).toEqual({
          ok: true,
          data:
            "id,title\n1,Producto",
        });
      },
    );

    it(
      "devuelve JSON válido",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            response(
              '{"ok":true}',
              {
                contentType:
                  "application/json",
              },
            ),
          );

        await expect(
          requestJson<{
            ok: boolean;
          }>(
            "/data.json",
            {
              source: SOURCE,
            },
          ),
        ).resolves.toEqual({
          ok: true,
          data: {
            ok: true,
          },
        });
      },
    );

    it.each([
      [404, false],
      [500, true],
      [429, true],
    ])(
      "clasifica HTTP %i con retryable=%s",
      async (
        status,
        retryable,
      ) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            response(
              "cuerpo externo confidencial",
              {
                status,
              },
            ),
          );

        const result =
          await requestText(
            "/resource",
            {
              source: SOURCE,
            },
          );

        expect(result).toMatchObject({
          ok: false,
          error: {
            code:
              "HTTP_ERROR",
            source:
              SOURCE,
            retryable,
            status,
          },
        });

        if (result.ok === false) {
          expect(
            result.error.message,
          ).not.toContain(
            "cuerpo externo confidencial",
          );
        }
      },
    );

    it(
      "clasifica un error de red como retryable",
      async () => {
        const cause =
          new TypeError(
            "Failed to fetch",
          );

        vi.mocked(fetch)
          .mockRejectedValue(
            cause,
          );

        await expect(
          requestText(
            "/resource",
            {
              source: SOURCE,
            },
          ),
        ).resolves.toMatchObject({
          ok: false,
          error: {
            code:
              "NETWORK_ERROR",
            retryable: true,
            cause,
          },
        });
      },
    );

    it(
      "clasifica timeout interno como retryable",
      async () => {
        vi.useFakeTimers();
        vi.stubGlobal(
          "fetch",
          abortableFetch(),
        );

        const request =
          requestText(
            "/slow",
            {
              source: SOURCE,
              timeoutMs: 25,
            },
          );

        await vi
          .advanceTimersByTimeAsync(
            25,
          );

        await expect(
          request,
        ).resolves.toMatchObject({
          ok: false,
          error: {
            code: "TIMEOUT",
            retryable: true,
          },
        });
      },
    );

    it(
      "clasifica cancelación externa como no retryable",
      async () => {
        vi.stubGlobal(
          "fetch",
          abortableFetch(),
        );

        const controller =
          new AbortController();

        const request =
          requestText(
            "/resource",
            {
              source: SOURCE,
              signal:
                controller.signal,
            },
          );

        controller.abort();

        await expect(
          request,
        ).resolves.toMatchObject({
          ok: false,
          error: {
            code: "ABORTED",
            retryable: false,
          },
        });
      },
    );

    it.each([
      "",
      " \n\t ",
    ])(
      "rechaza cuerpo vacío %#",
      async (body) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            response(body),
          );

        await expect(
          requestText(
            "/empty",
            {
              source: SOURCE,
            },
          ),
        ).resolves.toMatchObject({
          ok: false,
          error: {
            code: "EMPTY_BODY",
            retryable: false,
          },
        });
      },
    );

    it(
      "rechaza Content-Type HTML",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            response(
              "<html>Error</html>",
              {
                contentType:
                  "text/html",
              },
            ),
          );

        await expect(
          requestText(
            "/data.csv",
            {
              source: SOURCE,
              expectedContentTypes: [
                "text/csv",
              ],
            },
          ),
        ).resolves.toMatchObject({
          ok: false,
          error: {
            code:
              "UNEXPECTED_CONTENT_TYPE",
            retryable: false,
          },
        });
      },
    );

    it(
      "clasifica JSON inválido sin exponer el body",
      async () => {
        const body =
          '{"secret":"contenido completo"';

        vi.mocked(fetch)
          .mockResolvedValue(
            response(
              body,
              {
                contentType:
                  "application/json",
              },
            ),
          );

        const result =
          await requestJson(
            "/invalid.json",
            {
              source: SOURCE,
            },
          );

        expect(result).toMatchObject({
          ok: false,
          error: {
            code:
              "INVALID_JSON",
            retryable: false,
          },
        });

        if (result.ok === false) {
          expect(
            result.error.message,
          ).not.toContain(
            body,
          );
        }
      },
    );

    it(
      "acepta application/problem+json",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            response(
              '{"type":"problem"}',
              {
                contentType:
                  "application/problem+json",
              },
            ),
          );

        await expect(
          requestJson(
            "/problem",
            {
              source: SOURCE,
            },
          ),
        ).resolves.toEqual({
          ok: true,
          data: {
            type: "problem",
          },
        });
      },
    );

    it(
      "limpia el timeout al finalizar",
      async () => {
        const clearTimeoutSpy =
          vi.spyOn(
            globalThis,
            "clearTimeout",
          );

        vi.mocked(fetch)
          .mockResolvedValue(
            response("ok"),
          );

        await requestText(
          "/resource",
          {
            source: SOURCE,
          },
        );

        expect(
          clearTimeoutSpy,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);

describe("HttpClient write options", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it(
    "conserva GET existente cuando no se envían opciones de escritura",
    async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          response(
            "ok",
          ),
        );

      await requestText(
        "/resource",
        {
          source:
            SOURCE,
        },
      );

      expect(
        fetch,
      ).toHaveBeenCalledTimes(
        1,
      );

      const requestInit =
        vi.mocked(fetch)
          .mock
          .calls[0]?.[1];

      expect(
        requestInit,
      ).toBeDefined();

      expect(
        requestInit,
      ).not.toHaveProperty(
        "method",
      );

      expect(
        requestInit,
      ).not.toHaveProperty(
        "headers",
      );

      expect(
        requestInit,
      ).not.toHaveProperty(
        "body",
      );

      expect(
        requestInit?.signal,
      ).toBeDefined();
    },
  );

  it(
    "propaga method headers y body cuando se especifican",
    async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          response(
            '{"ok":true}',
            {
              contentType:
                "application/json",
            },
          ),
        );

      const body =
        JSON.stringify({
          catalog:
            "PUB-TEST",
        });

      await requestJson<{
        ok:
          boolean;
      }>(
        "/publications",
        {
          source:
            SOURCE,

          method:
            "POST",

          headers: {
            "content-type":
              "application/json",
          },

          body,
        },
      );

      expect(
        fetch,
      ).toHaveBeenCalledTimes(
        1,
      );

      const requestInit =
        vi.mocked(fetch)
          .mock
          .calls[0]?.[1];

      expect(
        requestInit?.method,
      ).toBe(
        "POST",
      );

      expect(
        requestInit?.headers,
      ).toEqual({
        "content-type":
          "application/json",
      });

      expect(
        requestInit?.body,
      ).toBe(
        body,
      );
    },
  );
});
