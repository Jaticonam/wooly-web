import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CatalogProvider,
} from "../../catalog/providers/CatalogProvider";

import {
  CatalogProviderHealthCollector,
  collectCatalogProviderHealth,
} from "./CatalogProviderHealthCollector";

const mixedProvider:
  CatalogProvider = {
  source:
    "jung-core",

  getCategories:
    () => [
      "flores",
    ],

  loadCampaigns:
    async () => [],

  loadCampaignsDetailed:
    async () => ({
      data:
        [],

      source:
        "google-sheets",

      issues:
        [],

      metadata: {
        requestedSource:
          "jung-core",

        resolvedSource:
          "google-sheets",

        fallbackUsed:
          true,
      },
    }),

  loadCategoryProducts:
    async () => [],

  loadCategoryProductsDetailed:
    async () => ({
      data:
        [],

      source:
        "jung-core",

      issues:
        [],

      metadata: {
        requestedSource:
          "jung-core",

        resolvedSource:
          "jung-core",

        fallbackUsed:
          false,
      },
    }),
};

describe(
  "CatalogProviderHealthCollector con fuentes mixtas",
  () => {
    it(
      "reporta mezcla de fuentes sin convertirla en error",
      async () => {
        const snapshot =
          await collectCatalogProviderHealth(
            mixedProvider,
            "jung-core",
            () => 100,
          );

        expect(
          snapshot.resolvedSource,
        ).toBe(
          "mixed",
        );

        expect(
          snapshot.resolvedSources,
        ).toEqual([
          "google-sheets",
          "jung-core",
        ]);

        expect(
          snapshot.mixedSources,
        ).toBe(
          true,
        );

        expect(
          snapshot.issueCounts
            .MIXED_SOURCES,
        ).toBe(
          1,
        );

        expect(
          snapshot.issueCounts
            .PROVIDER_ERROR,
        ).toBeUndefined();
      },
    );

    it(
      "degrada el componente a warning",
      async () => {
        const collector =
          new CatalogProviderHealthCollector(
            mixedProvider,
            "jung-core",
            () => 100,
          );

        const result =
          await collector.collect();

        expect(
          result.status,
        ).toBe(
          "warning",
        );

        expect(
          result.score,
        ).toBe(
          80,
        );
      },
    );
  },
);