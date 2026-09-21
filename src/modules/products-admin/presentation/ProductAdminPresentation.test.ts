import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Product,
} from "@/shared/types/product";
import {
  resolveProductAdminPresentation,
} from "./ProductAdminPresentation";

const product = (changes: Partial<Product> = {}): Product => ({
  id: "FL-001",
  title: "Ramo premium",
  description: "Producto",
  category: "flores",
  price_1: 10,
  price_3: 9,
  price_12: 8,
  stock: 20,
  img: "/ramo.jpg",
  status: "publicado",
  ...changes,
});

describe("ProductAdminPresentation", () => {
  it("resume el precio unitario y el menor precio por volumen", () => {
    const result = resolveProductAdminPresentation(product());
    expect(result.unitPriceLabel).toContain("10.00");
    expect(result.volumePriceLabel).toContain("8.00");
  });

  it("presenta stock bajo y preventa con lenguaje canónico", () => {
    expect(resolveProductAdminPresentation(product({ stock: 3 })).stockLabel)
      .toBe("Stock bajo · 3");
    expect(resolveProductAdminPresentation(product({ status: "preventa" })).stockLabel)
      .toBe("Preventa");
  });

  it("expone inconsistencias sin convertirlas en agotado", () => {
    const result = resolveProductAdminPresentation(product({ stock: 0 }));

    expect(result.stockLabel).toBe("Stock inconsistente");
    expect(result.stockTone).toBe("inconsistent");
    expect(result.observations).toContain("Stock inconsistente");
  });
});
