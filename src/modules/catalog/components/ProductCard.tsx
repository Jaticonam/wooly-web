import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MessageCircle, PlusCircle } from "lucide-react";

import type { Product } from "@/shared/types/product";
import type { CartItem } from "@/modules/cart/types";
import { ProductCardBadges } from "@/modules/catalog/components/ProductCardBadges";
import { ProductCardPrice } from "@/modules/catalog/components/ProductCardPrice";
import { ProductCardStock } from "@/modules/catalog/components/ProductCardStock";
import { ProductCaptureCard } from "@/modules/catalog/components/ProductCaptureCard";
import { ProductVolumePriceBadges } from "@/modules/catalog/components/ProductVolumePriceBadges";
import { downloadProductCardCapture } from "@/modules/catalog/utils/ProductCardCapture";
import { useProductCard } from "@/modules/product-detail/hooks/useProductCard";
import { buildProductPublicPath } from "@/shared/config/application";

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
      className="card-product group flex h-full flex-col"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onImageClick?.(p);
        }}
        className="card-product-image relative cursor-zoom-in overflow-hidden"
      >
        <ProductCardBadges product={p} />

        {isInCart && (
          <div className="card-product-cart-qty">
            +{qtyInCart}
          </div>
        )}

        {isAgotado && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <span className="card-product-soldout">
              Agotado
            </span>
          </div>
        )}

        <img
          src={p.img || "/placeholder.svg"}
          alt={p.title}
          className={[
            "h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.025]",
            isAgotado ? "opacity-90 saturate-[.9]" : "",
          ].join(" ")}
          loading="lazy"
        />

        <button
          type="button"
          data-no-card-click
          aria-label={isCapturing ? "Capturando producto" : "Capturar producto"}
          title={isCapturing ? "Capturando..." : "Capturar producto"}
          disabled={isCapturing}
          onClick={handleCapture}
          className={[
            "card-product-capture",
            isCapturing ? "is-capturing" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Camera
            className={isCapturing ? "motion-safe:animate-pulse" : ""}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="card-product-body">
        <div className="card-product-meta" data-no-card-click>
          <span>{p.id}</span>
          <span aria-hidden="true">·</span>
          <strong>{p.category}</strong>
        </div>

        <h3
          data-no-card-click
          className="card-product-title line-clamp-2"
        >
          {p.title}
        </h3>

        <div className="card-product-commerce">
          <ProductCardPrice product={p} isPreventa={isPreventa} />

          <ProductCardStock
            stock={p.stock}
            price={p.price_1}
            status={p.status}
          />
        </div>

        <ProductVolumePriceBadges
          product={p}
          available={available}
          isPreventa={isPreventa}
          maxTiers={1}
          compact
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
            "card-product-button",
            isAgotado
              ? "is-restock"
              : showWhatsAppButton
                ? "is-whatsapp"
                : isInCart
                  ? "is-in-cart"
                  : "is-add",
            !isAgotado && !available && !showWhatsAppButton
              ? "is-disabled"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {showWhatsAppButton ? (
            <MessageCircle aria-hidden="true" />
          ) : (
            <PlusCircle aria-hidden="true" />
          )}

          <span>{buttonLabel}</span>
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
