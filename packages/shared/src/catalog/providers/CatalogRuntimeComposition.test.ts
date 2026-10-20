import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ApplicationConfig,
  CatalogSourceMode,
} from "../../config/application";

import {
  woolyApplicationConfig,
} from "../../config/application";

import type {
  CatalogProvider,
} from "./CatalogProvider";

import {
  createCatalogRuntimeComposition,
  resolveCatalogRuntimeSource,
} from "./CatalogRuntimeComposition";

function configWithSource(
  source:
    CatalogSourceMode,
): ApplicationConfig {
  return {
    ...woolyApplicationConfig,

    catalog: {
      source,
    },
  };
}

function createProvider(
  source:
    CatalogProvider["source"],

  options: {
    loadCampaigns?:
      CatalogProvider[
        "loadCampaigns"
      ];

    loadCategoryProducts?:
      CatalogProvider[
        "loadCategoryProducts"
      ];
  } = {},
): CatalogProvider {
  return {
    source,

    getCategories:
      () => [],

    loadCampaigns:
      options.loadCampaigns ??
      (async () => []),

    loadCategoryProducts:
      options
        .loadCategoryProducts ??
      (async () => []),
  };
}

class RecoverableError
  extends Error {
  readonly code =
    "HTTP_503";
}

describe(
  "CatalogRuntimeComposition",
  () => {
    it.each([
      [
        "google-sheets",
        "production",
        "google-sheets",
      ],
      [
        "contract-fixture",
        "production",
        "google-sheets",
      ],
      [
        "jung-core",
        "production",
        "google-sheets",
      ],
      [
        "contract-fixture",
        "development",
        "contract-fixture",
      ],
      [
        "jung-core",
        "development",
        "jung-core",
      ],
    ] as const)(
      "resuelve %s en %s como %s",
      (
        requested,
        mode,
        expected,
      ) => {
        expect(
          resolveCatalogRuntimeSource(
            requested,
            mode,
          ),
        ).toBe(
          expected,
        );
      },
    );

    it(
      "mantiene Google Sheets como defensa obligatoria en produccion",
      () => {
        const googleSheets =
          createProvider(
            "google-sheets",
          );

        const httpProvider =
          createProvider(
            "jung-core",
          );

        const createHttp =
          vi.fn(
            () => httpProvider,
          );

        const composition =
          createCatalogRuntimeComposition(
            configWithSource(
              "jung-core",
            ),

            "production",

            {
              jungCoreHttp: {
                snapshotUrl:
                  "https://core.example.com/catalog/snapshot",

                fallbackEnabled:
                  true,
              },
            },

            {
              googleSheets,

              createHttpJungCoreProvider:
                createHttp,
            },
          );

        expect(
          composition
            .requestedSource,
        ).toBe(
          "jung-core",
        );

        expect(
          composition
            .effectiveSource,
        ).toBe(
          "google-sheets",
        );

        expect(
          composition.transport,
        ).toBe(
          "google-sheets",
        );

        expect(
          composition.provider,
        ).toBe(
          googleSheets,
        );

        expect(
          composition
            .fallbackEnabled,
        ).toBe(
          false,
        );

        expect(
          createHttp,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "usa simulacion en desarrollo sin configuracion HTTP",
      () => {
        const developmentJungCore =
          createProvider(
            "jung-core",
          );

        const composition =
          createCatalogRuntimeComposition(
            configWithSource(
              "jung-core",
            ),

            "development",

            {},

            {
              developmentJungCore,
            },
          );

        expect(
          composition.transport,
        ).toBe(
          "jung-core-simulation",
        );

        expect(
          composition.provider,
        ).toBe(
          developmentJungCore,
        );

        expect(
          composition
            .fallbackEnabled,
        ).toBe(
          false,
        );
      },
    );

    it(
      "compone HTTP solo mediante configuracion explicita",
      () => {
        const httpProvider =
          createProvider(
            "jung-core",
          );

        const createHttp =
          vi.fn(
            () => httpProvider,
          );

        const now =
          () => 100;

        const composition =
          createCatalogRuntimeComposition(
            configWithSource(
              "jung-core",
            ),

            "development",

            {
              now,

              jungCoreHttp: {
                snapshotUrl:
                  "http://localhost:3000/catalog/snapshot",

                timeoutMs:
                  4_000,

                allowInsecureHttp:
                  true,

                circuitBreaker: {
                  failureThreshold:
                    2,

                  cooldownMs:
                    10_000,
                },
              },
            },

            {
              createHttpJungCoreProvider:
                createHttp,
            },
          );

        expect(
          composition.transport,
        ).toBe(
          "jung-core-http",
        );

        expect(
          composition.provider,
        ).toBe(
          httpProvider,
        );

        expect(
          createHttp,
        ).toHaveBeenCalledWith({
          brandId:
            "wooly",

          snapshotUrl:
            "http://localhost:3000/catalog/snapshot",

          timeoutMs:
            4_000,

          allowInsecureHttp:
            true,

          now,

          circuitBreaker: {
            enabled:
              true,

            failureThreshold:
              2,

            cooldownMs:
              10_000,
          },
        });
      },
    );

    it(
      "mantiene HTTPS obligatorio al negar HTTP inseguro en produccion",
      () => {
        const createHttp =
          vi.fn(
            () =>
              createProvider(
                "jung-core",
              ),
          );

        createCatalogRuntimeComposition(
          configWithSource(
            "jung-core",
          ),

          "development",

          {
            jungCoreHttp: {
              snapshotUrl:
                "https://core.example.com/catalog/snapshot",

              allowInsecureHttp:
                false,
            },
          },

          {
            createHttpJungCoreProvider:
              createHttp,
          },
        );

        expect(
          createHttp,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            allowInsecureHttp:
              false,

            circuitBreaker: {
              enabled:
                true,
            },
          }),
        );
      },
    );

    it(
      "habilita fallback a Google Sheets solo de forma explicita",
      async () => {
        const primaryLoad =
          vi.fn(
            async () => {
              throw new RecoverableError();
            },
          );

        const fallbackLoad =
          vi.fn(
            async () => [],
          );

        const jungCore =
          createProvider(
            "jung-core",

            {
              loadCampaigns:
                primaryLoad,
            },
          );

        const googleSheets =
          createProvider(
            "google-sheets",

            {
              loadCampaigns:
                fallbackLoad,
            },
          );

        const composition =
          createCatalogRuntimeComposition(
            configWithSource(
              "jung-core",
            ),

            "development",

            {
              jungCoreHttp: {
                snapshotUrl:
                  "https://core.example.com/catalog/snapshot",

                fallbackEnabled:
                  true,
              },
            },

            {
              googleSheets,

              createHttpJungCoreProvider:
                () => jungCore,
            },
          );

        await expect(
          composition
            .provider
            .loadCampaigns(),
        ).resolves.toEqual(
          [],
        );

        expect(
          composition
            .fallbackEnabled,
        ).toBe(
          true,
        );

        expect(
          primaryLoad,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          fallbackLoad,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "enlaza health al provider realmente compuesto",
      async () => {
        const developmentJungCore =
          createProvider(
            "jung-core",
          );

        const composition =
          createCatalogRuntimeComposition(
            configWithSource(
              "jung-core",
            ),

            "development",

            {
              now:
                () => 100,
            },

            {
              developmentJungCore,
            },
          );

        const health =
          await composition
            .healthCollector
            .collect();

        expect(
          health,
        ).toMatchObject({
          status:
            "ok",

          score:
            100,

          details: {
            requestedSource:
              "jung-core",

            resolvedSource:
              "jung-core",

            fallbackUsed:
              false,
          },
        });
      },
    );
  },
);