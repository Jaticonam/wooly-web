import type {
  Product,
} from "@/shared/types/product";

import {
  getAvailableVolumePrices,
  getVolumeUnitPrice,
  hasValidOfferPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

interface ProductVolumePriceSelectorProps {
  product: Product;
  effectiveQty: number;
  onSelectQty: (qty: number) => void;
}

const OFFER_QUICK_QUANTITIES = [
  1,
  3,
  12,
  50,
  100,
] as const;

function getQuantityLabel(
  quantity: number,
): string {
  return quantity === 1
    ? "1 unidad"
    : `${quantity} unidades`;
}

export function ProductVolumePriceSelector({
  product,
  effectiveQty,
  onSelectQty,
}: ProductVolumePriceSelectorProps) {
  const hasOffer =
    hasValidOfferPrice(
      product,
    );

  if (hasOffer) {
    return (
      <div>
        <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:text-left">
          Cantidad rápida
        </p>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {OFFER_QUICK_QUANTITIES.map(
            (quantity) => {
              const active =
                effectiveQty ===
                quantity;

              const unitPrice =
                getVolumeUnitPrice(
                  product,
                  quantity,
                );

              return (
                <button
                  key={quantity}
                  type="button"
                  onClick={() =>
                    onSelectQty(
                      quantity,
                    )
                  }
                  aria-label={`Seleccionar ${getQuantityLabel(
                    quantity,
                  )} a S/ ${unitPrice.toFixed(
                    2,
                  )} c/u`}
                  aria-pressed={active}
                  data-testid={`product-detail-quick-quantity-${quantity}`}
                  className={[
                    "min-h-[48px] min-w-0 rounded-xl border px-1.5 py-2 text-center transition active:scale-[.98] sm:px-2",
                    active
                      ? "border-[#1d8299] bg-[#e6f6f8] text-[#1d8299] shadow-sm ring-2 ring-[#1d8299]/10"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span className="block text-[12px] font-black sm:text-[13px]">
                    {quantity}u
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>
    );
  }

  const availableTiers =
    getAvailableVolumePrices(
      product,
    );

  const tierGridClass =
    availableTiers.length <= 1
      ? "grid-cols-1"
      : availableTiers.length === 2
        ? "grid-cols-2"
        : availableTiers.length === 3
          ? "grid-cols-3"
          : availableTiers.length === 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-3 sm:grid-cols-5";

  return (
    <div>
      <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:text-left">
        Precios por cantidad
      </p>

      <div
        className={`grid ${tierGridClass} gap-1.5 sm:gap-2`}
      >
        {availableTiers.map(
          (
            tier,
            index,
          ) => {
            const nextTier =
              availableTiers[
                index + 1
              ];

            const active =
              effectiveQty >=
                tier.qty &&
              (
                !nextTier ||
                effectiveQty <
                  nextTier.qty
              );

            return (
              <button
                key={tier.key}
                type="button"
                onClick={() =>
                  onSelectQty(
                    tier.qty,
                  )
                }
                aria-label={`Seleccionar ${getQuantityLabel(
                  tier.qty,
                )} a S/ ${tier.unitPrice.toFixed(
                  2,
                )} c/u`}
                aria-pressed={active}
                data-testid={`product-detail-volume-tier-${tier.qty}`}
                className={[
                  "tier",
                  "tier-button",
                  tier.className,
                  "!flex min-h-[54px] min-w-0 !flex-col !items-center !justify-center !gap-0.5 px-1.5 py-2 text-center sm:min-h-[56px] sm:px-2",
                  active
                    ? "tier-active ring-2 ring-[#1d8299]/20"
                    : "",
                ].join(" ")}
              >
                <span className="block text-[12px] font-black leading-none tracking-[-0.01em] sm:text-[13px]">
                  {tier.qty}u
                </span>

                <span className="block whitespace-nowrap text-[9px] font-extrabold leading-none sm:text-[10px]">
                  S/{" "}
                  {tier.unitPrice.toFixed(
                    2,
                  )}{" "}
                  <span className="font-bold opacity-75">
                    c/u
                  </span>
                </span>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
