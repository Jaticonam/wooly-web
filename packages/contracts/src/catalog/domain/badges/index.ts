export type {
  CatalogBadge,
  CatalogBadgeKind,
  CatalogBadgeSource,
  IgnoredLegacyBadgeReason,
  IgnoredLegacyBadgeValue,
  ProductCompatibilityProfile,
  ProductDisplayIndicator,
  ProductDisplayIndicatorKind,
} from "./BadgeTypes";

export {
  resolveCampaignBadges,
  type CampaignBadgeResolution,
  type CampaignRegistry,
} from "./CampaignBadgeResolver";

export {
  normalizeLegacyBadgeValue,
  resolveLegacyBadgeValue,
  type LegacyBadgeResolution,
} from "./LegacyBadgeAliases";

export {
  resolveProductCompatibility,
  type ResolveProductCompatibilityOptions,
} from "./ResolveProductCompatibility";

export {
  getProductDisplayIndicators,
  type ProductBadgeDisplayPolicy,
} from "./BadgeDisplayPolicy";
