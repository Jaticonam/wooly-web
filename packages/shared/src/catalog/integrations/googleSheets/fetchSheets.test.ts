import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ExternalHttpRequestError,
} from "../../../infrastructure/http";

import {
  fetchSheetRows,
} from "./fetchSheets";

const SOURCE = {
  docId: "document-id",
  gid: "sheet-id",
  category: "flores",
};

function csvResponse(
  body: string,
  {
    status = 200,
    contentType = "text/csv",
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
  "fetchSheetRows",
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

    it.each([
      "text/csv; charset=utf-8",
      "text/plain",
    ])(
      "procesa CSV válido con %s",
      async (contentType) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            csvResponse(
              "id,title\n1,Producto",
              {
                contentType,
              },
            ),
          );

        await expect(
          fetchSheetRows(
            SOURCE,
            [
              "id",
              "title",
            ],
          ),
        ).resolves.toEqual([
          {
            id: "1",
            title:
              "Producto",
          },
        ]);
      },
    );

    it.each([
      [404, false],
      [500, true],
    ])(
      "preserva clasificación HTTP %i",
      async (
        status,
        retryable,
      ) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            csvResponse(
              "error",
              {
                status,
              },
            ),
          );

        await expect(
          fetchSheetRows(
            SOURCE,
            ["id"],
          ),
        ).rejects.toMatchObject({
          name:
            "ExternalHttpRequestError",
          code:
            "HTTP_ERROR",
          source:
            "Google Sheets: flores",
          retryable,
          status,
        });
      },
    );

    it(
      "preserva timeout",
      async () => {
        vi.useFakeTimers();
        vi.stubGlobal(
          "fetch",
          abortableFetch(),
        );

        const request =
          fetchSheetRows(
            SOURCE,
            ["id"],
            {
              timeoutMs: 20,
            },
          );

        const expectation =
          expect(
            request,
          ).rejects.toMatchObject({
            code: "TIMEOUT",
            retryable: true,
          });

        await vi
          .advanceTimersByTimeAsync(
            20,
          );

        await expectation;
      },
    );

    it(
      "preserva cancelación externa",
      async () => {
        vi.stubGlobal(
          "fetch",
          abortableFetch(),
        );

        const controller =
          new AbortController();

        const request =
          fetchSheetRows(
            SOURCE,
            ["id"],
            {
              signal:
                controller.signal,
            },
          );

        controller.abort();

        await expect(
          request,
        ).rejects.toMatchObject({
          code: "ABORTED",
          retryable: false,
        });
      },
    );

    it.each([
      [
        "",
        "text/csv",
        "EMPTY_BODY",
      ],
      [
        "<html>Error</html>",
        "text/html",
        "UNEXPECTED_CONTENT_TYPE",
      ],
    ])(
      "clasifica respuesta inválida como %s",
      async (
        body,
        contentType,
        code,
      ) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            csvResponse(
              body,
              {
                contentType,
              },
            ),
          );

        const request =
          fetchSheetRows(
            SOURCE,
            ["id"],
          );

        await expect(
          request,
        ).rejects.toBeInstanceOf(
          ExternalHttpRequestError,
        );

        await expect(
          request,
        ).rejects.toMatchObject({
          code,
          source:
            "Google Sheets: flores",
        });
      },
    );
  },
);
