import { Minus, Plus } from "lucide-react";
import type { CartItem } from "@/modules/cart/types";
import { CartQtyInput } from "@/modules/cart/components/CartQtyInput";

interface CartQtyControlsProps {
  item: CartItem;
  qtyPulse: boolean;
  onChangeQty: (id: string, delta: number) => void;
  onSetQty: (id: string, qty: number | null) => void;
}

export function CartQtyControls({
  item,
  qtyPulse,
  onChangeQty,
  onSetQty,
}: CartQtyControlsProps) {
  return (
    <div className={`cart-qty-box ${qtyPulse ? "ring-2 ring-[#1d8299]/10" : ""}`}>
      <button
        type="button"
        onClick={() => onChangeQty(item.id, -1)}
        disabled={item.qty <= 1}
        className="cart-qty-btn"
        aria-label={`Disminuir cantidad de ${item.title}`}
      >
        <Minus className="w-4 h-4" />
      </button>

      <CartQtyInput item={item} onSetQty={onSetQty} />

      <button
        type="button"
        onClick={() => onChangeQty(item.id, 1)}
        className="cart-qty-btn"
        aria-label={`Aumentar cantidad de ${item.title}`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
