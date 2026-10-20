import type {
  Product,
} from "../../../types/product";

import {
  getBaseUnitPrice,
} from "../../../domain/volumePricing/VolumePricing";

import type {
  CatalogBadge,
  IgnoredLegacyBadgeValue,
  ProductCompatibilityProfile,
} from "./BadgeTypes";

import {
  resolveCampaignBadges,
  type CampaignRegistry,
} from "./CampaignBadgeResolver";

import {
  isObsoleteLegacyBadgeValue,
  normalizeLegacyBadgeValue,
  resolveLegacyBadgeValue,
} from "./LegacyBadgeAliases";

export interface ResolveProductCompatibilityOptions {
  includePricingBadges?: boolean;
  campaignRegistry?: CampaignRegistry;
}

const EMPTY_CAMPAIGN_REGISTRY:
  CampaignRegistry =
    new Map();

const hasValidOffer = (
  product: Product,
): boolean => {
  const basePrice =
    product.price_1;

  return (
    Number.isFinite(
      basePrice,
    ) &&
    basePrice > 0 &&
    getBaseUnitPrice(
      product,
    ) < basePrice
  );
};

const toCodeSegment = (
  value: string,
): string =>
  normalizeLegacyBadgeValue(value)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") ||
  "unknown";

const deduplicateBadges = (
  badges: CatalogBadge[],
): CatalogBadge[] => {
  const byCode =
    new Map<string, CatalogBadge>();

  badges.forEach((badge) => {
    const existing =
      byCode.get(badge.code);

    if (
      !existing ||
      badge.priority > existing.priority
    ) {
      byCode.set(
        badge.code,
        badge,
      );
    }
  });

  return [...byCode.values()];
};

const deduplicateIgnoredValues = (
  values: IgnoredLegacyBadgeValue[],
): IgnoredLegacyBadgeValue[] => {
  const unique =
    new Map<
      string,
      IgnoredLegacyBadgeValue
    >();

  values.forEach((item) => {
    const key = [
      item.normalizedValue,
      item.reason,
    ].join(":");

    if (!unique.has(key)) {
      unique.set(
        key,
        item,
      );
    }
  });

  return [...unique.values()];
};

export function resolveProductCompatibility(
  product: Product,
  options:
    ResolveProductCompatibilityOptions = {},
): ProductCompatibilityProfile {
  const {
    includePricingBadges = true,
    campaignRegistry =
      EMPTY_CAMPAIGN_REGISTRY,
  } = options;

  const campaignResolution =
    resolveCampaignBadges(
      product,
      campaignRegistry,
    );

  const badges: CatalogBadge[] = [
    ...campaignResolution.badges,
  ];

  const ignoredLegacyValues:
    IgnoredLegacyBadgeValue[] = [];

  const unknownLegacyValues:
    string[] = [];

  if (
    includePricingBadges &&
    hasValidOffer(product)
  ) {
    badges.push({
      id:
        "badge:promotion.flash",

      code:
        "promotion.flash",

      label:
        "Promo Flash",

      icon:
        "⚡",

      kind:
        "promotion",

      themeToken:
        "promotion.flash",

      priority:
        120,

      source:
        "pricingRule",

      sourceReferenceId:
        null,
    });
  }

  (product.badges ?? []).forEach(
    (rawValue) => {
      const cleanValue =
        String(rawValue ?? "").trim();

      if (!cleanValue) {
        return;
      }

      const normalizedValue =
        normalizeLegacyBadgeValue(
          cleanValue,
        );

      if (
        isObsoleteLegacyBadgeValue(
          cleanValue,
        )
      ) {
        return;
      }

      const resolution =
        resolveLegacyBadgeValue(
          cleanValue,
        );

      if (!resolution) {
        const codeSegment =
          toCodeSegment(cleanValue);

        unknownLegacyValues.push(
          cleanValue,
        );

        badges.push({
          id:
            `badge:legacy.${codeSegment}`,

          code:
            `legacy.${codeSegment}`,

          label:
            cleanValue,

          icon:
            null,

          kind:
            "merchandising",

          themeToken:
            "legacy.default",

          priority:
            10,

          source:
            "legacyManual",

          sourceReferenceId:
            `legacy-badge:${codeSegment}`,
        });

        return;
      }

      if (resolution.type === "badge") {
        badges.push({
          id:
            `badge:${resolution.badge.code}`,

          ...resolution.badge,

          source:
            "legacyManual",

          sourceReferenceId:
            null,
        });

        return;
      }

      ignoredLegacyValues.push({
        value:
          cleanValue,

        normalizedValue,

        reason:
          resolution.reason,
      });
    },
  );

  return {
    badges:
      deduplicateBadges(badges),

    ignoredLegacyValues:
      deduplicateIgnoredValues(
        ignoredLegacyValues,
      ),

    unknownLegacyValues: [
      ...new Set(
        unknownLegacyValues,
      ),
    ],

    unresolvedCampaignIds:
      campaignResolution
        .unresolvedCampaignIds,
  };
}
