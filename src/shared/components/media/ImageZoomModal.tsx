import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { X, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductMedia } from "@/shared/lib/productMedia";

interface ImageZoomModalProps {
  media?: ProductMedia[];
  initialIndex?: number;
  open?: boolean;
  src?: string | null;
  title: string;
  onClose: () => void;
  footerAction?: ReactNode;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const getTouchDistance = (touches: React.TouchList) => {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
};

export function ImageZoomModal({
  media = [],
  initialIndex = 0,
  open,
  src,
  title,
  onClose,
  footerAction,
}: ImageZoomModalProps) {
  const normalizedMedia =
    media.length > 0
      ? media
      : src
        ? [
            {
              id: "legacy-image",
              type: "image" as const,
              src,
              thumb: src,
              alt: title,
              order: 1,
            },
          ]
        : [];

  const isOpen = open ?? !!src;

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const activeMedia = normalizedMedia[activeIndex] ?? normalizedMedia[0];
  const hasMany = normalizedMedia.length > 1;

  const mouseRef = useRef({ panning: false, startX: 0, startY: 0 });
  const touchRef = useRef({
    panning: false,
    pinching: false,
    swiping: false,
    startX: 0,
    startY: 0,
    startDistance: 0,
    startScale: 1,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const historyPushedRef = useRef(false);
  const closingFromPopStateRef = useRef(false);

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((index) =>
      index === 0 ? normalizedMedia.length - 1 : index - 1,
    );
    reset();
  }, [normalizedMedia.length, reset]);

  const goNext = useCallback(() => {
    setActiveIndex((index) =>
      index === normalizedMedia.length - 1 ? 0 : index + 1,
    );
    reset();
  }, [normalizedMedia.length, reset]);

  const closeModal = useCallback(() => {
    if (historyPushedRef.current && !closingFromPopStateRef.current) {
      historyPushedRef.current = false;
      window.history.back();
      return;
    }

    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(initialIndex);
    reset();
  }, [open, initialIndex, reset]);

  useEffect(() => {
    if (!open) return;

    window.history.pushState({ imageZoom: true }, "");
    historyPushedRef.current = true;
    closingFromPopStateRef.current = false;

    const handlePopState = () => {
      closingFromPopStateRef.current = true;
      historyPushedRef.current = false;
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();

      if (hasMany && scale <= 1) {
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeModal, hasMany, scale, goPrev, goNext]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !open) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();

      setScale((current) => {
        const next = e.deltaY < 0 ? current * 1.12 : current / 1.12;
        const clamped = clamp(next, 1, 5);

        if (clamped === 1) setPos({ x: 0, y: 0 });

        return clamped;
      });
    };

    el.addEventListener("wheel", handler, { passive: false });

    return () => {
      el.removeEventListener("wheel", handler);
    };
  }, [open]);

  if (!isOpen || !activeMedia) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;

    e.preventDefault();

    mouseRef.current = {
      panning: true,
      startX: e.clientX - pos.x,
      startY: e.clientY - pos.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseRef.current.panning) return;

