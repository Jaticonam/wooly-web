import { ArrowLeft, Share2 } from "lucide-react";
import type { Product } from "@/shared/types/product";
import { CountdownTimer } from "@/shared/components/commerce/CountdownTimer";

interface ProductDetailHeaderProps {
  product: Product;
  onBack: () => void;
  onShare: () => void;
}

export function ProductDetailHeader({
  product,
  onBack,
  onShare,
}: ProductDetailHeaderProps) {
  return (
    <header className="sticky top-0 z-[100] flex w-full flex-col">
      <CountdownTimer />

      <div className="border-b border-[#e2e8f0] bg-white/95 px-2.5 py-2 shadow-[0_6px_18px_rgba(15,23,42,.05)] backdrop-blur-md sm:px-4 md:py-2.5">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#334155] shadow-sm transition-colors hover:bg-[#f8fafc]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex-grow min-w-0">
            <h1 className="truncate text-[13px] font-black tracking-tight text-[#0f172a] sm:text-[14px] md:text-[15px]">
              {product.title}
            </h1>

            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-[#94a3b8] sm:text-[10px]">
              {product.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onShare}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#334155] shadow-sm transition-colors hover:border-[#1d8299]/30 hover:bg-[#f3fafb] hover:text-[#1d8299]"
            aria-label="Compartir producto"
            title="Compartir producto"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
