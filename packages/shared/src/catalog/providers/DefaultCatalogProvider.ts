import { developmentContractFixtureCatalogProvider } from "../integrations/contractFixtures/DevelopmentContractFixtureCatalogProvider";
import { googleSheetsCatalogProvider } from "../integrations/googleSheets/GoogleSheetsCatalogProvider";
import { developmentJungCoreCatalogProvider } from "../integrations/jungCore/DevelopmentJungCoreCatalogProvider";
import { JungCoreCatalogProvider } from "../integrations/jungCore/JungCoreCatalogProvider";
import { HttpJungCoreSnapshotLoader } from "../integrations/jungCore/HttpJungCoreSnapshotLoader";
import { getCampaignColorClass } from "@wooly/contracts/catalog/domain/CampaignColorClass";
import { HealthCollectorRegistry } from "../../monitoring/registry/HealthCollectorRegistry";
import { getApplicationConfig, type ApplicationRuntimeMode } from "../../config/application";
import type { CatalogProvider } from "./CatalogProvider";
import { createCatalogRuntimeComposition } from "./CatalogRuntimeComposition";

const runtimeMode: ApplicationRuntimeMode =
  import.meta.env.PROD === false
    ? "development"
    : "production";

const localPublicCore =
  import.meta.env.DEV &&
  !import.meta.env.TEST &&
  typeof window !== "undefined" &&
  window.location.origin === "http://localhost:8000";

const config = getApplicationConfig();

export const catalogRuntimeComposition =
  createCatalogRuntimeComposition(
    localPublicCore
      ? {
          ...config,
          catalog: { source: "jung-core" },
        }
      : config,
    runtimeMode,
    localPublicCore
      ? {
          jungCoreHttp: {
            snapshotUrl:
              `${window.location.origin}/jung-core/public/catalog/snapshots/wooly`,
            allowInsecureHttp: true,
            fallbackEnabled: false,
            timeoutMs: 8000,
          },
        }
      : {},
    {
      googleSheets: googleSheetsCatalogProvider,
      contractFixture: developmentContractFixtureCatalogProvider,
      developmentJungCore: developmentJungCoreCatalogProvider,

      createHttpJungCoreProvider: options =>
        new JungCoreCatalogProvider({
          loader: new HttpJungCoreSnapshotLoader({
            url: options.snapshotUrl,
            allowInsecureHttp: options.allowInsecureHttp,
            timeoutMs: options.timeoutMs,
          }),
          expectedBrandId: options.brandId,
          bootstrapCategories: [
            "flores", "peluches", "papeles",
            "cajas", "cintas", "globos",
            "accesorios", "llaveros", "hotwheels",
          ],
          resolveColorClass: getCampaignColorClass,
          circuitBreaker: options.circuitBreaker,
        }),
    },
  );

export const catalogProvider: CatalogProvider =
  catalogRuntimeComposition.provider;

export const catalogProviderHealthCollector =
  catalogRuntimeComposition.healthCollector;

export function registerCatalogProviderHealthCollector(): void {
  HealthCollectorRegistry.register(
    catalogProviderHealthCollector,
  );
}