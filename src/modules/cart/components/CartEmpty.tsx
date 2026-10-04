import { ShoppingBag } from "lucide-react";

interface CartEmptyProps {
  onContinueShopping?: () => void;
}

export function CartEmpty({
  onContinueShopping,
}: CartEmptyProps) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#1d8299] shadow-sm">
        <ShoppingBag className="h-6 w-6" />
      </div>

      <p className="mt-3 text-[14px] font-black tracking-tight text-slate-800">
        Tu caja está vacía
      </p>

      <p className="mt-1 max-w-[250px] text-[11px] font-semibold leading-relaxed text-slate-500">
        Agrega productos del catálogo y aquí podrás revisar cantidades, precios y tu pedido antes de enviarlo.
      </p>

      {onContinueShopping ? (
        <button
          type="button"
          onClick={
            onContinueShopping
          }
          className="mt-4 min-h-[42px] rounded-xl border border-[#b9dde4] bg-[#f1fbfc] px-4 py-2 text-[12px] font-black text-[#16697a] transition hover:bg-[#e6f6f8] active:scale-[.98]"
        >
          Seguir comprando
        </button>
      ) : null}
    </div>
  );
}
