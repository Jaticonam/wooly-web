import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Trash2,
} from "lucide-react";

import type {
  CartItem,
} from "@/modules/cart/types";

import {
  getCartLinePricing,
} from "@/modules/cart/domain/CartLinePricing";

import {
  getActiveVolumePriceQty,
  hasValidOfferPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

import {
  CartVolumePriceSelector,
} from "@/modules/cart/components/CartVolumePriceSelector";

import {
  CartQtyControls,
} from "@/modules/cart/components/CartQtyControls";

import {
  CartNoteTextarea,
} from "@/modules/cart/components/CartNoteTextarea";

interface CartRowProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onChangeQty: (
    id: string,
    delta: number,
  ) => void;
  onSetQty: (
    id: string,
    qty: number | null,
  ) => void;
  onChangeNote: (
    id: string,
    note: string,
  ) => void;
}

export function CartRow({
  item,
  onRemove,
  onChangeQty,
  onSetQty,
  onChangeNote,
}: CartRowProps) {
  const {
    quantity,
    unitPrice,
    subtotal,
  } =
    getCartLinePricing(
      item,
    );

  const hasOffer =
    hasValidOfferPrice(
      item,
    );

  const activeVolumePriceQty =
    getActiveVolumePriceQty(
      item,
      quantity,
    );

  const previousQtyRef =
    useRef(item.qty);

  const previousPriceRef =
    useRef(unitPrice);

  const previousVolumePriceQtyRef =
    useRef(activeVolumePriceQty);

  const [
    qtyPulse,
    setQtyPulse,
  ] = useState(false);

  const [
    pricePulse,
    setPricePulse,
  ] = useState(false);

  const [
    volumePriceFlash,
    setVolumePriceFlash,
  ] = useState(false);

  useEffect(
    () => {
      if (
        previousQtyRef.current ===
        item.qty
      ) {
        return;
      }

      setQtyPulse(true);

      const timer =
        window.setTimeout(
          () =>
            setQtyPulse(false),
          220,
        );

      previousQtyRef.current =
        item.qty;

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [item.qty],
  );

  useEffect(
    () => {
      if (
        previousPriceRef.current ===
        unitPrice
      ) {
        return;
      }

      setPricePulse(true);

      const timer =
        window.setTimeout(
          () =>
            setPricePulse(false),
          280,
        );

      previousPriceRef.current =
        unitPrice;

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [unitPrice],
  );

  useEffect(
    () => {
      if (
        previousVolumePriceQtyRef
          .current ===
        activeVolumePriceQty
      ) {
        return;
      }

      setVolumePriceFlash(true);

      const timer =
        window.setTimeout(
          () =>
            setVolumePriceFlash(false),
          1500,
        );

      previousVolumePriceQtyRef
        .current =
        activeVolumePriceQty;

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [activeVolumePriceQty],
  );

  return (
    <div
      className={[
        "cart-item-card",
        qtyPulse
          ? "scale-[1.01]"
          : "",
        volumePriceFlash
          ? "ring-2 ring-[#1d8299]/20"
          : "",
      ].join(" ")}
    >
      <div className="flex gap-3">
        <div className="cart-product-img">
          <img
            src={item.img}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-grow text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="line-clamp-2 text-[13px] font-black capitalize leading-tight tracking-tight text-[#0f172a]">
                {item.title}
              </h4>

              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.06em] text-[#94a3b8]">
                {item.id}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onRemove(item.id)
              }
              className="flex-shrink-0 text-[#cbd5e1] transition-colors hover:text-[#ef4444]"
              aria-label={`Eliminar ${item.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <div className="min-w-0">
              <span className="block text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
                Precio unitario
              </span>

              <div
                className={[
                  "mt-0.5 text-[12px] font-black tracking-tight",
                  pricePulse
                    ? "text-[#1d8299]"
                    : "text-[#64748b]",
                ].join(" ")}
              >
                {quantity}u × S/{" "}
                {unitPrice.toFixed(2)} c/u
              </div>
            </div>

            <div className="text-right">
              <span className="block text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
                Subtotal
              </span>

              <div className="mt-0.5 flex items-baseline justify-end gap-1">
                <span className="text-[9px] font-black text-[#94a3b8]">
                  S/
                </span>

                <span
                  className={[
                    "text-[22px] font-black leading-none tracking-[-0.04em] transition-all duration-300",
                    pricePulse
                      ? "scale-105 text-[#1d8299]"
                      : "text-[#0f172a]",
                  ].join(" ")}
                >
                  {subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        {hasOffer ? (
          <div
            data-testid="cart-offer-mode"
            className="flex flex-1 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-rose-600"
          >
            Precio de oferta
          </div>
        ) : (
          <CartVolumePriceSelector
            item={item}
            onSetQty={onSetQty}
          />
        )}

        <CartQtyControls
          item={item}
          qtyPulse={qtyPulse}
          onChangeQty={onChangeQty}
          onSetQty={onSetQty}
        />
      </div>

      <CartNoteTextarea
        item={item}
        onChangeNote={onChangeNote}
      />
    </div>
  );
}
