import {
  ArrowLeft,
  Share2,
} from "lucide-react";

import type {
  Product,
} from "@/shared/types/product";

import {
  CountdownTimer,
} from "@/shared/components/commerce/CountdownTimer";

import {
  ProductShareActions,
} from "./ProductShareActions";

interface ProductDetailHeaderProps {
  product: Product;
  onBack: () => void;
  onShare: () => void;
  shareUrl: string;
  shareImageUrl?: string | null;
  shareImageSource?: string;
}

export function ProductDetailHeader({
  product,
  onBack,
  onShare,
  shareUrl,
  shareImageUrl,
  shareImageSource,
}: ProductDetailHeaderProps) {
  return (
    <header className="sticky top-0 z-[100] flex w-full flex-col">
      <CountdownTimer />

      <div className="border-b border-[#e2e8f0] bg-white/95 px-2.5 py-2 shadow-[0_6px_18px_rgba(15,23,42,.05)] backdrop-blur-md sm:px-4 md:py-2.5">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#334155] shadow-sm transition-colors hover:bg-[#f8fafc]"
              aria-label="Volver al catálogo"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[13px] font-black tracking-tight text-[#0f172a] sm:text-[14px] md:text-[15px]">
                {product.title}
              </h1>

              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-[#94a3b8] sm:text-[10px]">
                {product.id}
              </p>
            </div>

            <div className="hidden min-w-0 items-center gap-2 md:flex">
              <ProductShareActions
                title={product.title}
                description={product.description}
                url={shareUrl}
                imageUrl={shareImageUrl}
                imageSource={shareImageSource}
                pinterestEnabled={false}
                variant="header"
              />

              <button
                type="button"
                onClick={onShare}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#334155] shadow-sm transition-colors hover:border-[#1d8299]/30 hover:bg-[#f3fafb] hover:text-[#1d8299]"
                aria-label="Más opciones para compartir"
                title="Más opciones para compartir"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onShare}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#334155] shadow-sm transition-colors hover:border-[#1d8299]/30 hover:bg-[#f3fafb] hover:text-[#1d8299] md:hidden"
              aria-label="Más opciones para compartir"
              title="Más opciones para compartir"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 border-t border-slate-100 pt-2 md:hidden">
            <ProductShareActions
              title={product.title}
              description={product.description}
              url={shareUrl}
              imageUrl={shareImageUrl}
              imageSource={shareImageSource}
              pinterestEnabled={false}
              variant="header"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
