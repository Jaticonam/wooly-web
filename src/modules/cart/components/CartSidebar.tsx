import type {
  CartItem,
} from "@/modules/cart/types";

import {
  CartHeader,
} from "@/modules/cart/components/CartHeader";

import {
  CartEmpty,
} from "@/modules/cart/components/CartEmpty";

import {
  CartRow,
} from "@/modules/cart/components/CartRow";

import {
  CartFooter,
} from "@/modules/cart/components/CartFooter";

interface CartSidebarProps {
  isOpen:
    boolean;

  onClose:
    () => void;

  cart:
    CartItem[];

  totalItems:
    number;

  totalPrice:
    number;

  savings:
    number;

  onRemove:
    (
      id:
        string,
    ) => void;

  onChangeQty:
    (
      id:
        string,

      delta:
        number,
    ) => void;

  onSetQty:
    (
      id:
        string,

      qty:
        number |
        null,
    ) => void;

  onChangeNote:
    (
      id:
        string,

      note:
        string,
    ) => void;

  onClearCart:
    () => void;

  onReplaceCart:
    (
      items:
        readonly CartItem[],
    ) => void;
}

export function CartSidebar({
  isOpen,
  onClose,
  cart,
  totalItems,
  totalPrice,
  savings,
  onRemove,
  onChangeQty,
  onSetQty,
  onChangeNote,
  onClearCart,
  onReplaceCart,
}: CartSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1500] flex justify-end bg-black/50 backdrop-blur-sm sm:p-3"
      onClick={
        onClose
      }
    >
      <div
        className="cart-panel animate-in slide-in-from-right duration-300"
        onClick={(
          event,
        ) =>
          event.stopPropagation()
        }
      >
        <CartHeader
          itemsCount={
            totalItems
          }
          onClose={
            onClose
          }
        />

        <div className="cart-body">
          {cart.length ===
          0 ? (
            <CartEmpty
              onContinueShopping={
                onClose
              }
            />
          ) : (
            <div className="space-y-2.5">
              {cart.map(
                (item) => (
                  <CartRow
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    onRemove={
                      onRemove
                    }
                    onChangeQty={
                      onChangeQty
                    }
                    onSetQty={
                      onSetQty
                    }
                    onChangeNote={
                      onChangeNote
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>

        <CartFooter
          cart={
            cart
          }
          totalItems={
            totalItems
          }
          totalPrice={
            totalPrice
          }
          savings={
            savings
          }
          onClearCart={
            onClearCart
          }
          onReplaceCart={
            onReplaceCart
          }
          onClose={
            onClose
          }
        />
      </div>
    </div>
  );
}
