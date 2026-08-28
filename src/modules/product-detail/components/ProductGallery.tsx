import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type { Product } from "@/shared/types/product";
import { getProductMedia } from "@/shared/lib/productMedia";
import { ProductBadgeStack } from "@/modules/catalog/components/ProductBadgeStack";
import { ProductCaptureButton } from "@/modules/catalog/components/ProductCaptureButton";

interface ProductGalleryProps {
  product: Product;
  available: boolean;
  onZoom: (initialIndex: number) => void;
}

export function ProductGallery({
  product,
  available,
  onZoom,
}: ProductGalleryProps) {
  const media = useMemo(() => getProductMedia(product), [product]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const activeMedia = media[activeIndex] ?? media[0];
  const hasMany = media.length > 1;

  const maxVisibleThumbs = 5;
  const visibleMedia = media.slice(0, maxVisibleThumbs);
  const hiddenCount = Math.max(media.length - maxVisibleThumbs, 0);

  const goPrev = () =>
    setActiveIndex((i) => (i === 0 ? media.length - 1 : i - 1));
  const goNext = () =>
    setActiveIndex((i) => (i === media.length - 1 ? 0 : i + 1));

  useEffect(() => {
    setActiveIndex(0);
  }, [product.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasMany || touchStartX.current === null) return;

    const diff = touchStartX.current - e.changedTouches[0].clientX;

    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStartX.current = null;
  };

  return (
    <div className="relative flex flex-col gap-3 md:grid md:grid-cols-[96px_minmax(0,1fr)] xl:grid-cols-[100px_minmax(0,1fr)] md:gap-3 xl:gap-5">
      {hasMany && (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 md:order-1 md:flex-col md:max-h-[560px] md:overflow-x-visible md:overflow-y-auto md:pb-0">
          {visibleMedia.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => {
                  if (activeIndex !== index) {
                    setActiveIndex(index);
                  }
                }}
                onClick={() => setActiveIndex(index)}
                className={[
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border bg-white transition-all duration-200 md:h-[100px] md:w-[75px] xl:h-[100px] xl:w-[75px]",
                  isActive
                    ? "z-10 scale-105 border-[#1d8299] opacity-100 ring-2 ring-[#1d8299]/25 shadow-xl"
                    : "border-[#e2e8f0] opacity-70 hover:scale-[1.02] hover:opacity-100",
                ].join(" ")}
              >
                <img
                  src={item.thumb || item.src}
                  alt={item.alt}
                  className="h-full w-full object-cover object-center"
                />
              </button>
            );
          })}

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => onZoom(maxVisibleThumbs)}
              className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl md:h-[100px] md:w-[75px] xl:h-[100px] xl:w-[75px]"
            >
              <img
                src={
                  media[maxVisibleThumbs]?.thumb || media[maxVisibleThumbs]?.src
                }
                alt="Ver todas"
                className="h-full w-full object-cover object-center brightness-50"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 text-white">
                <span className="text-lg font-black">+{hiddenCount}</span>
                <span className="text-[10px] font-semibold">Ver todas</span>
              </div>
            </button>
          )}
        </div>
      )}

      <div
        className="order-1 relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] group cursor-zoom-in md:order-2 lg:min-h-[560px] xl:min-h-[620px]"
        onClick={() => onZoom(activeIndex)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={activeMedia.id}
          src={activeMedia.src}
          alt={activeMedia.alt}
          onLoad={() => setHeroLoaded(true)}
          className={[
            "h-full w-full object-cover object-center transition-all duration-300 ease-out group-hover:scale-[1.02]",
            heroLoaded ? "scale-100 opacity-100" : "scale-[0.985] opacity-0",
            !available ? "grayscale-[50%]" : "",
          ].join(" ")}
        />

        <ProductBadgeStack
          product={product}
          maxVisible={3}
          includePricingBadges={false}
          variant="detail"
          className="absolute left-4 top-4 z-10 flex max-w-[75%] flex-col items-start gap-2"
        />

        {hasMany && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white group-hover:opacity-100 md:flex"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white group-hover:opacity-100 md:flex"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 right-4 rounded-2xl border border-[#e2e8f0] bg-white/90 p-2.5 text-[#334155] shadow-lg backdrop-blur-md transition-all group-hover:scale-105">
          <ZoomIn className="h-5 w-5" />
        </div>

        {hasMany && (
          <div className="absolute bottom-4 left-4 rounded-2xl bg-black/45 px-3 py-2 text-[11px] font-black text-white backdrop-blur-md">
            📷 {activeIndex + 1} de {media.length}
          </div>
        )}

        <div
          data-product-detail-capture
          className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2"
        >
          <ProductCaptureButton product={product} />
        </div>
      </div>
    </div>
  );
}
