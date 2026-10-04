import { Minus, Plus } from "lucide-react";

interface ProductQuantitySelectorProps {
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function ProductQuantitySelector({
  value,
  onDecrease,
  onIncrease,
  onChange,
  onBlur,
  onKeyDown,
}: ProductQuantitySelectorProps) {
  const numericValue =
    /^\d+$/.test(
      value,
    )
      ? Number(
          value,
        )
      : null;

  const decreaseDisabled =
    numericValue === null ||
    numericValue <= 1;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="min-w-0">
        <span className="block text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
          Cantidad total
        </span>

        <span className="mt-0.5 block text-[11px] font-semibold text-slate-600">
          Puedes escribirla o ajustarla
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          disabled={decreaseDisabled}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#334155] shadow-sm transition-colors hover:bg-[#eef2f6] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Disminuir cantidad"
        >
          <Minus className="h-4 w-4" />
        </button>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder="0"
          className="h-11 w-[74px] rounded-xl border border-[#d8e2ed] bg-white text-center text-[20px] font-black text-[#334155] shadow-sm outline-none transition focus:border-[#1d8299] focus:ring-2 focus:ring-[#1d8299]/10 placeholder:text-muted-foreground/50 sm:w-20"
          aria-label="Cantidad"
        />

        <button
          type="button"
          onClick={onIncrease}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#334155] shadow-sm transition-colors hover:bg-[#eef2f6]"
          aria-label="Aumentar cantidad"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
