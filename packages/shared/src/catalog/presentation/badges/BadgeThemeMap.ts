import type {
  ProductDisplayIndicator,
} from "@wooly/contracts/catalog/domain/badges";

export interface BadgeThemePresentation {
  className: string;
  animation: string;
}

const DEFAULT_PRESENTATION:
  BadgeThemePresentation = {
    className:
      "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_0_10px_rgba(15,23,42,0.22)]",

    animation:
      "",
  };

const DEFAULT_CAMPAIGN_PRESENTATION:
  BadgeThemePresentation = {
    className:
      "catalog-campaign-purple",

    animation:
      "",
  };

const BADGE_THEME_MAP:
  Record<
    string,
    BadgeThemePresentation
  > = {
    "promotion.flash": {
      className:
        "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-600 text-white shadow-[0_0_14px_rgba(147,51,234,0.30)]",

      animation:
        "animate-pulse",
    },

    "merchandising.bestSeller": {
      className:
        "bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(249,115,22,0.28)]",

      animation:
        "",
    },

    "merchandising.new": {
      className:
        "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.26)]",

      animation:
        "",
    },

    "merchandising.premium": {
      className:
        "border-amber-300/30 bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-800 text-amber-200 shadow-[0_0_12px_rgba(15,23,42,0.30)]",

      animation:
        "",
    },

    "campaign.morado": {
      className:
        "catalog-campaign-purple",

      animation:
        "",
    },

    "campaign.rosado": {
      className:
        "catalog-campaign-pink",

      animation:
        "",
    },

    "campaign.azul": {
      className:
        "catalog-campaign-blue",

      animation:
        "",
    },

    "campaign.verde": {
      className:
        "catalog-campaign-green",

      animation:
        "",
    },

    "campaign.rojo": {
      className:
        "catalog-campaign-red",

      animation:
        "",
    },

    "campaign.dorado": {
      className:
        "catalog-campaign-gold",

      animation:
        "",
    },

    "campaign.turquesa": {
      className:
        "catalog-campaign-teal",

      animation:
        "",
    },

    "campaign.negro": {
      className:
        "catalog-campaign-dark",

      animation:
        "",
    },

    "campaign.naranja": {
      className:
        "catalog-campaign-orange",

      animation:
        "",
    },

    "campaign.coral": {
      className:
        "catalog-campaign-coral",

      animation:
        "",
    },

    "campaign.lavanda": {
      className:
        "catalog-campaign-lavender",

      animation:
        "",
    },

    "campaign.plata": {
      className:
        "catalog-campaign-silver",

      animation:
        "",
    },

    "campaign.cobre": {
      className:
        "catalog-campaign-copper",

      animation:
        "",
    },

    "campaign.esmeralda": {
      className:
        "catalog-campaign-emerald",

      animation:
        "",
    },

    "campaign.vino": {
      className:
        "catalog-campaign-wine",

      animation:
        "",
    },

    "campaign.celeste": {
      className:
        "catalog-campaign-sky",

      animation:
        "",
    },

    "campaign.fucsia": {
      className:
        "catalog-campaign-fuchsia",

      animation:
        "",
    },

    "campaign.amarillo": {
      className:
        "catalog-campaign-yellow",

      animation:
        "",
    },

    "legacy.default":
      DEFAULT_PRESENTATION,
  };

export function getBadgeThemePresentation(
  themeToken: string,
): BadgeThemePresentation {
  const presentation =
    BADGE_THEME_MAP[
      themeToken
    ];

  if (presentation) {
    return presentation;
  }

  if (
    themeToken.startsWith(
      "campaign.",
    )
  ) {
    return (
      DEFAULT_CAMPAIGN_PRESENTATION
    );
  }

  return DEFAULT_PRESENTATION;
}

export function formatBadgeDisplayText(
  indicator:
    ProductDisplayIndicator,
): string {
  if (!indicator.icon) {
    return indicator.label;
  }

  if (
    indicator.kind ===
    "promotion"
  ) {
    return `${indicator.label} ${indicator.icon}`;
  }

  return `${indicator.icon} ${indicator.label}`;
}
