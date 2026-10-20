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
} from "./CatalogProviderHealthCollector";

class CircuitOpenError
  extends Error {
  readonly code =
    "JUNG_CORE_CIRCUIT_OPEN";
}

const fallbackProvider:
  CatalogProvider = {
  source:
    "jung-core",

  getCategories:
    () => [],

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

        fallbackReason:
          "JUNG_CORE_CIRCUIT_OPEN",
      },
    }),

  loadCategoryProducts:
    async () => [],
};

const failingProvider:
  CatalogProvider = {
  source:
    "jung-core",

  getCategories:
    () => [],

  loadCampaigns:
    async () => {
      throw new CircuitOpenError();
    },

  loadCategoryProducts:
    async () => [],
};

describe(
  "CatalogProviderHealthCollector con circuit breaker",
  () => {
    it(
      "reporta warning cuando Google Sheets cubre un circuito abierto",
      async () => {
        const result =
          await new CatalogProviderHealthCollector(
            fallbackProvider,
            "jung-core",
            () => 100,
          ).collect();

        expect(
          result,
        ).toMatchObject({
          status:
            "warning",

          score:
            80,

          details: {
            fallbackUsed:
              true,

            fallbackReasonCounts: {
              JUNG_CORE_CIRCUIT_OPEN:
                1,
            },

            issueCounts: {
              JUNG_CORE_CIRCUIT_OPEN:
                1,
            },
          },
        });
      },
    );

    it(
      "reporta error y conserva el codigo cuando no existe fallback",
      async () => {
        const result =
          await new CatalogProviderHealthCollector(
            failingProvider,
            "jung-core",
            () => 100,
          ).collect();

        expect(
          result,
        ).toMatchObject({
          status:
            "error",

          score:
            0,

          details: {
            issueCounts: {
              PROVIDER_ERROR:
                1,

              JUNG_CORE_CIRCUIT_OPEN:
                1,
            },
          },
        });
      },
    );
  },
);