import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MAX_RETRY_AFTER_SECONDS,
  parseRetryAfterSeconds,
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

describe(
  "HttpClient — Retry-After en HTTP 429 (P4-SEC-03)",
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

    function rateLimited(
      retryAfter?: string,
      status = 429,
    ): Response {
      const headers: Record<string, string> = {
        "content-type":
          "application/json",
      };

      if (retryAfter !== undefined) {
        headers["retry-after"] =
          retryAfter;
      }

      return new Response(
        JSON.stringify({
          success: false,
          errorCode:
            "CATALOG_PUBLICATION_RATE_LIMITED",
        }),
        {
          status,
          headers,
        },
      );
    }

    it(
      "conserva status 429, retryable y expone retryAfterSeconds válido",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            rateLimited("42"),
          );

        const result =
          await requestJson(
            "https://api.example.com/resource",
            {
              source: SOURCE,
            },
          );

        expect(result).toEqual({
          ok: false,
          error: {
            code: "HTTP_ERROR",
            source: SOURCE,
            message:
              `El servicio "${SOURCE}" respondió HTTP 429.`,
            retryable: true,
            status: 429,
            retryAfterSeconds: 42,
          },
        });
      },
    );

    it(
      "omite retryAfterSeconds cuando la cabecera no existe",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            rateLimited(),
          );

        const result =
          await requestText(
            "https://api.example.com/resource",
            {
              source: SOURCE,
            },
          );

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(result.error.status).toBe(429);
          expect(result.error.retryable).toBe(true);
          expect(
            "retryAfterSeconds" in result.error,
          ).toBe(false);
        }
      },
    );

    it.each([
      ["0"],
      ["-5"],
      ["1.5"],
      ["abc"],
      ["12abc"],
      ["+10"],
      ["3601"],
      ["999999999"],
      ["Wed, 21 Oct 2026 07:28:00 GMT"],
      [""],
    ])(
      "descarta Retry-After no confiable %j",
      async (header) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            rateLimited(header),
          );

        const result =
          await requestText(
            "https://api.example.com/resource",
            {
              source: SOURCE,
            },
          );

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(result.error.status).toBe(429);
          expect(result.error.retryAfterSeconds).toBeUndefined();
        }
      },
    );

    it(
      "no interpreta Retry-After fuera de HTTP 429",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            rateLimited("30", 503),
          );

        const result =
          await requestText(
            "https://api.example.com/resource",
            {
              source: SOURCE,
            },
          );

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(result.error.status).toBe(503);
          expect(result.error.retryAfterSeconds).toBeUndefined();
        }
      },
    );

    it(
      "no espera ni reintenta automáticamente ante HTTP 429",
      async () => {
        vi.useFakeTimers();

        try {
          vi.mocked(fetch)
            .mockResolvedValue(
              rateLimited("5"),
            );

          const result =
            await requestJson(
              "https://api.example.com/resource",
              {
                source: SOURCE,
              },
            );

          await vi.advanceTimersByTimeAsync(
            10_000,
          );

          expect(result.ok).toBe(false);
          expect(fetch).toHaveBeenCalledTimes(1);
        } finally {
          vi.useRealTimers();
        }
      },
    );

    it(
      "parseRetryAfterSeconds acota a 1..MAX_RETRY_AFTER_SECONDS",
      () => {
        expect(parseRetryAfterSeconds("1")).toBe(1);
        expect(parseRetryAfterSeconds(" 60 ")).toBe(60);
        expect(parseRetryAfterSeconds("0600")).toBe(600);
        expect(
          parseRetryAfterSeconds(
            String(MAX_RETRY_AFTER_SECONDS),
          ),
        ).toBe(MAX_RETRY_AFTER_SECONDS);
        expect(
          parseRetryAfterSeconds(
            String(MAX_RETRY_AFTER_SECONDS + 1),
          ),
        ).toBeUndefined();
        expect(parseRetryAfterSeconds(null)).toBeUndefined();
        expect(parseRetryAfterSeconds(undefined)).toBeUndefined();
        expect(parseRetryAfterSeconds("1\r\nX-Evil: 1")).toBeUndefined();
      },
    );
  },
);
