import type {
  Campaign,
  Product,
} from "../../../types/product";

import {
  isCampaignActive,
} from "../CampaignRules";

import type {
  CatalogBadge,
} from "./BadgeTypes";

export type CampaignRegistry =
  ReadonlyMap<string, Campaign>;

export interface CampaignBadgeResolution {
  badges: CatalogBadge[];
  unresolvedCampaignIds: string[];
}

/**
 * Convierte exclusivamente relaciones oficiales
 * de campaña en badges visuales.
 *
 * No interpreta nombres libres.
 * No crea campañas.
 * No utiliza fallbacks estáticos.
 */
export function resolveCampaignBadges(
  product: Product,
  campaignRegistry: CampaignRegistry,
): CampaignBadgeResolution {
  const badgesByCampaignId =
    new Map<string, CatalogBadge>();

  const unresolvedCampaignIds =
    new Set<string>();

  (product.campaigns ?? []).forEach(
    (rawCampaignId) => {
      const campaignId =
        String(rawCampaignId ?? "").trim();

      if (!campaignId) {
        return;
      }

      const campaign =
        campaignRegistry.get(campaignId);

      if (!campaign) {
        unresolvedCampaignIds.add(
          campaignId,
        );

        return;
      }

      if (!isCampaignActive(campaign)) {
        return;
      }

      const badge: CatalogBadge = {
        id:
          `badge:campaign.${campaign.id}`,

        code:
          `campaign.${campaign.id}`,

        label:
          campaign.name,

        icon:
          campaign.icon || null,

        kind:
          "campaign",

        themeToken:
          campaign.themeToken,

        priority:
          campaign.priority,

        source:
          "campaign",

        sourceReferenceId:
          campaign.id,
      };

      const existing =
        badgesByCampaignId.get(
          campaign.id,
        );

      if (
        !existing ||
        badge.priority > existing.priority
      ) {
        badgesByCampaignId.set(
          campaign.id,
          badge,
        );
      }
    },
  );

  return {
    badges: [
      ...badgesByCampaignId.values(),
    ].sort(
      (a, b) =>
        b.priority - a.priority,
    ),

    unresolvedCampaignIds: [
      ...unresolvedCampaignIds,
    ],
  };
}
