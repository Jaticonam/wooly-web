import type {
  CatalogCampaignContract,
} from "@wooly/contracts/catalog/contracts";

import type {
  Campaign,
} from "@wooly/contracts/types/product";

import {
  getCampaignComputedStatus,
} from "@wooly/contracts/catalog/domain/CampaignRules";

import {
  getCampaignThemeToken,
} from "@wooly/contracts/catalog/domain/CampaignTheme";

/* =========================================================
   TIPOS
   ========================================================= */

export interface LegacyCampaignAdapterOptions {
  /**
   * La clase CSS pertenece a presentación.
   * Debe ser proporcionada explícitamente por la aplicación.
   */
  resolveColorClass(
    color: string,
  ): string;
}

/* =========================================================
   CONFIGURACIÓN LEGACY
   ========================================================= */

const LEGACY_CAMPAIGN_STATUS = {
  draft: "borrador",
  published: "publicado",
  hidden: "oculto",
  archived: "oculto",
} satisfies Record<
  CatalogCampaignContract["publicationStatus"],
  string
>;

/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(
  value: unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

/* =========================================================
   ADAPTADOR
   ========================================================= */

export function mapCatalogCampaignToLegacyCampaign(
  contract:
    CatalogCampaignContract,

  options:
    LegacyCampaignAdapterOptions,
): Campaign {
  const color =
    cleanText(
      contract.color,
    );

  const campaign:
    Campaign = {
      id:
        cleanText(
          contract.id,
        ),

      name:
        cleanText(
          contract.name,
        ),

      icon:
        cleanText(
          contract.icon,
        ),

      color:
        color ||
        undefined,

      themeToken:
        cleanText(
          contract.themeToken,
        ) ||
        getCampaignThemeToken(
          color,
        ),

      colorClass:
        options.resolveColorClass(
          color,
        ),

      startDate:
        cleanText(
          contract.startsAt,
        ),

      endDate:
        cleanText(
          contract.endsAt,
        ),

      priority:
        Number.isFinite(
          contract.priority,
        )
          ? contract.priority
          : 0,

      publicationStatus:
        LEGACY_CAMPAIGN_STATUS[
          contract
            .publicationStatus
        ],

      computedStatus:
        "borrador",
    };

  return {
    ...campaign,

    computedStatus:
      getCampaignComputedStatus(
        campaign,
      ),
  };
}
