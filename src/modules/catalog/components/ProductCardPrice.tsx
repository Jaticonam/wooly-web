import type { Product } from "@/shared/types/product";

import {
  getBaseUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

interface ProductCardPriceProps {
  product: Product;
  isPreventa?: boolean;
}

export function ProductCardPrice({
  product,
  isPreventa = false,
}: ProductCardPriceProps) {
  const finalPrice =
    getBaseUnitPrice(
      product,
    );

  /*
   * El helper canónico solo devuelve un valor distinto de
   * price_1 cuando existe una oferta válida y menor.
   */
  const hasOffer =
    Number.isFinite(
      product.price_1,
    ) &&
    product.price_1 > 0 &&
    finalPrice !==
      product.price_1;

  if (isPreventa) {
    return (
      <div className="mt-2.5 flex flex-col items-center gap-1 border-t border-[#eef2f6] pt-2.5">
        <span className="text-[12px] font-bold text-muted-foreground">
          Próximamente
        </span>
        <span className="text-[21px] font-black tracking-tight text-green-600">
          💬 Consultar
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground">
          Más información por WhatsApp
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-1 border-t border-[#eef2f6] pt-2">
      <span className="text-[10px] font-black text-slate-500">
        💰 Precio unitario
      </span>

      <div className="flex items-end justify-center gap-2">
        <span className="text-[12px] font-bold text-muted-foreground">S/</span>

        <span
          className={`text-[27px] font-black leading-none tracking-tight md:text-[30px] ${
            hasOffer ? "text-red-600" : "text-[#1d8299]"
          }`}
        >
          {finalPrice.toFixed(1)}
        </span>

        {hasOffer && (
          <span className="mb-[2px] text-[12px] font-bold text-slate-400 line-through decoration-2">
            S/{product.price_1.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
