import { createRoot } from "react-dom/client";

import App from "@/app/App";
import "@/styles/index.css";
import "@jung/admin-master/styles.css";

import {
  registerCatalogProviderHealthCollector,
} from "@wooly/shared/catalog/providers/DefaultCatalogProvider";

registerCatalogProviderHealthCollector();

createRoot(document.getElementById("root")!).render(
  <App />,
);
