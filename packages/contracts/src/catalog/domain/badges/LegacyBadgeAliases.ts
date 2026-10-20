import type {
  CatalogBadgeKind,
  IgnoredLegacyBadgeReason,
} from "./BadgeTypes";

interface LegacyBadgeDescriptor {
  code: string;
  label: string;
  icon: string | null;

  kind: CatalogBadgeKind;
  themeToken: string;
  priority: number;
}

export type LegacyBadgeResolution =
  | {
      type: "badge";
      badge: LegacyBadgeDescriptor;
    }
  | {
      type: "ignored";
      reason: IgnoredLegacyBadgeReason;
    };

export function normalizeLegacyBadgeValue(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[✨⚡🔥🚀💎]\uFE0F?/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const BEST_SELLER_ALIASES = new Set([
  "mas vendido",
  "best seller",
  "bestseller",
  "favorito",
  "popular",
]);

const NEW_PRODUCT_ALIASES = new Set([
  "nuevo",
  "nuevo ingreso",
  "novedad",
]);

const PREMIUM_ALIASES = new Set([
  "premium",
  "seleccion premium",
]);

const REDUNDANT_DEFAULT_ALIASES = new Set([
  "evergreen",
]);

const OBSOLETE_LEGACY_BADGE_VALUES = new Set([
  "todo el ano",
  "todo-el-ano",
]);

const CAMPAIGN_VALUE_ALIASES = new Set([
  "dia de la novia",
]);

export function isObsoleteLegacyBadgeValue(
  value: string,
): boolean {
  return OBSOLETE_LEGACY_BADGE_VALUES.has(
    normalizeLegacyBadgeValue(value),
  );
}

export function resolveLegacyBadgeValue(
  value: string,
): LegacyBadgeResolution | null {
  const normalizedValue =
    normalizeLegacyBadgeValue(value);

  if (!normalizedValue) {
    return null;
  }

  if (
    BEST_SELLER_ALIASES.has(
      normalizedValue,
    )
  ) {
    return {
      type: "badge",

      badge: {
        code:
          "merchandising.bestSeller",

        label:
          "Más vendido",

        icon: null,

        kind:
          "merchandising",

        themeToken:
          "merchandising.bestSeller",

        priority: 80,
      },
    };
  }

  if (
    NEW_PRODUCT_ALIASES.has(
      normalizedValue,
    )
  ) {
    return {
      type: "badge",

      badge: {
        code:
          "merchandising.new",

        label:
          "Nuevo",

        icon:
          "✨",

        kind:
          "merchandising",

        themeToken:
          "merchandising.new",

        priority: 75,
      },
    };
  }

  if (
    PREMIUM_ALIASES.has(
      normalizedValue,
    )
  ) {
    return {
      type: "badge",

      badge: {
        code:
          "merchandising.premium",

        label:
          "Premium",

        icon:
          "💎",

        kind:
          "merchandising",

        themeToken:
          "merchandising.premium",

        priority: 70,
      },
    };
  }

  if (
    REDUNDANT_DEFAULT_ALIASES.has(
      normalizedValue,
    )
  ) {
    return {
      type: "ignored",
      reason: "redundantDefault",
    };
  }

  if (
    CAMPAIGN_VALUE_ALIASES.has(
      normalizedValue,
    )
  ) {
    return {
      type: "ignored",

      reason:
        "campaignMustComeFromSheetCampaign",
    };
  }

  return null;
}
