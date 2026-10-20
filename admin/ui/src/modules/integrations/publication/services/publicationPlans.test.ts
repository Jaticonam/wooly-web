import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  loadPublicationPlan,
  loadPublicationPlans,
} from "./publicationPlans";

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

const VALID_PLAN = {
  id: "meta-all",
  name: "Meta completo",
  connector: "meta",
  enabled: true,
  mode: "all",
} as const;

describe(
  "publicationPlans",
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
      "preserva carga y selección de planes válidos",
      async () => {
        vi.mocked(fetch)
          .mockImplementation(
            async () =>
              jsonResponse(
                JSON.stringify([
                  VALID_PLAN,
                ]),
              ),
          );

        await expect(
          loadPublicationPlans(),
        ).resolves.toEqual([
          VALID_PLAN,
        ]);

        await expect(
          loadPublicationPlan(
            "meta-all",
          ),
        ).resolves.toEqual(
          VALID_PLAN,
        );
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
          loadPublicationPlans(),
        ).rejects.toMatchObject({
          name:
            "ExternalHttpRequestError",
          code,
          source:
            "Publication Plans",
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
          loadPublicationPlans();

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
