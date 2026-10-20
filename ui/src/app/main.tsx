import { createRoot } from "react-dom/client";

import App from "@/app/App";
import "@/styles/index.css";

import { CartProvider } from "@/modules/cart/store";

import {
  registerCatalogProviderHealthCollector,
} from "@wooly/shared/catalog/providers/DefaultCatalogProvider";

import { AOSProvider } from "@/contexts/AOSProvider";

registerCatalogProviderHealthCollector();

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <AOSProvider>
      <App />
    </AOSProvider>
  </CartProvider>,
);
