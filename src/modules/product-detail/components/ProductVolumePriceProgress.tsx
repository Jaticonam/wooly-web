import type {
  Product,
} from "@/shared/types/product";

import {
  getAvailableVolumePrices,
  getVolumeUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

import type {
  NextVolumePrice,
} from "@/shared/domain/volumePricing/VolumePricing";

interface ProductVolumePriceProgressProps {
  product: Product;
  effectiveQty: number;
  nextVolumePrice: NextVolumePrice | null;
  onSelectQty: (quantity: number) => void;
}

export function ProductVolumePriceProgress({
  product,
  effectiveQty,
  nextVolumePrice,
  onSelectQty,
}: ProductVolumePriceProgressProps) {
  const volumePrices =
    getAvailableVolumePrices(
      product,
    );

  if (
    volumePrices.length <= 1
  ) {
    return null;
  }

  if (
    !nextVolumePrice
  ) {
    return (
      <div
        data-testid="product-detail-best-price"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center"
      >
        <span className="text-[11px] font-black text-emerald-700">
          ✓ Mejor precio disponible activado
        </span>
      </div>
    );
  }

  const missingQty =
    Math.max(
      nextVolumePrice.qty -
        effectiveQty,
      0,
    );

  const currentUnitPrice =
    getVolumeUnitPrice(
      product,
      effectiveQty,
    );

  const savingsPerUnit =
    Math.max(
      0,
      currentUnitPrice -
        nextVolumePrice.unitPrice,
    );

  return (
    <button
      type="button"
      data-testid="product-detail-next-tier"
      onClick={() =>
        onSelectQty(
          nextVolumePrice.qty,
        )
      }
      aria-label={`Completar escala de ${nextVolumePrice.qty} unidades`}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#b9dde4] bg-[#f1fbfc] px-3 py-2.5 text-left transition hover:border-[#1d8299]/45 hover:bg-[#eaf8fa] active:scale-[.99]"
    >
      <span className="min-w-0">
        <span className="block text-[9px] font-black uppercase tracking-[0.07em] text-[#1d8299]">
          Siguiente escala
        </span>

        <span className="mt-0.5 block text-[11px] font-bold leading-snug text-slate-700">
          Te faltan{" "}
          <strong>
            {missingQty}
          </strong>{" "}
          {missingQty === 1
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
  );
}
