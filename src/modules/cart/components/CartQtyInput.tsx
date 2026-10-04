import { useEffect, useState } from "react";
import type { CartItem } from "@/modules/cart/types";

interface CartQtyInputProps {
  item: CartItem;
  onSetQty: (id: string, qty: number | null) => void;
}

export function CartQtyInput({
  item,
  onSetQty,
}: CartQtyInputProps) {
  const [qtyInput, setQtyInput] = useState(String(item.qty));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setQtyInput(String(item.qty));
    }
  }, [item.qty, isEditing]);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={qtyInput}
      onFocus={() => setIsEditing(true)}
      onBlur={() => setIsEditing(false)}
      onChange={(event) => {
        const value = event.target.value;

        if (value === "") {
          setQtyInput("");
          onSetQty(item.id, null);
          return;
        }

        if (!/^\d+$/.test(value)) return;

        setQtyInput(value);
        onSetQty(item.id, parseInt(value, 10));
      }}
      className="w-12 text-center text-[14px] font-black tracking-tight text-[#0f172a] bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      aria-label={`Cantidad de ${item.title}`}
    />
  );
}
