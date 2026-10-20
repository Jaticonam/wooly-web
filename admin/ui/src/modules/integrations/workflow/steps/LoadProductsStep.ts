import { loadAllProducts } from "@wooly/shared/catalog/services/fetchProducts";
import type { WorkflowStep } from "../contracts/WorkflowStep";

export const LoadProductsStep: WorkflowStep = {
  key: "load-products",
  name: "Cargar productos",
  enabled: true,

  async execute(context) {
    const products = await loadAllProducts();

    context.data = products;
    context.state.products = products;
    context.logs.push(`✅ Productos cargados: ${products.length}`);

    return context;
  },
};
