import { ShoppingBag, X } from "lucide-react";

interface CartHeaderProps {
  itemsCount: number;
  onClose: () => void;
}

export function CartHeader({
  itemsCount,
  onClose,
}: CartHeaderProps) {
  return (
    <div className="cart-header">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="cart-icon-box">
          <ShoppingBag className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <h2 className="text-[17px] font-black leading-none tracking-tight text-[#0f172a]">
            Mi Caja
          </h2>

          <span className="mt-1 block text-[10px] font-black tracking-[0.04em] text-[#1d8299]">
            {itemsCount}{" "}
            {itemsCount === 1
              ? "unidad"
              : "unidades"}{" "}
            acumuladas
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="cart-close-btn"
        aria-label="Cerrar carrito"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
