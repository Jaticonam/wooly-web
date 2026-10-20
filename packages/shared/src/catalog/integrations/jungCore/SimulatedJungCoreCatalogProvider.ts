import {
  getCampaignColorClass,
} from "@wooly/contracts/catalog/domain/CampaignColorClass";

import {
  PRODUCT_SHEETS_CONFIG,
} from "../googleSheets/sheetsConfig";

import {
  JungCoreCatalogProvider,
} from "./JungCoreCatalogProvider";

import {
  simulatedJungCoreSnapshotLoader,
} from "./SimulatedJungCoreSnapshotLoader";

const bootstrapCategories =
  PRODUCT_SHEETS_CONFIG.map(
    (source) =>
      source.category,
  );

export const simulatedJungCoreCatalogProvider =
  new JungCoreCatalogProvider({
    loader:
      simulatedJungCoreSnapshotLoader,

    expectedBrandId:
      "wooly",

    bootstrapCategories,

    resolveColorClass:
      getCampaignColorClass,
  });