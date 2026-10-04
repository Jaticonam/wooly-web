import {
  Minus,
  Plus,
  TrendingUp,
} from "lucide-react";

import type {
  Product,
} from "@/shared/types/product";

import {
  getAvailableVolumePrices,
  getNextVolumePrice,
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
  onSelectTargetQuantity: (quantity: number) => void;
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
  onSelectTargetQuantity,
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

  const nextVolumePrice =
    getNextVolumePrice(
      product,
      projectedQty,
    );

  const unitsToNextTier =
    nextVolumePrice
      ? nextVolumePrice.qty -
        projectedQty
      : 0;

  const savingsPerUnit =
    nextVolumePrice
      ? Math.max(
          0,
          unitPrice -
            nextVolumePrice.unitPrice,
        )
      : 0;

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

  const quickQuantityGridClass =
    quickQuantities.length <= 1
      ? "grid-cols-1"
      : quickQuantities.length === 2
        ? "grid-cols-2"
        : quickQuantities.length === 4
          ? "grid-cols-2"
          : "grid-cols-3";

  return (
    <div className="mt-3">
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
        <img
          src={
            product.img ||
            "/placeholder.svg"
          }
          alt={product.title}
          className="h-[72px] w-[72px] shrink-0 rounded-xl border border-slate-200 bg-white object-cover sm:h-[78px] sm:w-[78px]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white px-2 py-[3px] text-[9px] font-black uppercase text-slate-500 shadow-sm">
              Código:{" "}
              {product.id}
            </span>

            <span className="rounded-full bg-[#e6f6f8] px-2 py-[3px] text-[9px] font-black capitalize text-[#1d8299]">
              {product.category}
            </span>
          </div>

          {hasOffer ? (
            <p className="mt-2 text-[10px] font-black leading-snug text-rose-600">
              Oferta válida para cualquier cantidad hasta agotar stock.
            </p>
          ) : (
            <p className="mt-2 text-[10px] font-semibold leading-snug text-slate-500">
              Define la cantidad y revisa la escala que más te conviene.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3">
        {currentQty > 0 ? (
          <div className="mb-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-[#f3fafb] px-3 py-2 text-center text-[10px] font-semibold text-slate-600">
            <span>
              Ya tienes{" "}
              <strong className="text-[#1d8299]">
                {currentQty}
              </strong>{" "}
              {currentQty === 1
                ? "unidad"
                : "unidades"}{" "}
              en tu caja.
            </span>
            <span className="text-slate-400">
              Las escalas indican el total objetivo.
            </span>
          </div>
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span
            data-testid="quick-add-quantity"
            className="min-w-[72px] rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-center text-[23px] font-black text-slate-800 shadow-sm"
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-400">
              {currentQty > 0
                ? "Llevar mi caja a"
                : hasOffer
                  ? "Cantidades rápidas"
                  : "Escalas disponibles"}
            </p>

            {!hasOffer ? (
              <span className="text-[9px] font-bold text-slate-400">
                Precio por unidad
              </span>
            ) : null}
          </div>

          <div
            className={`grid ${quickQuantityGridClass} gap-1.5 sm:gap-2`}
          >
            {quickQuantities.map(
              (targetQuantity) => {
                const quantityToAdd =
                  targetQuantity -
                  currentQty;

                const reached =
                  quantityToAdd <=
                  0;

                const shortcutUnitPrice =
                  getVolumeUnitPrice(
                    product,
                    targetQuantity,
                  );

                const shortcutTier =
                  hasOffer
                    ? null
                    : volumePrices.find(
                        (tier) =>
                          tier.qty ===
                          targetQuantity,
                      ) ??
                      null;

                const active =
                  !reached &&
                  projectedQty ===
                    targetQuantity;

                const quantityLabel =
                  targetQuantity === 1
                    ? "1 unidad"
                    : `${targetQuantity} unidades`;

                const accessibleLabel =
                  reached
                    ? `${quantityLabel} ya alcanzadas en Mi Caja`
                    : currentQty > 0
                      ? hasOffer
                        ? `Llegar a ${quantityLabel} agregando ${quantityToAdd}`
                        : `Llegar a ${quantityLabel} agregando ${quantityToAdd} a S/ ${shortcutUnitPrice.toFixed(
                            2,
                          )} c/u`
                      : hasOffer
                        ? `Seleccionar ${quantityLabel}`
                        : `Seleccionar ${quantityLabel} a S/ ${shortcutUnitPrice.toFixed(
                            2,
                          )} c/u`;

                return (
                  <button
                    key={
                      targetQuantity
                    }
                    type="button"
                    data-testid={`quick-quantity-${targetQuantity}`}
                    aria-label={
                      accessibleLabel
                    }
                    aria-pressed={
                      active
                    }
                    disabled={
                      reached
                    }
                    onClick={() =>
                      onSelectTargetQuantity(
                        targetQuantity,
                      )
                    }
                    className={[
                      "min-h-[46px] min-w-0 rounded-xl px-1.5 py-1.5 text-center transition active:scale-[.98] disabled:cursor-default disabled:opacity-45 sm:px-2",
                      hasOffer
                        ? active
                          ? "border border-[#1d8299] bg-[#e6f6f8] text-[#16697a] shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-[#1d8299]/40 hover:bg-[#f2fbfc]"
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
                      {targetQuantity}u
                    </span>

                    {reached ? (
                      <span className="mt-0.5 block text-[8px] font-extrabold uppercase text-slate-400 sm:text-[9px]">
                        Alcanzado
                      </span>
                    ) : !hasOffer ? (
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

        {nextVolumePrice ? (
          <button
            type="button"
            data-testid="next-volume-tier"
            onClick={() =>
              onSelectTargetQuantity(
                nextVolumePrice.qty,
              )
            }
            aria-label={`Completar escala de ${nextVolumePrice.qty} unidades`}
            className="mt-2.5 flex w-full items-center gap-2 rounded-lg border border-[#c9e7ec] bg-[#f3fbfc] px-3 py-2 text-left transition hover:border-[#1d8299]/40 hover:bg-[#ecf9fa] active:scale-[.99]"
          >
            <TrendingUp className="h-4 w-4 shrink-0 text-[#1d8299]" />

            <span className="min-w-0 flex-1 text-[10px] font-bold leading-snug text-slate-600">
              Te faltan{" "}
              <strong className="text-slate-800">
                {unitsToNextTier}{" "}
                {unitsToNextTier === 1
                  ? "unidad"
                  : "unidades"}
              </strong>{" "}
              para{" "}
              <strong className="text-[#16697a]">
                {nextVolumePrice.qty}u
              </strong>{" "}
              a{" "}
              <strong className="text-[#16697a]">
                S/{" "}
                {nextVolumePrice.unitPrice.toFixed(
                  2,
                )}{" "}
                c/u
              </strong>
            </span>

            {savingsPerUnit > 0 ? (
              <span className="shrink-0 text-[9px] font-black text-emerald-600">
                Ahorra S/{" "}
                {savingsPerUnit.toFixed(
                  2,
                )}{" "}
                c/u
              </span>
            ) : null}
          </button>
        ) : null}

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-slate-500">
              Precio unitario
            </span>

            <strong className="text-[14px] font-black text-[#1d8299]">
              S/{" "}
              {unitPrice.toFixed(
                2,
              )}
            </strong>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-dashed border-slate-200 pt-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.05em] text-slate-600">
              Total acumulado
            </span>

            <strong className="text-[18px] font-black text-[#0f172a]">
              S/{" "}
              {accumulatedTotal.toFixed(
                2,
              )}
            </strong>
          </div>

          <span className="sr-only">
            PU = S/ {unitPrice.toFixed(2)}
          </span>

          <span className="sr-only">
            Total acumulado = S/ {accumulatedTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
