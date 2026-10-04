import type { Product } from "@/shared/types/product";

interface ProductStockInfoProps {
  product: Product;
  available: boolean;
  viewers: number;
  stockPresentation: {
    text: string;
    className: string;
    icon: React.ElementType;
  } | null;
}

export function ProductStockInfo({
  available,
  viewers,
  stockPresentation,
}: ProductStockInfoProps) {
  const StockIcon = stockPresentation?.icon;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
      {stockPresentation && StockIcon && (
        <div
          className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black sm:text-[12px] ${stockPresentation.className}`}
        >
          <StockIcon className="h-3.5 w-3.5" />
          <span>{stockPresentation.text}</span>
        </div>
      )}

      {available && (
        <p className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full bg-[#e6f2f5] px-3 py-1 text-[11px] font-black text-[#1d8299] sm:text-[12px]">
          👀 {viewers} viendo ahora
        </p>
      )}
    </div>
  );
}
