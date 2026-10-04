import {
  Minus,
  Plus,
} from "lucide-react";

import type {
  Product,
} from "@/shared/types/product";

import {
  getAvailableVolumePrices,
  getVolumeUnitPrice,
  hasValidOfferPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

interface Props {
  product: Product;
  currentQty: number;
  selectedQty: number;
  minimumQty: number;
  maximumQty: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onSelectQuantity: (quantity: number) => void;
}

const OFFER_QUICK_QUANTITIES = [
  1,
  3,
  12,
  50,
  100,
] as const;

export function AddToCartModalInfo({
  product,
  currentQty,
  selectedQty,
  minimumQty,
  maximumQty,
  onDecrease,
  onIncrease,
  onSelectQuantity,
}: Props) {
  const hasOffer =
    hasValidOfferPrice(
      product,
    );

  const projectedQty =
    currentQty +
    selectedQty;

  const unitPrice =
    getVolumeUnitPrice(
      product,
      projectedQty,
    );

  const accumulatedTotal =
    projectedQty *
    unitPrice;

  const volumePrices =
    hasOffer
      ? []
      : getAvailableVolumePrices(
          product,
        );

  const quickQuantities =
    (
      hasOffer
        ? [
            ...OFFER_QUICK_QUANTITIES,
          ]
        : volumePrices.map(
            (tier) =>
              tier.qty,
          )
    ).filter(
      (quantity) =>
        quantity >=
          minimumQty &&
        quantity <=
          maximumQty,
    );

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-3">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={
            product.img ||
            "/placeholder.svg"
          }
          alt={product.title}
          className="h-[92px] w-[92px] shrink-0 rounded-2xl border border-slate-200 bg-white object-cover sm:h-[108px] sm:w-[108px]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-100 px-2 py-[3px] text-[9px] font-black uppercase text-slate-500 sm:text-[10px]">
              Código:{" "}
              {product.id}
            </span>

            <span className="rounded-full bg-[#e6f6f8] px-2 py-[3px] text-[9px] font-black capitalize text-[#1d8299] sm:text-[10px]">
              {
                product.category
              }
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-[12px] font-bold leading-snug text-slate-600 sm:text-[13px]">
            Selecciona cuántas unidades quieres agregar.
          </p>

          {hasOffer ? (
            <p className="mt-1.5 text-[11px] font-black leading-snug text-rose-600">
              Oferta válida para cualquier cantidad hasta agotar stock.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
        {currentQty > 0 ? (
          <p className="mb-2.5 text-center text-[11px] font-semibold text-slate-600">
            Ya tienes{" "}
            <strong className="text-[#1d8299]">
              {currentQty}
            </strong>{" "}
            {currentQty === 1
              ? "unidad"
              : "unidades"}{" "}
            en tu caja.
          </p>
        ) : null}

        <p className="text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
          Cantidad a agregar
        </p>

        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={
              onDecrease
            }
            disabled={
              selectedQty <=
              minimumQty
            }
            aria-label="Disminuir cantidad"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span
            data-testid="quick-add-quantity"
            className="min-w-[68px] rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-center text-[22px] font-black text-slate-800 shadow-sm"
          >
            {selectedQty}
          </span>

          <button
            type="button"
            onClick={
              onIncrease
            }
            disabled={
              selectedQty >=
              maximumQty
            }
            aria-label="Aumentar cantidad"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5">
          <p className="mb-1.5 text-center text-[9px] font-black uppercase tracking-[0.07em] text-slate-400">
            {hasOffer
              ? "Cantidades rápidas"
              : "Escalas disponibles"}
          </p>

          <div
            className="grid gap-1.5 sm:gap-2"
            style={{
              gridTemplateColumns:
                `repeat(${Math.max(
                  quickQuantities.length,
                  1,
                )}, minmax(0, 1fr))`,
            }}
          >
          {quickQuantities.map(
            (quantity) => {
              const shortcutProjectedQty =
                currentQty +
                quantity;

              const shortcutUnitPrice =
                getVolumeUnitPrice(
                  product,
                  shortcutProjectedQty,
                );

              const shortcutTier =
                hasOffer
                  ? null
                  : [
                      ...volumePrices,
                    ]
                      .reverse()
                      .find(
                        (tier) =>
                          shortcutProjectedQty >=
                          tier.qty,
                      ) ??
                    volumePrices[0] ??
                    null;

              const active =
                selectedQty ===
                quantity;

              const quantityLabel =
                quantity === 1
                  ? "1 unidad"
                  : `${quantity} unidades`;

              const accessibleLabel =
                hasOffer
                  ? `Seleccionar ${quantityLabel}`
                  : `Seleccionar ${quantityLabel} a S/ ${shortcutUnitPrice.toFixed(
                      2,
                    )} c/u`;

              return (
                <button
                  key={
                    quantity
                  }
                  type="button"
                  data-testid={`quick-quantity-${quantity}`}
                  aria-label={
                    accessibleLabel
                  }
                  aria-pressed={
                    active
                  }
                  onClick={() =>
                    onSelectQuantity(
                      quantity,
                    )
                  }
                  className={[
                    "min-h-[48px] min-w-0 rounded-xl px-1.5 py-1.5 text-center transition active:scale-[.98] sm:px-2",
                    hasOffer
                      ? active
                        ? "border border-[#1d8299] bg-[#e6f6f8] text-[#16697a] shadow-sm"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#1d8299]/40 hover:bg-[#f2fbfc]"
                      : [
                          "tier",
                          "tier-chip",
                          shortcutTier?.className ??
                            "",
                          active
                            ? "tier-active ring-2 ring-[#1d8299]/25"
                            : "",
                        ].join(
                          " ",
                        ),
                  ].join(
                    " ",
                  )}
                >
                  <span className="block text-[12px] font-black sm:text-[13px]">
                    {quantity}u
                  </span>

                  {!hasOffer ? (
                    <span className="mt-0.5 block truncate text-[9px] font-extrabold sm:text-[10px]">
                      S/{" "}
                      {shortcutUnitPrice.toFixed(
                        2,
                      )}
                    </span>
                  ) : null}
                </button>
              );
            },
          )}
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <span className="block text-[9px] font-black uppercase tracking-[0.06em] text-slate-500">
              PU =
            </span>

            <strong className="mt-0.5 block text-[15px] font-black text-[#1d8299]">
              S/{" "}
              {unitPrice.toFixed(
                2,
              )}
            </strong>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <span className="block text-[9px] font-black uppercase tracking-[0.06em] text-slate-500">
              Total acumulado =
            </span>

            <strong className="mt-0.5 block text-[17px] font-black text-[#0f172a]">
              S/{" "}
              {accumulatedTotal.toFixed(
                2,
              )}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
