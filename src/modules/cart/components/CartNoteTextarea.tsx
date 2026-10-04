import { useEffect, useRef } from "react";
import type { CartItem } from "@/modules/cart/types";

interface CartNoteTextareaProps {
  item: CartItem;
  onChangeNote: (id: string, note: string) => void;
}

export function CartNoteTextarea({
  item,
  onChangeNote,
}: CartNoteTextareaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }, [item.note]);

  return (
    <div className="mt-0.5">
      <textarea
        ref={ref}
        rows={1}
        value={item.note || ""}
        onChange={(event) => onChangeNote(item.id, event.target.value)}
        placeholder="Detalle opcional: colores, modelos, presentación, etc."
        className="cart-note"
      />
    </div>
  );
}
