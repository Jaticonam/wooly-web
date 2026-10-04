import { MessageCircle, PlusCircle } from "lucide-react";

interface ProductPurchaseActionsProps {
  showWhatsAppButton: boolean;
  isPreventa: boolean;
  available: boolean;
  isQtyInputValid: boolean;
  effectiveQty: number;
  total: number;
  onWhatsApp: () => void;
  onAddToCart: () => void;
}

export function ProductPurchaseActions({
  showWhatsAppButton,
  isPreventa,
  available,
  isQtyInputValid,
  effectiveQty,
  total,
  onWhatsApp,
  onAddToCart,
}: ProductPurchaseActionsProps) {
  if (showWhatsAppButton) {
    return (
      <button
        type="button"
        onClick={onWhatsApp}
        className="btn-shop-whatsapp flex min-h-[50px] w-full items-center justify-center gap-2.5 py-3.5 text-[14px] font-black"
      >
        <MessageCircle className="h-5 w-5" />
        {isPreventa ? "Consultar por WhatsApp" : "Pedir reposición"}
      </button>
    );
  }

  if (!available) return null;

  return (
    <button
      type="button"
      onClick={onAddToCart}
      disabled={!isQtyInputValid}
      className={[
        "flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-2xl px-4 py-3.5 text-[14px] font-black shadow-lg transition-all active:scale-[.98]",
        isQtyInputValid
          ? "bg-[#1d8299] text-white hover:bg-[#16677a] hover:shadow-xl"
          : "cursor-not-allowed bg-muted text-muted-foreground shadow-none",
      ].join(" ")}
    >
      <PlusCircle className="h-5 w-5" />

      {isQtyInputValid
        ? `Agregar ${effectiveQty} ${effectiveQty === 1 ? "unidad" : "unidades"} · S/ ${total.toFixed(
            2,
          )}`
        : "Ingresa una cantidad"}
    </button>
  );
}
