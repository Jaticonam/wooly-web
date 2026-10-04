import type {
  CartItem,
} from "@/modules/cart/types";

import {
  getAvailableVolumePrices,
  hasValidOfferPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

interface CartVolumePriceSelectorProps {
  item: CartItem;
  onSetQty: (
    id: string,
    qty: number | null,
  ) => void;
}

export function CartVolumePriceSelector({
  item,
  onSetQty,
}: CartVolumePriceSelectorProps) {
  /*
   * La oferta es un régimen comercial exclusivo.
   * Mientras esté activa, este selector no debe exponer
   * ni permitir seleccionar cantidades de tiers.
   */
  if (
    hasValidOfferPrice(
      item,
    )
  ) {
    return null;
  }

  const itemTiers =
    getAvailableVolumePrices(
      item,
    );

  return (
    <div
      className="grid min-w-0 flex-1 gap-1"
      style={{
        gridTemplateColumns:
          `repeat(${Math.max(
            itemTiers.length,
            1,
          )}, minmax(0, 1fr))`,
      }}
      aria-label="Escalas de precio"
    >
      {itemTiers.map(
        (
          tier,
          index,
        ) => {
          const nextTier =
            itemTiers[
              index + 1
            ];

          const active =
            item.qty >=
              tier.qty &&
            (!nextTier ||
              item.qty <
                nextTier.qty);

          return (
            <button
              key={tier.key}
              type="button"
              onClick={() =>
                onSetQty(
                  item.id,
                  tier.qty,
                )
              }
              className={[
                "tier",
                "tier-button",
                tier.className,
                "min-h-[42px] min-w-0 w-full px-1 py-1.5",
                active
                  ? "tier-active scale-[1.02]"
                  : "hover:scale-[1.02]",
              ].join(" ")}
            >
              <span className="block text-[10px] font-black leading-none">
                {tier.label}
              </span>

              <span className="mt-1 block truncate text-[8px] font-black leading-none opacity-80">
                S/{" "}
                {tier.unitPrice.toFixed(
                  2,
                )}
              </span>
            </button>
          );
        },
      )}
    </div>
  );
}
