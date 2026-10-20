import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ContractFixtureCatalogProvider,
} from "@wooly/shared/catalog/integrations/contractFixtures/ContractFixtureCatalogProvider";
import {
  invalidCatalogProductFixtures,
  validCatalogProductFixtures,
} from "@wooly/shared/catalog/integrations/contractFixtures/CatalogProductFixtures";
import type {
  CatalogProvider,
} from "@wooly/shared/catalog/providers/CatalogProvider";
import {
  FallbackCatalogProvider,
} from "@wooly/shared/catalog/providers/FallbackCatalogProvider";
import {
  HealthEngine,
} from "../engine/HealthEngine";
import {
  CatalogProviderHealthCollector,
} from "@wooly/shared/monitoring/collectors/CatalogProviderHealthCollector";

function failingProvider():
  CatalogProvider {
  return {
    source:
      "contract-fixture",
    getCategories: () => [
      "flores",
    ],
    loadCampaigns:
      vi.fn().mockResolvedValue(
        [],
      ),
    loadCategoryProducts:
      vi.fn().mockRejectedValue(
        new Error("offline"),
      ),
  };
}

describe(
  "CatalogProviderHealthCollector",
  () => {
    it(
      "reporta fixture válido como sano",
      async () => {
        const result =
          await new CatalogProviderHealthCollector(
            new ContractFixtureCatalogProvider(),
          ).collect();

        expect(result).toMatchObject({
          status: "ok",
          score: 100,
          details: {
            requestedSource:
              "contract-fixture",
            resolvedSource:
              "contract-fixture",
            fallbackUsed: false,
            rejectedCount: 0,
          },
        });
      },
    );

    it(
      "degrada fixture parcialmente inválido sin exponer productos",
      async () => {
        const result =
          await new CatalogProviderHealthCollector(
            new ContractFixtureCatalogProvider([
              ...validCatalogProductFixtures,
              ...invalidCatalogProductFixtures,
            ]),
          ).collect();
        const serialized =
          JSON.stringify(result);

        expect(result).toMatchObject({
          status: "warning",
          score: 80,
          details: {
            rejectedCount: 2,
          },
        });
        expect(serialized).not.toContain(
          "Producto contractual",
        );
        expect(serialized).not.toContain(
          "fixtures.example",
        );
      },
    );

    it(
      "reporta fallback sin mezclar datos",
      async () => {
        const fallback =
          new ContractFixtureCatalogProvider();
        const provider =
          new FallbackCatalogProvider(
            failingProvider(),
            fallback,
          );
        const result =
          await new CatalogProviderHealthCollector(
            provider,
          ).collect();

        expect(result).toMatchObject({
          status: "warning",
          details: {
            fallbackUsed: true,
            resolvedSource:
              "contract-fixture",
          },
        });
      },
    );

    it(
      "reporta error si el provider falla",
      async () => {
        const result =
          await new CatalogProviderHealthCollector(
            failingProvider(),
          ).collect();

        expect(result).toMatchObject({
          status: "error",
          score: 0,
          details: {
            issueCounts: {
              PROVIDER_ERROR: 1,
            },
          },
        });
      },
    );

    it(
      "se integra de forma aislada y sigue siendo serializable",
      async () => {
        const collector =
          new CatalogProviderHealthCollector(
            failingProvider(),
          );
        const report =
          await new HealthEngine({
            getCollectors:
              () => [
                collector,
              ],
            writeReport:
              vi.fn()
                .mockResolvedValue(
                  undefined,
                ),
          }).build();

        expect(
          report.overallStatus,
        ).toBe("unhealthy");
        expect(() =>
          JSON.stringify(report),
        ).not.toThrow();
      },
    );
  },
);
