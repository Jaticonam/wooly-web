import {
  Minus,
  Plus,
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
            en tu caja. Las escalas indican la cantidad total objetivo.
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
            className="mt-2.5 flex w-full items-center justify-between gap-3 rounded-xl border border-[#b9dde4] bg-[#f1fbfc] px-3 py-2.5 text-left transition hover:border-[#1d8299]/45 hover:bg-[#eaf8fa] active:scale-[.99]"
          >
            <span className="min-w-0">
              <span className="block text-[9px] font-black uppercase tracking-[0.07em] text-[#1d8299]">
                Siguiente escala
              </span>

              <span className="mt-0.5 block text-[11px] font-bold leading-snug text-slate-700">
                Te faltan{" "}
                <strong>
                  {unitsToNextTier}
                </strong>{" "}
                {unitsToNextTier === 1
                  ? "unidad"
                  : "unidades"}{" "}
                para{" "}
                <strong>
                  {nextVolumePrice.qty}u
                </strong>
              </span>
            </span>

            <span className="shrink-0 text-right">
              <strong className="block text-[12px] font-black text-[#16697a]">
                S/{" "}
                {nextVolumePrice.unitPrice.toFixed(
                  2,
                )}{" "}
                c/u
              </strong>

              {savingsPerUnit > 0 ? (
                <span className="mt-0.5 block text-[9px] font-black text-emerald-600">
                  Ahorra S/{" "}
                  {savingsPerUnit.toFixed(
                    2,
                  )}{" "}
                  c/u
                </span>
              ) : null}
            </span>
          </button>
        ) : null}

        <div className="mt-2.5">
          <p className="mb-1.5 text-center text-[9px] font-black uppercase tracking-[0.07em] text-slate-400">
            {currentQty > 0
              ? "Llevar mi caja a"
              : hasOffer
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
                    "min-h-[48px] min-w-0 rounded-xl px-1.5 py-1.5 text-center transition active:scale-[.98] disabled:cursor-default disabled:opacity-45 sm:px-2",
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
