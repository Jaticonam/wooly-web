import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  CatalogPublicPublication,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import type {
  CatalogPublicationProvider,
} from "@wooly/shared/catalog/providers/CatalogPublicationProvider";

import {
  HttpCatalogPublicationProviderError,
} from "@wooly/shared/catalog/integrations/publication/HttpCatalogPublicationProvider";

import {
  useCatalogPublicPublication,
} from "./useCatalogPublicPublication";

const rateLimited = (
  retryAfterSeconds?: number,
) =>
  new HttpCatalogPublicationProviderError(
    "HTTP_429",
    "HTTP 429",
    {
      status: 429,
      retryable: true,
      ...(
        retryAfterSeconds !== undefined
          ? {
              retryAfterSeconds,
            }
          : {}
      ),
    },
  );

const createProvider = (
  getByPublicId:
    CatalogPublicationProvider["getByPublicId"],
): CatalogPublicationProvider => ({
  source:
    "hook-test",

  publish:
    async () => {
      throw new Error(
        "publish no participa en estos tests",
      );
    },

  getByPublicId,
});

describe(
  "useCatalogPublicPublication — HTTP 429 (P4-SEC-03)",
  () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it(
      "respeta Retry-After, no reintenta solo y permite un único reintento manual",
      async () => {
        vi.useFakeTimers({
          shouldAdvanceTime: true,
        });

        const getByPublicId =
          vi.fn<
            CatalogPublicationProvider["getByPublicId"]
          >()
            .mockRejectedValueOnce(
              rateLimited(5),
            )
            .mockResolvedValueOnce(
              null,
            );

        const provider =
          createProvider(
            getByPublicId,
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useCatalogPublicPublication(
                "PUB-AbC123",
                provider,
              ),
          );

        await waitFor(
          () =>
            expect(
              result.current.status,
            ).toBe(
              "rate-limited",
            ),
        );

        expect(result.current.retryAfterSeconds).toBe(5);
        expect(result.current.canRetry).toBe(false);

        // Durante la espera el reintento no hace nada.
        act(() => {
          result.current.retry();
        });

        expect(getByPublicId).toHaveBeenCalledTimes(1);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(
            5_000,
          );
        });

        expect(result.current.canRetry).toBe(true);

        // Vencida la espera, sigue sin solicitudes automáticas.
        await act(async () => {
          await vi.advanceTimersByTimeAsync(
            60_000,
          );
        });

        expect(getByPublicId).toHaveBeenCalledTimes(1);

        act(() => {
          result.current.retry();
          result.current.retry();
        });

        await waitFor(
          () =>
            expect(
              result.current.status,
            ).toBe(
              "not-found",
            ),
        );

        expect(getByPublicId).toHaveBeenCalledTimes(2);
      },
    );

    it(
      "sin Retry-After habilita el reintento manual inmediato",
      async () => {
        const getByPublicId =
          vi.fn<
            CatalogPublicationProvider["getByPublicId"]
          >()
            .mockRejectedValueOnce(
              rateLimited(),
            )
            .mockResolvedValueOnce(
              {
                publicId:
                  "PUB-AbC123",
              } as unknown as CatalogPublicPublication,
            );

        const provider =
          createProvider(
            getByPublicId,
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useCatalogPublicPublication(
                "PUB-AbC123",
                provider,
              ),
          );

        await waitFor(
          () =>
            expect(
              result.current.canRetry,
            ).toBe(
              true,
            ),
        );

        expect(result.current.retryAfterSeconds).toBeUndefined();

        act(() => {
          result.current.retry();
        });

        await waitFor(
          () =>
            expect(
              getByPublicId,
            ).toHaveBeenCalledTimes(
              2,
            ),
        );

        // El segundo resultado inválido termina en error, sin bucles.
        await waitFor(
          () =>
            expect(
              result.current.status,
            ).toBe(
              "error",
            ),
        );

        expect(result.current.canRetry).toBe(false);
        expect(getByPublicId).toHaveBeenCalledTimes(2);
      },
    );

    it.each([
      ["HTTP_410", 410, "revoked"],
      ["HTTP_5XX", 503, "error"],
    ] as const)(
      "%s no ofrece reintento y no repite la lectura",
      async (
        code,
        status,
        expected,
      ) => {
        const getByPublicId =
          vi.fn<
            CatalogPublicationProvider["getByPublicId"]
          >()
            .mockRejectedValue(
              new HttpCatalogPublicationProviderError(
                code,
                `HTTP ${status}`,
                {
                  status,
                  retryable:
                    status >= 500,
                },
              ),
            );

        const provider =
          createProvider(
            getByPublicId,
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useCatalogPublicPublication(
                "PUB-AbC123",
                provider,
              ),
          );

        await waitFor(
          () =>
            expect(
              result.current.status,
            ).toBe(
              expected,
            ),
        );

        expect(result.current.canRetry).toBe(false);

        act(() => {
          result.current.retry();
        });

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              50,
            ),
        );

        expect(getByPublicId).toHaveBeenCalledTimes(1);
      },
    );
  },
);
