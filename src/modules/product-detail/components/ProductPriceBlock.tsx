import type {
  NextVolumePrice,
} from "@/shared/domain/volumePricing/VolumePricing";

interface ProductPriceBlockProps {
  unitPrice: number;
  total: number;
  effectiveQty: number;
  pricePulse: boolean;
  showUnlock: boolean;
  savingsByQty: number;
  basePrice: number;
  nextVolumePrice: NextVolumePrice | null;
  isQtyInputValid: boolean;
  hasOffer: boolean;
  showTotal?: boolean;
}

export function ProductPriceBlock({
  unitPrice,
  total,
  effectiveQty,
  pricePulse,
  savingsByQty,
  basePrice,
  isQtyInputValid,
  hasOffer,
  showTotal = true,
}: ProductPriceBlockProps) {
  return (
    <div className="text-center md:text-left">
      {hasOffer && (
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <span className="text-[13px] font-semibold text-slate-400 line-through decoration-2">
            S/ {basePrice.toFixed(2)}
          </span>

          <span className="rounded-full border border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 via-purple-50 to-violet-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em] text-purple-700 shadow-[0_2px_10px_rgba(147,51,234,.12)]">
            ⚡ AHORRAS
          </span>
        </div>
      )}

      <div
        className={
          showTotal
            ? "grid grid-cols-2 gap-2"
            : "grid grid-cols-1 gap-2"
        }
      >
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <span className="block text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            Precio unitario
          </span>

          <strong
            data-testid="product-detail-unit-price"
            className={[
              "mt-0.5 block text-[21px] font-black tracking-tight transition-transform duration-200 md:text-[23px]",
              hasOffer
                ? "text-red-600"
                : "text-[#1d8299]",
              pricePulse
                ? "scale-105"
                : "scale-100",
            ].join(" ")}
          >
            S/ {unitPrice.toFixed(2)}
          </strong>
        </div>

        {showTotal && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
            <span className="block text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
              Total · {effectiveQty}u
            </span>

            <strong
              data-testid="product-detail-total"
              className="mt-0.5 block text-[21px] font-black tracking-tight text-slate-900 md:text-[23px]"
            >
              S/ {total.toFixed(2)}
            </strong>
          </div>
        )}
      </div>

      {showTotal && savingsByQty > 0 && (
        <p
          data-testid="product-detail-savings"
          className="mt-2 text-[11px] font-black text-emerald-600"
        >
          Ahorro total: S/{" "}
          {savingsByQty.toFixed(
            2,
          )}
        </p>
      )}

      {hasOffer && (
        <p className="mt-1.5 text-[11px] font-semibold leading-snug text-slate-600">
          La oferta aplica a cualquier cantidad hasta agotar stock.
        </p>
      )}

      {!isQtyInputValid && (
        <p className="mt-2 text-sm font-semibold text-destructive">
          Ingresa una cantidad válida para continuar
        </p>
      )}
    </div>
  );
}
