import type { Product } from "@/shared/types/product";

import {
  normalizeCampaignLookupKey,
  type CampaignNameToIdMap,
} from "@/modules/catalog/domain/CampaignRules";

import type {
  CatalogCategoryId,
} from "./sheetsConfig";

import type {
  CsvRow,
} from "./fetchSheets";

import type {
  SheetProductTransport,
} from "./contracts";

export interface SheetProduct extends Product {
  badges: string[];
  campaigns: string[];
  priority: number;
  status: string;
  updated_at: string;
}

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function parseNumber(
  value: unknown,
): number | null {
  let cleaned = cleanText(value)
    .replace(/S\/\.?/gi, "")
    .replace(/\s/g, "");

  if (!cleaned) {
    return null;
  }

  if (
    cleaned.includes(",") &&
    cleaned.includes(".")
  ) {
    cleaned =
      cleaned.replace(/,/g, "");
  } else {
    cleaned =
      cleaned.replace(",", ".");
  }

  const numberValue = Number(cleaned);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

function parseRequiredNumber(
  value: unknown,
): number {
  return parseNumber(value) ?? 0;
}

function parsePipeArray(
  value: unknown,
): string[] {
  return cleanText(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCampaigns(
  value: unknown,
  campaignNameToIdMap:
    CampaignNameToIdMap,
): string[] {
  return parsePipeArray(value)
    .map((campaignValue) => {
      const directMatch =
        campaignNameToIdMap[
          campaignValue
        ];

      if (directMatch) {
        return directMatch;
      }

      const normalizedValue =
        normalizeCampaignLookupKey(
          campaignValue,
        );

      return campaignNameToIdMap[
        normalizedValue
      ];
    })
    .filter(
      (
        campaignId,
      ): campaignId is string =>
        Boolean(campaignId),
    )
    .filter(
      (
        campaignId,
        index,
        campaignIds,
      ) =>
        campaignIds.indexOf(
          campaignId,
        ) === index,
    );
}

export function normalizeProduct(
  row: CsvRow,
  categoryFromConfig:
    CatalogCategoryId,
  campaignNameToIdMap:
    CampaignNameToIdMap = {},
): SheetProduct {
  return {
    id: cleanText(row.__productId || row.id),
    code: cleanText(row.code || row["Código"]) || null,
    barcode: cleanText(row.barcode || row["Código de barras"]) || null,
    title: cleanText(row.title),
    description:
      cleanText(row.description),

    category: categoryFromConfig,

    price_1:
      parseRequiredNumber(row.price_1),

    price_3:
      parseNumber(row.price_3),

    price_12:
      parseNumber(row.price_12),

    price_50:
      parseNumber(row.price_50),

    price_100:
      parseNumber(row.price_100),

    price_offer:
      parseNumber(row.price_offer),

    stock:
      parseNumber(row.stock),

    img:
      cleanText(
        row.cover ||
        row.img,
      ),

    gallery:
      cleanText(
        row.gallery ||
        row.images,
      ),

    badges:
      parsePipeArray(row.badge),

    campaigns:
      parseCampaigns(
        row.campaigns,
        campaignNameToIdMap,
      ),

    priority:
      parseRequiredNumber(
        row.priority,
      ),

    status:
      cleanText(row.status),

    updated_at:
      cleanText(row.updated_at),
  };
}

export function normalizeProductTransport(
  transport: SheetProductTransport,
  categoryFromConfig: CatalogCategoryId,
  campaignNameToIdMap: CampaignNameToIdMap = {},
): SheetProduct {
  const product = normalizeProduct(
    transport.raw,
    categoryFromConfig,
    campaignNameToIdMap,
  );

  return {
    ...product,
    price_1: transport.numeric.price_1.value ?? 0,
    price_3: transport.numeric.price_3.value,
    price_12: transport.numeric.price_12.value,
    price_50: transport.numeric.price_50.value,
    price_100: transport.numeric.price_100.value,
    price_offer: transport.numeric.price_offer.value,
    stock: transport.numeric.stock.value,
    priority: transport.numeric.priority.value ?? 0,
  };
}