    setPos({
      x: e.clientX - mouseRef.current.startX,
      y: e.clientY - mouseRef.current.startY,
    });
  };

  const handleMouseUp = () => {
    mouseRef.current.panning = false;
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      reset();
      return;
    }

    setScale(2.4);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchRef.current = {
        ...touchRef.current,
        pinching: true,
        panning: false,
        swiping: false,
        startDistance: getTouchDistance(e.touches),
        startScale: scale,
      };
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];

      touchRef.current = {
        ...touchRef.current,
        pinching: false,
        panning: scale > 1,
        swiping: scale <= 1,
        startX: scale > 1 ? touch.clientX - pos.x : touch.clientX,
        startY: scale > 1 ? touch.clientY - pos.y : touch.clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current.pinching) {
      e.preventDefault();

      const distance = getTouchDistance(e.touches);
      const nextScale = clamp(
        (distance / touchRef.current.startDistance) *
          touchRef.current.startScale,
        1,
        5,
      );

      setScale(nextScale);

      if (nextScale === 1) setPos({ x: 0, y: 0 });

      return;
    }

    if (e.touches.length === 1 && touchRef.current.panning && scale > 1) {
      e.preventDefault();

      const touch = e.touches[0];

      setPos({
        x: touch.clientX - touchRef.current.startX,
        y: touch.clientY - touchRef.current.startY,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (hasMany && touchRef.current.swiping && scale <= 1) {
      const endX = e.changedTouches[0]?.clientX ?? touchRef.current.startX;
      const diff = touchRef.current.startX - endX;

      if (Math.abs(diff) > 45) {
        if (diff > 0) {
          goNext();
        } else {
          goPrev();
        }
      }
    }

    touchRef.current.panning = false;
    touchRef.current.pinching = false;
    touchRef.current.swiping = false;

    if (scale <= 1.03) reset();
  };

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center bg-slate-950/95 p-0 backdrop-blur-md transition-opacity duration-300 sm:p-2 md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={containerRef}
        className="relative flex h-[100dvh] w-full max-w-none touch-none select-none items-center justify-center overflow-hidden rounded-none bg-slate-900 shadow-2xl ring-1 ring-white/10 sm:aspect-[3/4] sm:h-auto sm:max-h-[94dvh] sm:w-[94vw] sm:max-w-[430px] sm:rounded-3xl md:aspect-auto md:h-[82vh] md:w-full md:max-w-5xl"
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute left-0 top-0 z-30 flex min-h-16 w-full items-center justify-between gap-3 bg-gradient-to-b from-black/75 via-black/45 to-transparent px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] sm:pt-3 md:min-h-20 md:px-5">
          <h2 className="line-clamp-2 max-w-[68%] text-sm font-black leading-tight text-white md:max-w-[75%] md:text-lg">
            {title}
          </h2>

          <div className="flex shrink-0 gap-2">
            {scale > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition-all hover:scale-105"
                aria-label="Restablecer zoom"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition-all hover:scale-105 hover:text-red-600"
              aria-label="Cerrar imagen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {normalizedMedia.length > 1 && (
          <div
            className={[
              "absolute left-1/2 z-40 flex max-w-[88vw] -translate-x-1/2 snap-x snap-mandatory gap-2 overflow-x-auto rounded-2xl bg-black/25 p-2 backdrop-blur-md [scrollbar-width:none] lg:bottom-6 lg:left-4 lg:top-20 lg:max-w-none lg:translate-x-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden",
              footerAction
                ? "bottom-[calc(88px+env(safe-area-inset-bottom))] sm:bottom-28"
                : "bottom-[calc(54px+env(safe-area-inset-bottom))] sm:bottom-14",
            ].join(" ")}
          >
            {normalizedMedia.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => {
                  if (activeIndex !== index) {
                    setActiveIndex(index);
                    reset();
                  }
                }}
                onClick={() => {
                  setActiveIndex(index);
                  reset();
                }}
                className={[
                  "h-10 w-10 shrink-0 snap-start overflow-hidden rounded-xl border transition-all md:h-12 md:w-12 lg:h-20 lg:w-20",
                  activeIndex === index
                    ? "border-cyan-400 ring-2 ring-cyan-400/30 scale-105"
                    : "border-white/10 opacity-70 hover:opacity-100",
                ].join(" ")}
              >
                <img
                  src={item.thumb || item.src}
                  alt={item.alt}
                  className="h-10 w-10 rounded-xl object-cover md:h-12 md:w-12 lg:h-20 lg:w-20"
                />
              </button>
            ))}
          </div>
        )}

        {hasMany && scale <= 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 top-1/2 z-40 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-black/55 md:flex"
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
              className="absolute right-3 top-1/2 z-40 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-black/55 md:flex"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

          </>
        )}

        {(footerAction || (hasMany && scale <= 1)) && (
          <div
            data-image-zoom-footer
            className="absolute bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-4"
          >
            {hasMany && scale <= 1 && (
              <div className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-black text-white backdrop-blur-md">
                {activeIndex + 1} / {normalizedMedia.length}
              </div>
            )}

            {footerAction}
          </div>
        )}

        <div className="relative flex h-full w-full items-center justify-center lg:pl-24">
          <img
            src={activeMedia.src}
            alt={activeMedia.alt || title}
            className={[
              "max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-75 origin-center",
              scale > 1
                ? "cursor-grab active:cursor-grabbing"
                : "cursor-zoom-in",
            ].join(" ")}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}