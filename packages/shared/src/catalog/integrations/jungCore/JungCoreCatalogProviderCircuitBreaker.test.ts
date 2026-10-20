import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  JungCoreSnapshotLoader,
} from "./JungCoreSnapshotLoader";

import {
  HttpJungCoreSnapshotLoaderError,
} from "./HttpJungCoreSnapshotLoader";

import {
  JungCoreCatalogProvider,
} from "./JungCoreCatalogProvider";

import {
  SIMULATED_JUNG_CORE_SNAPSHOT,
} from "./SimulatedJungCoreSnapshotLoader";

function transportError(
  code:
    "HTTP_503" |
    "HTTP_401",

  retryable:
    boolean,
): HttpJungCoreSnapshotLoaderError {
  return new HttpJungCoreSnapshotLoaderError(
    code,
    code,

    {
      status:
        code ===
          "HTTP_503"
          ? 503
          : 401,

      retryable,
    },
  );
}

function sequentialLoader(
  entries:
    readonly unknown[],
): JungCoreSnapshotLoader & {
  loadSnapshot:
    ReturnType<typeof vi.fn>;
} {
  const queue = [
    ...entries,
  ];

  return {
    loadSnapshot:
      vi.fn(
        async () => {
          const next =
            queue.shift();

          if (
            next instanceof Error
          ) {
            throw next;
          }

          return structuredClone(
            next,
          );
        },
      ),
  };
}

function createProvider(
  loader:
    JungCoreSnapshotLoader,

  now:
    () => number,
): JungCoreCatalogProvider {
  return new JungCoreCatalogProvider({
    loader,

    expectedBrandId:
      "wooly",

    bootstrapCategories: [
      "flores",
    ],

    resolveColorClass:
      () => "lavanda",

    now,

    circuitBreaker: {
      enabled:
        true,

      failureThreshold:
        2,

      cooldownMs:
        500,
    },
  });
}

describe(
  "JungCoreCatalogProvider con circuit breaker",
  () => {
    it(
      "abre, bloquea llamadas y se recupera mediante half-open",
      async () => {
        let now =
          1_000;

        const loader =
          sequentialLoader([
            transportError(
              "HTTP_503",
              true,
            ),

            transportError(
              "HTTP_503",
              true,
            ),

            SIMULATED_JUNG_CORE_SNAPSHOT,
          ]);

        const provider =
          createProvider(
            loader,
            () => now,
          );

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          code:
            "HTTP_503",
        });

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          code:
            "HTTP_503",
        });

        expect(
          provider.getState()
            .circuitBreaker,
        ).toEqual({
          status:
            "open",

          consecutiveFailures:
            2,

          openedAt:
            1_000,

          nextAttemptAt:
            1_500,
        });

        await expect(
          provider.loadCampaigns(),
        ).rejects.toMatchObject({
          code:
            "JUNG_CORE_CIRCUIT_OPEN",
        });

        expect(
          loader.loadSnapshot,
        ).toHaveBeenCalledTimes(
          2,
        );

        now =
          1_500;

        await expect(
          provider.loadCampaigns(),
        ).resolves.toEqual(
          expect.any(
            Array,
          ),
        );

        expect(
          loader.loadSnapshot,
        ).toHaveBeenCalledTimes(
          3,
        );

        expect(
          provider.getState()
            .circuitBreaker,
        ).toEqual({
          status:
            "closed",

          consecutiveFailures:
            0,

          openedAt:
            null,

          nextAttemptAt:
            null,
        });
      },
    );

    it(
      "no abre ante errores bloqueantes",
      async () => {
        const loader =
          sequentialLoader([
            transportError(
              "HTTP_401",
              false,
            ),

            transportError(
              "HTTP_401",
              false,
            ),

            transportError(
              "HTTP_401",
              false,
            ),
          ]);

        const provider =
          createProvider(
            loader,
            () => 100,
          );

        for (
          let attempt = 0;
          attempt < 3;
          attempt++
        ) {
          await expect(
            provider.loadCampaigns(),
          ).rejects.toMatchObject({
            code:
              "HTTP_401",
          });
        }

        expect(
          loader.loadSnapshot,
        ).toHaveBeenCalledTimes(
          3,
        );

        expect(
          provider.getState()
            .circuitBreaker,
        ).toMatchObject({
          status:
            "closed",

          consecutiveFailures:
            0,
        });
      },
    );

    it(
      "mantiene compatibilidad cuando esta desactivado",
      async () => {
        const loader =
          sequentialLoader([
            transportError(
              "HTTP_503",
              true,
            ),

            transportError(
              "HTTP_503",
              true,
            ),

            transportError(
              "HTTP_503",
              true,
            ),
          ]);

        const provider =
          new JungCoreCatalogProvider({
            loader,

            expectedBrandId:
              "wooly",

            bootstrapCategories: [
              "flores",
            ],

            resolveColorClass:
              () => "lavanda",
          });

        for (
          let attempt = 0;
          attempt < 3;
          attempt++
        ) {
          await expect(
            provider.loadCampaigns(),
          ).rejects.toMatchObject({
            code:
              "HTTP_503",
          });
        }

        expect(
          loader.loadSnapshot,
        ).toHaveBeenCalledTimes(
          3,
        );

        expect(
          provider.getState()
            .circuitBreaker
            .status,
        ).toBe(
          "disabled",
        );
      },
    );
  },
);