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
  const touchStartRef = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const didSwipeRef = useRef(false);
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
    setHeroLoaded(false);
  }, [product.id]);

  useEffect(() => {
    setHeroLoaded(false);
  }, [activeIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    didSwipeRef.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start =
      touchStartRef.current;

    if (
      !hasMany ||
      !start
    ) {
      touchStartRef.current = null;
      return;
    }

    const touch =
      e.changedTouches[0];

    const diffX =
      start.x -
      touch.clientX;

    const diffY =
      start.y -
      touch.clientY;

    const isHorizontalSwipe =
      Math.abs(diffX) > 45 &&
      Math.abs(diffX) >
        Math.abs(diffY) * 1.2;

    if (isHorizontalSwipe) {
      didSwipeRef.current = true;

      if (diffX > 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStartRef.current = null;
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
    didSwipeRef.current = false;
  };

  const handleHeroClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }

    onZoom(activeIndex);
  };

  const galleryLayoutClass =
    hasMany
      ? "relative flex min-w-0 flex-col gap-2.5 md:grid md:grid-cols-[78px_minmax(0,1fr)] md:gap-3 xl:grid-cols-[82px_minmax(0,1fr)] xl:gap-4"
      : "relative flex min-w-0 flex-col gap-2.5";

  return (
    <div
      className={galleryLayoutClass}
      data-product-gallery-count={media.length}
    >
      {hasMany && (
        <div className="order-2 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:order-1 md:max-h-[620px] md:flex-col md:overflow-x-visible md:overflow-y-auto md:pb-0">
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
                aria-label={`Ver imagen ${index + 1} de ${media.length}`}
                aria-current={isActive ? "true" : undefined}
                className={[
                  "relative h-[74px] w-[58px] shrink-0 snap-start overflow-hidden rounded-xl border bg-white transition-all duration-200 sm:h-20 sm:w-16 md:h-[92px] md:w-[68px] xl:h-[96px] xl:w-[72px]",
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
              className="relative h-[74px] w-[58px] shrink-0 snap-start overflow-hidden rounded-xl sm:h-20 sm:w-16 md:h-[92px] md:w-[68px] xl:h-[96px] xl:w-[72px]"
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
        className="group relative order-1 aspect-[3/4] min-w-0 cursor-zoom-in overflow-hidden rounded-[22px] border border-[#e2e8f0] bg-white shadow-[0_16px_42px_rgba(15,23,42,.11)] sm:rounded-3xl md:order-2"
        style={{
          touchAction: "pan-y",
        }}
        onClick={handleHeroClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
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
          className="absolute left-3 top-3 z-10 flex max-w-[72%] flex-col items-start gap-1.5 sm:left-4 sm:top-4 sm:max-w-[75%] sm:gap-2"
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

        <div className="absolute bottom-3 right-3 rounded-xl border border-[#e2e8f0] bg-white/90 p-2 text-[#334155] shadow-md backdrop-blur-md transition-all group-hover:scale-105 sm:bottom-4 sm:right-4 sm:rounded-2xl sm:p-2.5">
          <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>

        {hasMany && (
          <div className="absolute bottom-3 left-3 rounded-xl bg-black/45 px-2.5 py-1.5 text-[10px] font-black text-white backdrop-blur-md sm:bottom-4 sm:left-4 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-[11px]">
            📷 {activeIndex + 1} de {media.length}
          </div>
        )}

        <div
          data-product-detail-capture
          className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 sm:bottom-4"
        >
          <ProductCaptureButton product={product} />
        </div>
      </div>
    </div>
  );
}
