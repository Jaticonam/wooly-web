import { createRoot } from "react-dom/client";

import App from "@/app/App";
import "@/styles/index.css";

import {
  registerCatalogProviderHealthCollector,
} from "@wooly/shared/catalog/providers/DefaultCatalogProvider";

registerCatalogProviderHealthCollector();

createRoot(document.getElementById("root")!).render(
  <App />,
);
