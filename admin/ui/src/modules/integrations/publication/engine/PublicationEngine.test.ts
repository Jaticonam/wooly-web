import { describe, expect, it } from "vitest";

import type { Product } from "@wooly/contracts/types/product";
import type { PublicationPlan } from "../models/PublicationPlan";
import { PublicationEngine } from "./PublicationEngine";

const createProduct = (
  overrides: Partial<Product> = {},
): Product => ({
  id: "P-1",
  title: "Producto",
  description: "Producto de prueba",
  category: "flores",
  price_1: 10,
  stock: 2,
  img: "https://example.com/product.jpg",
  status: "publicado",
  campaigns: [],
  priority: 1,
  ...overrides,
});

const createPlan = (
  overrides: Partial<PublicationPlan> = {},
): PublicationPlan => ({
  id: "plan-r82",
  name: "Plan R8.2",
  connector: "test",
  enabled: true,
  mode: "all",
  ...overrides,
});

describe("PublicationEngine", () => {
  it("aplica un pipeline válido y permite productos publicables", () => {
    const result = PublicationEngine.apply(
      [createProduct(), createProduct({ id: "P-2", priority: 2 })],
      createPlan({ sorting: { by: "priority", direction: "desc" } }),
    );

    expect(result.items.map((item) => item.id)).toEqual(["P-2", "P-1"]);
    expect(result).toMatchObject({
      totalItems: 2,
      selectedItems: 2,
      omittedItems: 0,
    });
  });

  it("bloquea un plan deshabilitado", () => {
    const result = PublicationEngine.apply(
      [createProduct()],
      createPlan({ enabled: false }),
    );
    expect(result.items).toEqual([]);
    expect(result.omittedItems).toBe(1);
  });

  it("aísla errores parciales omitiendo productos no publicables", () => {
    const result = PublicationEngine.apply(
      [
        createProduct(),
        createProduct({ id: "DRAFT", status: "borrador" }),
        createProduct({ id: "EMPTY", stock: 0 }),
      ],
      createPlan(),
    );
    expect(result.items.map((item) => item.id)).toEqual(["P-1"]);
    expect(result.omittedItems).toBe(2);
  });

  it("produce un resultado serializable", () => {
    const result = PublicationEngine.apply([createProduct()], createPlan());
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(JSON.parse(JSON.stringify(result))).toMatchObject({
      selectedItems: 1,
      plan: { id: "plan-r82" },
    });
  });
});
