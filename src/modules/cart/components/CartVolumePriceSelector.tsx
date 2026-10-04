import type {
  CartItem,
} from "@/modules/cart/types";

import {
  hasValidOfferPrice,
  VOLUME_PRICES,
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
    VOLUME_PRICES.filter(
      (tier) => {
        const value =
          item[tier.key];

        return (
          typeof value ===
            "number" &&
          Number.isFinite(
            value,
          ) &&
          value > 0
        );
      },
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
      aria-label="Escalas de cantidad"
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
              aria-label={`Seleccionar ${tier.qty} ${tier.qty === 1 ? "unidad" : "unidades"}`}
              aria-pressed={active}
              className={[
                "tier",
                "tier-button",
                tier.className,
                "min-h-[36px] min-w-0 w-full px-1 py-1.5 text-[11px] font-black sm:text-[12px]",
                active
                  ? "tier-active ring-2 ring-[#1d8299]/15"
                  : "",
              ].join(" ")}
            >
              {tier.label}
            </button>
          );
        },
      )}
    </div>
  );
}
