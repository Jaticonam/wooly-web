import { useRef, useState } from "react";
import { Camera } from "lucide-react";

import type { Product } from "@wooly/contracts/types/product";
import { resolveProductCommercialPolicy } from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";
import { ProductCaptureCard } from "@/modules/catalog/components/ProductCaptureCard";
import { downloadProductCardCapture } from "@/modules/catalog/utils/ProductCardCapture";

interface ProductCaptureButtonProps {
  product: Product;
}

export function ProductCaptureButton({
  product,
}: ProductCaptureButtonProps) {
  const captureRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const policy = resolveProductCommercialPolicy(product);
  const available = policy.isPurchasable;
  const isPreventa = policy.status === "preventa";

  const handleCapture = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();

    if (isCapturing || !captureRef.current) return;

    setIsCapturing(true);

    try {
      await downloadProductCardCapture(
        captureRef.current,
        product.id,
      );
    } catch (error) {
      console.error(
        "No se pudo capturar el producto.",
        error,
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={
          isCapturing
            ? "Capturando producto"
            : "Capturar producto"
        }
        disabled={isCapturing}
        onClick={handleCapture}
        className={[
          "flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/70 bg-white/95 px-4 py-2 text-[11px] font-black text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,.3)] backdrop-blur-md transition-all active:scale-[.96]",
          isCapturing
            ? "cursor-wait opacity-90"
            : "hover:-translate-y-[1px] hover:bg-white hover:shadow-[0_10px_28px_rgba(15,23,42,.36)]",
        ].join(" ")}
      >
        <Camera
          className={[
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isCapturing
              ? "motion-safe:animate-pulse scale-90"
              : "",
          ].join(" ")}
        />

        <span>
          {isCapturing ? "Capturando..." : "Capturar"}
        </span>
      </button>

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
            product={product}
            available={available}
            isPreventa={isPreventa}
          />
        </div>
      </div>
    </>
  );
}
