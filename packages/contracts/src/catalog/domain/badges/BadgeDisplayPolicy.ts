import type {
  ProductCompatibilityProfile,
  ProductDisplayIndicator,
} from "./BadgeTypes";

export interface ProductBadgeDisplayPolicy {
  maxVisible?: number;
}

export function getProductDisplayIndicators(
  profile: ProductCompatibilityProfile,
  policy:
    ProductBadgeDisplayPolicy = {},
): ProductDisplayIndicator[] {
  const {
    maxVisible = 2,
  } = policy;

  /**
   * Solo una campaña ocupa el primer slot:
   * la campaña activa de mayor prioridad.
   */
  const campaignIndicator =
    profile.badges
      .filter(
        (badge) =>
          badge.kind === "campaign",
      )
      .sort(
        (a, b) =>
          b.priority - a.priority,
      )[0];

  const commercialIndicators =
    profile.badges
      .filter(
        (badge) =>
          badge.kind !== "campaign",
      )
      .sort(
        (a, b) =>
          b.priority - a.priority,
      );

  const ordered = [
    campaignIndicator,
    ...commercialIndicators,
  ].filter(
    (
      indicator,
    ): indicator is ProductDisplayIndicator =>
      Boolean(indicator),
  );

  return ordered.slice(
    0,
    Math.max(maxVisible, 0),
  );
}
