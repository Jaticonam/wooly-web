import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";
import {
  resolveProductAdminOperationalState,
  summarizeProductAdminOperations,
} from "./ProductAdminOperationalState";

const product = (changes: Partial<Product> = {}): Product => ({
  id: "FL-001",
  title: "Ramo premium",
  description: "Producto",
  category: "flores",
  price_1: 10,
  stock: 20,
  img: "/ramo.jpg",
  status: "publicado",
  ...changes,
});

describe("ProductAdminOperationalState", () => {
  it("no disfraza como agotado un publicado con stock inconsistente", () => {
    const state = resolveProductAdminOperationalState(product({ stock: 0 }));

    expect(state.inventoryState).toBe("inconsistent");
    expect(state.inventoryLabel).toBe("Stock inconsistente");
    expect(state.observations).toContain("Stock inconsistente");
  });

  it("deriva métricas operativas desde la política comercial", () => {
    const summary = summarizeProductAdminOperations([
      product(),
      product({ id: "FL-002", status: "preventa" }),
      product({ id: "FL-003", status: "oculto" }),
      product({ id: "FL-004", stock: 0 }),
    ]);

    expect(summary).toEqual({
      total: 4,
      visible: 2,
      sellable: 1,
      observed: 1,
    });
  });
});
