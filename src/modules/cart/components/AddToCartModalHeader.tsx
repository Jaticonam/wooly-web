import { PackagePlus, X } from "lucide-react";
import type { Product } from "@/shared/types/product";

interface Props {
  product: Product;
  onClose: () => void;
}

export function AddToCartModalHeader({
  product,
  onClose,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dbe5ee] bg-[#f8fafc] text-[#1d8299]">
          <PackagePlus className="h-[18px] w-[18px] stroke-[2.4]" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#1d8299]">
            Agregar a Mi Caja
          </p>

          <h3 className="line-clamp-1 text-[15px] font-black leading-tight text-[#0f172a] sm:text-[16px]">
            {product.title}
          </h3>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#334155]"
        aria-label="Cerrar modal"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
