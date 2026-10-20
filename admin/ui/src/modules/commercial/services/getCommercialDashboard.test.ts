import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getCommercialDashboard,
} from "./getCommercialDashboard";

function jsonResponse(
  body: string,
  {
    status = 200,
    contentType =
      "application/json",
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
  "getCommercialDashboard",
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
      "preserva el JSON válido",
      async () => {
        vi.mocked(fetch)
          .mockResolvedValue(
            jsonResponse(
              '{"status":"ok"}',
            ),
          );

        await expect(
          getCommercialDashboard(),
        ).resolves.toEqual({
          status: "ok",
        });
      },
    );

    it.each([
      [
        jsonResponse(
          "{}",
          {
            status: 500,
          },
        ),
        "HTTP_ERROR",
      ],
      [
        jsonResponse(
          "{invalid",
        ),
        "INVALID_JSON",
      ],
      [
        jsonResponse(
          "<html></html>",
          {
            contentType:
              "text/html",
          },
        ),
        "UNEXPECTED_CONTENT_TYPE",
      ],
    ])(
      "lanza error compatible %s",
      async (
        serviceResponse,
        code,
      ) => {
        vi.mocked(fetch)
          .mockResolvedValue(
            serviceResponse,
          );

        await expect(
          getCommercialDashboard(),
        ).rejects.toMatchObject({
          name:
            "ExternalHttpRequestError",
          code,
          source:
            "Commercial Dashboard",
        });
      },
    );

    it(
      "preserva timeout como error compatible",
      async () => {
        vi.useFakeTimers();
        vi.stubGlobal(
          "fetch",
          abortableFetch(),
        );

        const request =
          getCommercialDashboard();

        const expectation =
          expect(
            request,
          ).rejects.toMatchObject({
            code: "TIMEOUT",
            retryable: true,
          });

        await vi
          .advanceTimersByTimeAsync(
            10_000,
          );

        await expectation;
      },
    );
  },
);
