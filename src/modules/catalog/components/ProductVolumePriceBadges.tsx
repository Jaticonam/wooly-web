import type { Product } from "@/shared/types/product";
import {
  getAvailableVolumePrices,
} from "@/shared/domain/volumePricing/VolumePricing";

const TIER_LABELS = {
  price_1: "Unidad",
  price_3: "Por Mayor",
  price_12: "Por Docena",
  price_50: "Medio ciento",
  price_100: "Por Caja",
} as const;

interface Props {
  product: Product;
  available: boolean;
  isPreventa: boolean;
  maxTiers?: number;
}

export function ProductVolumePriceBadges({
  product,
  available,
  isPreventa,
  maxTiers,
}: Props) {
  if (!available || isPreventa) return null;

  const tiers = getAvailableVolumePrices(product, {
    includeBasePrice: false,
  }).filter((tier) => {
    return (
      tier.unitPrice <
      product.price_1
    );
  });

  if (!tiers.length) return null;

  const visibleTiers =
    typeof maxTiers === "number"
      ? tiers.slice(
          0,
          Math.max(0, maxTiers),
        )
      : tiers;

  const hiddenTierCount =
    tiers.length -
    visibleTiers.length;

  return (
    <div className="wholesale-list">
      <div className="wholesale-title mt-1 border-t border-dashed border-slate-300 pt-1.5">
        <span>📦</span>
        <span>Precios mayorista</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {visibleTiers.map((tier) => {
          const totalPrice =
            tier.unitPrice *
            tier.qty;

          return (
            <div
              key={tier.key}
              className={`wholesale-chip tier tier-chip ${tier.className}`}
            >
              <span className="block w-full text-center">
                {TIER_LABELS[tier.key]} ({tier.label}) × S/
                {totalPrice.toFixed(0)}
              </span>
            </div>
          );
        })}

        {hiddenTierCount > 0 ? (
          <span className="wholesale-more">
            +{hiddenTierCount} escalas
          </span>
        ) : null}
      </div>
    </div>
  );
}

