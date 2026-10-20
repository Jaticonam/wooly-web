import { createContext, useContext } from "react";
import { useCart } from "./cart.store";

type CartStore = ReturnType<typeof useCart>;

const CartContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cartStore = useCart();

  return (
    <CartContext.Provider value={cartStore}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartStore() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCartStore debe usarse dentro de CartProvider");
  }

  return context;
}
