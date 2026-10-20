import type { Campaign } from "@wooly/contracts/types/product";

import {
  getCampaignComputedStatus,
} from "@wooly/contracts/catalog/domain/CampaignRules";

import {
  getCampaignThemeToken,
} from "@wooly/contracts/catalog/domain/CampaignTheme";

import {
  getCampaignColorClass,
} from "./campaignColors";

import type { CsvRow } from "./fetchSheets";
import type { SheetCampaignTransport } from "@wooly/contracts/catalog/integrations/googleSheets/contracts";

/* =========================================================
   SCHEMA DE GOOGLE SHEETS
   ========================================================= */

export const CAMPAIGN_REQUIRED_HEADERS = [
  "id",
  "name",
  "icon",
  "color",
  "startdate",
  "enddate",
  "priority",
  "publicationstatus",
] as const;

/* =========================================================
   HELPERS DE NORMALIZACIÓN
   ========================================================= */

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function parsePriority(value: unknown): number {
  const priority = Number(cleanText(value));

  return Number.isFinite(priority)
    ? priority
    : 0;
}

/* =========================================================
   NORMALIZACIÓN DESDE GOOGLE SHEETS
   ========================================================= */

export function normalizeCampaign(
  row: CsvRow,
): Campaign {
  const color = cleanText(row.color);

  const campaign: Campaign = {
    id: cleanText(row.id),
    name: cleanText(row.name),
    icon: cleanText(row.icon),

    color,
    themeToken:
      getCampaignThemeToken(color),

    colorClass:
      getCampaignColorClass(color),

    startDate: cleanText(row.startdate),
    endDate: cleanText(row.enddate),

    priority:
      parsePriority(row.priority),

    publicationStatus:
      cleanText(row.publicationstatus),

    computedStatus: "borrador",
  };

  return {
    ...campaign,

    computedStatus:
      getCampaignComputedStatus(
        campaign,
      ),
  };
}

export function normalizeCampaignTransport(
  transport: SheetCampaignTransport,
): Campaign {
  return normalizeCampaign({
    ...transport.raw,
    priority:
      transport.priority.value === null
        ? transport.raw.priority
        : String(transport.priority.value),
  });
}

/* =========================================================
   COMPATIBILIDAD TEMPORAL
   ========================================================= */

export {
  buildCampaignNameToIdMap,
  getCampaignComputedStatus,
  isCampaignActive,
} from "@wooly/contracts/catalog/domain/CampaignRules";
