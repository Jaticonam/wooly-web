import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MessageCircle, PlusCircle } from "lucide-react";

import type { Product } from "@/shared/types/product";
import type { CartItem } from "@/modules/cart/types";
import { getCategoryColor } from "@/shared/config/categoryColors";
import { ProductCardBadges } from "@/modules/catalog/components/ProductCardBadges";
import { ProductCardPrice } from "@/modules/catalog/components/ProductCardPrice";
import { ProductCardStock } from "@/modules/catalog/components/ProductCardStock";
import { ProductCaptureCard } from "@/modules/catalog/components/ProductCaptureCard";
import { ProductVolumePriceBadges } from "@/modules/catalog/components/ProductVolumePriceBadges";
import { downloadProductCardCapture } from "@/modules/catalog/utils/ProductCardCapture";
import { useProductCard } from "@/modules/product-detail/hooks/useProductCard";

interface Props {
  product: Product;
  cart?: CartItem[];
  onAddToCart: (product: Product) => void;
  onImageClick?: (product: Product) => void;
}

export function ProductCard({
  product: p,
  cart = [],
  onAddToCart,
  onImageClick,
}: Props) {
  const navigate = useNavigate();
  const captureRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const {
    available,
    isPreventa,
    isAgotado,
    showWhatsAppButton,
    isInCart,
    qtyInCart,
    handleAdd,
    handleWhatsApp,
  } = useProductCard(p, cart, onAddToCart);

  const goToDetail = () =>
    navigate(buildProductPublicPath(p.id, p.category));

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText) return;

    const target = e.target as HTMLElement;
    if (target.closest("[data-no-card-click],button,a,input,textarea,select"))
      return;

    goToDetail();
  };

  const handleCapture = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (isCapturing || !captureRef.current) return;

    setIsCapturing(true);

    try {
      await downloadProductCardCapture(captureRef.current, p.id);
    } catch (error) {
      console.error("No se pudo capturar el producto.", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const buttonLabel = isAgotado
    ? "Consultar reposición"
    : showWhatsAppButton
      ? "Consultar"
      : isInCart
        ? `Sumar (${qtyInCart})`
        : "Agregar";

  return (
    <div
      onClick={handleCardClick}
      className="card-product group flex flex-col p-2 text-center md:p-2.5"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onImageClick?.(p);
        }}
        className="card-product-image relative mb-2 h-[140px] cursor-zoom-in overflow-hidden rounded-[18px] sm:h-[160px] md:h-[250px] xl:h-[220px]"
      >
        <ProductCardBadges product={p} />

        {isInCart && (
          <div className="absolute right-2 top-2 z-20 rounded-full bg-[#1d8299] px-2.5 py-1 text-[10px] font-black leading-none text-white shadow-[0_6px_16px_rgba(29,130,153,.25)]">
            +{qtyInCart}
          </div>
        )}

        {isAgotado && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <span className="rounded-full border-2 border-white bg-orange-500 px-5 py-2 text-[12px] font-black uppercase tracking-wide text-white shadow-xl">
              Agotado
            </span>
          </div>
        )}

        <img
          src={p.img || "/placeholder.svg"}
          alt={p.title}
          className={[
            "h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.035]",
            isAgotado ? "opacity-90 saturate-[.9]" : "",
          ].join(" ")}
          loading="lazy"
        />

        <button
          type="button"
          data-no-card-click
          aria-label={isCapturing ? "Capturando producto" : "Capturar producto"}
          disabled={isCapturing}
          onClick={handleCapture}
          className={[
            "absolute bottom-2.5 left-1/2 z-20 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[10px] font-black text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,.22)] backdrop-blur-md transition-all active:scale-[.96] sm:text-[11px]",
            isCapturing
              ? "cursor-wait opacity-90"
              : "hover:-translate-y-[1px] hover:bg-white hover:shadow-[0_8px_22px_rgba(15,23,42,.28)]",
          ].join(" ")}
        >
          <Camera
            className={[
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
              isCapturing ? "motion-safe:animate-pulse scale-90" : "",
            ].join(" ")}
          />

          <span>{isCapturing ? "Capturando..." : "Capturar"}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between px-1">
        <div>
          <div
            data-no-card-click
            className="mb-1.5 flex flex-wrap items-center justify-center gap-0.5"
          >
            <span className="rounded-full bg-slate-100 px-2 py-[3px] text-[9px] font-black uppercase text-slate-500">
              {p.id}
            </span>

            <span
              className={`rounded-full px-2 py-[3px] text-[9px] font-black uppercase ${getCategoryColor(p.category)}`}
            >
              {p.category}
            </span>
          </div>

          <h3
            data-no-card-click
            className="mb-0.3 card-product-title line-clamp-2"
          >
            {p.title}
          </h3>
        </div>

        <ProductCardPrice product={p} isPreventa={isPreventa} />

        <ProductCardStock stock={p.stock} price={p.price_1} status={p.status} />

        <ProductVolumePriceBadges
          product={p}
          available={available}
          isPreventa={isPreventa}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();

            if (showWhatsAppButton) {
              handleWhatsApp();
              return;
            }

            handleAdd();
          }}
          disabled={!showWhatsAppButton && !available}
          className={[
            "card-product-button mt-2.5 w-full min-h-[36px] rounded-2xl px-2.5 py-2 text-[12px] font-black text-white shadow-md transition-all active:scale-[.98] md:min-h-[38px] md:text-[13px]",
            isAgotado
              ? "bg-orange-500 hover:bg-orange-600 hover:scale-[1.01] hover:shadow-lg"
              : showWhatsAppButton
                ? "bg-green-600 hover:bg-green-700"
                : isInCart
                  ? "bg-gradient-to-r from-[#156f84] to-[#1d8299] hover:shadow-lg"
                  : "bg-gradient-to-r from-[#1d8299] to-[#156f84] hover:scale-[1.01] hover:shadow-lg",
            !isAgotado && !available && !showWhatsAppButton
              ? "cursor-not-allowed opacity-50 shadow-none"
              : "",
          ].join(" ")}
        >
          <span className="flex items-center justify-center gap-1.5">
            {showWhatsAppButton ? (
              <MessageCircle className="h-4 w-4" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}

            {buttonLabel}
          </span>
        </button>
      </div>

      <div
        aria-hidden="true"
        data-product-capture-host
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: 360,
          height: 640,
          pointerEvents: "none",
        }}
      >
        <div
          ref={captureRef}
          data-product-capture-node
          className="h-[640px] w-[360px]"
        >
          <ProductCaptureCard
            product={p}
            available={available}
            isPreventa={isPreventa}
          />
        </div>
      </div>
    </div>
  );
}


import { buildProductPublicPath } from "@/shared/config/application";
