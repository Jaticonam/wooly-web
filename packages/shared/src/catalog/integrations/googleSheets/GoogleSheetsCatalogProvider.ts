import type { Campaign, Product } from "@wooly/contracts/types/product";

import { buildCampaignNameToIdMap } from "@wooly/contracts/catalog/domain/CampaignRules";

import type {
  CatalogCategoryId,
  CatalogProvider,
} from "../../providers/CatalogProvider";

import {
  fetchSheetDocument,
} from "./fetchSheets";

import {
  validateCampaignRows,
  validateProductRows,
  type SheetHeaderSchema,
  type SheetValidationIssue,
} from "@wooly/contracts/catalog/integrations/googleSheets/contracts";

import {
  CAMPAIGN_REQUIRED_HEADERS,
  normalizeCampaignTransport,
} from "./normalizeCampaign";

import {
  normalizeProductTransport,
} from "./normalizeProduct";

import {
  CAMPAIGNS_SHEET_CONFIG,
  PRODUCT_SHEETS_CONFIG,
} from "./sheetsConfig";

import { validateProducts } from "./validateProducts";

import {
  overrideProductsWithCoreMedia,
} from "../jungCoreMedia/JungCoreMediaOverride";

/* =========================================================
   SCHEMA DE PRODUCTOS
   ========================================================= */

const PRODUCT_REQUIRED_HEADERS = [
  "id",
  "title",
  "description",
  "price_1",
  "stock",
  "status",
] as const;

const PRODUCT_HEADER_SCHEMA: SheetHeaderSchema = {
  required: PRODUCT_REQUIRED_HEADERS,
  optional: [
    "category",
    "price_3",
    "price_12",
    "price_50",
    "price_100",
    "price_offer",
    "img",
    "cover",
    "gallery",
    "images",
    "badge",
    "campaigns",
    "priority",
    "updated_at",
  ],
  allowUnknown: true,
};

const CAMPAIGN_HEADER_SCHEMA: SheetHeaderSchema = {
  required: CAMPAIGN_REQUIRED_HEADERS,
  optional: [],
  allowUnknown: true,
};

/* =========================================================
   HELPERS
   ========================================================= */

function getProductSource(category: CatalogCategoryId) {
  return PRODUCT_SHEETS_CONFIG.find(
    (source) => source.category === category,
  );
}

function reportSheetIssues(
  issues: readonly SheetValidationIssue[],
): void {
  for (const issue of issues) {
    console.warn(
      `[Google Sheets] ${issue.code} source=${issue.source}` +
      `${issue.row ? ` row=${issue.row}` : ""}` +
      `${issue.column ? ` column=${issue.column}` : ""}: ${issue.message}`,
    );
  }
}

/* =========================================================
   GOOGLE SHEETS PROVIDER
   ========================================================= */

export const googleSheetsCatalogProvider: CatalogProvider = {
  source: "google-sheets",

  getCategories(): readonly CatalogCategoryId[] {
    return PRODUCT_SHEETS_CONFIG.map(
      (source) => source.category,
    );
  },

  async loadCampaigns(): Promise<Campaign[]> {
    const document = await fetchSheetDocument(
      CAMPAIGNS_SHEET_CONFIG,
      CAMPAIGN_HEADER_SCHEMA,
    );
    const validated = validateCampaignRows(
      document.data.rows,
      CAMPAIGNS_SHEET_CONFIG.name || "Campañas",
    );
    if (validated.ok === false) return [];

    reportSheetIssues([
      ...document.warnings,
      ...document.rejected,
      ...validated.warnings,
      ...validated.rejected,
    ]);
    return validated.data.map(normalizeCampaignTransport);
  },

  async loadCategoryProducts(
    category: CatalogCategoryId,
    campaigns: readonly Campaign[],
  ): Promise<Product[]> {
    const source = getProductSource(category);

    if (!source) {
      return [];
    }

    const document = await fetchSheetDocument(
      source,
      PRODUCT_HEADER_SCHEMA,
    );

    const campaignNameToIdMap =
      buildCampaignNameToIdMap([...campaigns]);

    const validated = validateProductRows(
      document.data.rows,
      source.category,
      campaignNameToIdMap,
    );
    if (validated.ok === false) return [];

    reportSheetIssues([
      ...document.warnings,
      ...document.rejected,
      ...validated.warnings,
      ...validated.rejected,
    ]);

    const normalizedProducts = validated.data.map((row) =>
      normalizeProductTransport(
        row,
        source.category,
        campaignNameToIdMap,
      ),
    );

    const publishedProducts =
      validateProducts(normalizedProducts).map(
        ({ updated_at, ...product }) => product,
      );

    return overrideProductsWithCoreMedia(
      publishedProducts,
    );
  },
};

