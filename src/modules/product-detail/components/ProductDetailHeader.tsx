import {
  useEffect,
  useRef,
  useState,
} from "react";

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
  const [
    shareMoreOpen,
    setShareMoreOpen,
  ] =
    useState(false);

  const shareMoreRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  useEffect(
    () => {
      if (
        !shareMoreOpen
      ) {
        return;
      }

      const handlePointerDown =
        (
          event:
            PointerEvent,
        ) => {
          if (
            shareMoreRef.current &&
            !shareMoreRef.current.contains(
              event.target as Node,
            )
          ) {
            setShareMoreOpen(
              false,
            );
          }
        };

      const handleKeyDown =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setShareMoreOpen(
              false,
            );
          }
        };

      document.addEventListener(
        "pointerdown",
        handlePointerDown,
      );

      window.addEventListener(
        "keydown",
        handleKeyDown,
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          handlePointerDown,
        );

        window.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    },
    [
      shareMoreOpen,
    ],
  );

  return (
    <header className="sticky top-0 z-[100] flex w-full flex-col">
      <CountdownTimer />

      <div className="border-b border-[#e2e8f0] bg-white/95 px-2 py-1.5 shadow-[0_6px_18px_rgba(15,23,42,.05)] backdrop-blur-md sm:px-3 md:px-4 md:py-2">
        <div className="mx-auto flex min-h-[44px] max-w-[1440px] items-center gap-2">
          <button
            type="button"
            onClick={
              onBack
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#334155] shadow-sm transition-colors hover:bg-[#f8fafc]"
            aria-label="Volver al catálogo"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[12px] font-black tracking-tight text-[#0f172a] sm:text-[13px] md:text-[15px]">
              {product.title}
            </h1>

            <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.06em] text-[#94a3b8] sm:text-[9px] md:text-[10px]">
              {product.code ?? "Sin código"}
            </p>
          </div>

          <div className="hidden min-w-0 items-center gap-1.5 md:flex">
            <ProductShareActions
              title={
                product.title
              }
              description={
                product.description
              }
              url={
                shareUrl
              }
              imageUrl={
                shareImageUrl
              }
              imageSource={
                shareImageSource
              }
              pinterestEnabled={
                false
              }
              variant="header"
            />

            <button
              type="button"
              onClick={
                onShare
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#334155] shadow-sm transition-colors hover:border-[#1d8299]/30 hover:bg-[#f3fafb] hover:text-[#1d8299]"
              aria-label="Compartir con otras aplicaciones"
              title="Compartir con otras aplicaciones"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={
              shareMoreRef
            }
            className="relative flex shrink-0 items-center gap-1 md:hidden"
          >
            <ProductShareActions
              title={
                product.title
              }
              description={
                product.description
              }
              url={
                shareUrl
              }
              imageUrl={
                shareImageUrl
              }
              imageSource={
                shareImageSource
              }
              pinterestEnabled={
                false
              }
              variant="headerCompact"
              showLabel={
                false
              }
              channels={[
                "facebook",
                "whatsapp",
              ]}
            />

            <button
              type="button"
              onClick={() =>
                setShareMoreOpen(
                  (current) =>
                    !current,
                )
              }
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#334155] shadow-sm transition-colors hover:border-[#1d8299]/30 hover:bg-[#f3fafb] hover:text-[#1d8299]"
              aria-label="Más opciones para compartir"
              aria-expanded={
                shareMoreOpen
              }
              title="Más opciones para compartir"
            >
              <Share2 className="h-[15px] w-[15px]" />
            </button>

            {shareMoreOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] z-[120] w-[218px] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_38px_rgba(15,23,42,.16)]"
                role="dialog"
                aria-label="Más opciones para compartir"
              >
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.06em] text-slate-400">
                  Compartir producto
                </p>

                <ProductShareActions
                  title={
                    product.title
                  }
                  description={
                    product.description
                  }
                  url={
                    shareUrl
                  }
                  imageUrl={
                    shareImageUrl
                  }
                  imageSource={
                    shareImageSource
                  }
                  pinterestEnabled={
                    false
                  }
                  variant="headerCompact"
                  showLabel={
                    false
                  }
                  channels={[
                    "email",
                    "x",
                    "copy",
                    "pinterest",
                  ]}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShareMoreOpen(
                      false,
                    );

                    onShare();
                  }}
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#b9dde4] bg-[#f4fbfc] px-3 py-2 text-[10px] font-black text-[#16697a] transition hover:bg-[#eaf8fa]"
                >
                  <Share2 className="h-4 w-4" />
                  Más opciones
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
