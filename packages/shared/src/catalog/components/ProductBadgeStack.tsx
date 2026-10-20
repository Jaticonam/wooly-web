import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  useCatalogCampaignRegistry,
} from "../context/CatalogCampaignRegistryContext";

import {
  getProductDisplayIndicators,
  resolveProductCompatibility,
} from "@wooly/contracts/catalog/domain/badges";

import {
  formatBadgeDisplayText,
  getBadgeThemePresentation,
} from "../presentation/badges";

interface ProductBadgeStackProps {
  product: Product;

  maxVisible?: number;
  includePricingBadges?: boolean;

  variant?: "card" | "detail";
  className?: string;
}

const VARIANT_CLASS_MAP = {
  card:
    "px-5 py-0.5 text-[10px] font-bold md:text-[11px]",

  detail:
    "px-3 py-1.5 text-[10px] font-semibold leading-tight tracking-normal md:text-[11px]",
};

export function ProductBadgeStack({
  product,
  maxVisible = 2,
  includePricingBadges = true,
  variant = "card",
  className = "",
}: ProductBadgeStackProps) {
  const {
    campaignById,
  } =
    useCatalogCampaignRegistry();

  const profile =
    resolveProductCompatibility(
      product,
      {
        includePricingBadges,

        campaignRegistry:
          campaignById,
      },
    );

  const indicators =
    getProductDisplayIndicators(
      profile,
      {
        maxVisible,
      },
    );

  if (
    indicators.length === 0
  ) {
    return null;
  }

  return (
    <div className={className}>
      {indicators.map(
        (indicator) => {
          const presentation =
            getBadgeThemePresentation(
              indicator.themeToken,
            );

          return (
            <div
              key={`${product.id}-${indicator.id}`}
              className={[
                "rounded-full",
                "border border-white/10",
                "backdrop-blur-sm",
                "shadow-md",
                VARIANT_CLASS_MAP[
                  variant
                ],
                presentation.className,
                presentation.animation,
              ]
                .filter(Boolean)
                .join(" ")}
              data-badge-code={
                indicator.code
              }
              data-badge-kind={
                indicator.kind
              }
              data-badge-source={
                indicator.source
              }
              data-badge-reference={
                indicator.sourceReferenceId ??
                undefined
              }
            >
              {formatBadgeDisplayText(
                indicator,
              )}
            </div>
          );
        },
      )}
    </div>
  );
}
