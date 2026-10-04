import type {
  KeyboardEventHandler,
} from "react";

import type {
  Product,
} from "@/shared/types/product";

import {
  hasValidOfferPrice,
  type NextVolumePrice,
} from "@/shared/domain/volumePricing/VolumePricing";

import {
  getStockPresentation,
} from "@/modules/catalog";

import {
  ProductPriceBlock,
} from "./ProductPriceBlock";
import {
  ProductPurchaseActions,
} from "./ProductPurchaseActions";
import {
  ProductQuantitySelector,
} from "./ProductQuantitySelector";
import {
  ProductStockInfo,
} from "./ProductStockInfo";
import {
  ProductVolumePriceProgress,
} from "./ProductVolumePriceProgress";
import {
  ProductVolumePriceSelector,
} from "./ProductVolumePriceSelector";

interface ProductDetailCommercialSectionProps {
  product: Product;
  available: boolean;
  viewers: number;
  stockPresentation: ReturnType<typeof getStockPresentation> | null;
  canShowVolumePricing: boolean;
  canShowPricing: boolean;
  canSelectQuantity: boolean;
  effectiveQty: number;
  qtyInput: string;
  unitPrice: number;
  total: number;
  pricePulse: boolean;
  showUnlock: boolean;
  savingsByQty: number;
  nextVolumePrice: NextVolumePrice | null;
  isQtyInputValid: boolean;
  showWhatsAppButton: boolean;
  isPreventa: boolean;
  onSelectQty: (quantity: number) => void;
  onQtyInputChange: (value: string) => void;
  onQtyInputBlur: () => void;
  onQtyInputKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onWhatsApp: () => void;
  onAddToCart: () => void;
}

export function ProductDetailCommercialSection({
  product,
  available,
  viewers,
  stockPresentation,
  canShowVolumePricing,
  canShowPricing,
  canSelectQuantity,
  effectiveQty,
  qtyInput,
  unitPrice,
  total,
  pricePulse,
  showUnlock,
  savingsByQty,
  nextVolumePrice,
  isQtyInputValid,
  showWhatsAppButton,
  isPreventa,
  onSelectQty,
  onQtyInputChange,
  onQtyInputBlur,
  onQtyInputKeyDown,
  onWhatsApp,
  onAddToCart,
}: ProductDetailCommercialSectionProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3.5 rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,.07)] sm:rounded-3xl md:gap-4 md:p-5 xl:p-6">
      <div className="flex flex-wrap justify-center gap-1.5 md:justify-start">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
          Código: {product.id}
        </span>

        <span className="rounded-full bg-[#e6f6f8] px-3 py-1 text-[11px] font-black capitalize text-[#1d8299]">
          {product.category}
        </span>
      </div>

      <div className="text-center md:text-left">
        <h2 className="mb-2 text-[22px] font-black leading-[1.08] tracking-[-0.025em] text-foreground md:text-[26px] xl:text-[28px]">
          {product.title}
        </h2>

        <p className="text-[13px] leading-relaxed text-[#64748b] md:text-[14px] xl:text-[15px]">
          {product.description}
        </p>
      </div>

      <ProductStockInfo
        product={product}
        available={available}
        viewers={viewers}
        stockPresentation={stockPresentation}
      />

      {canShowVolumePricing && (
        <ProductVolumePriceSelector
          product={product}
          effectiveQty={effectiveQty}
          onSelectQty={onSelectQty}
        />
      )}

      {canShowPricing && (
        <ProductPriceBlock
          unitPrice={unitPrice}
          total={total}
          effectiveQty={available ? effectiveQty : 1}
          pricePulse={available && pricePulse}
          showUnlock={available && showUnlock}
          savingsByQty={available ? savingsByQty : 0}
          basePrice={product.price_1}
          nextVolumePrice={available ? nextVolumePrice : null}
          isQtyInputValid={available ? isQtyInputValid : true}
          hasOffer={hasValidOfferPrice(product)}
        />
      )}

      {canShowVolumePricing && (
        <ProductVolumePriceProgress
          product={product}
          effectiveQty={effectiveQty}
          nextVolumePrice={nextVolumePrice}
        />
      )}

      {canSelectQuantity && (
        <ProductQuantitySelector
          value={qtyInput}
          onDecrease={() => onSelectQty(effectiveQty - 1)}
          onIncrease={() => onSelectQty(effectiveQty + 1)}
          onChange={onQtyInputChange}
          onBlur={onQtyInputBlur}
          onKeyDown={onQtyInputKeyDown}
        />
      )}

      <ProductPurchaseActions
        showWhatsAppButton={showWhatsAppButton}
        isPreventa={isPreventa}
        available={available}
        isQtyInputValid={isQtyInputValid}
        total={total}
        onWhatsApp={onWhatsApp}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}
