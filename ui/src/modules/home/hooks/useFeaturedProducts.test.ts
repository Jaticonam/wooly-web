import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";
import {
  selectFeaturedProducts,
} from "./useFeaturedProducts";

const createProduct = (
  id: string,
  priority: number,
  overrides: Partial<Product> = {},
): Product => ({
  id,
  title: id,
  description: "Producto",
  category: "flores",
  price_1: 10,
  stock: 10,
  img: "product.jpg",
  status: "publicado",
  priority,
  ...overrides,
});

describe("selectFeaturedProducts", () => {
  it("conserva solo productos comprables con prioridad mínima", () => {
    const selected =
      selectFeaturedProducts(
        [
          createProduct("featured", 80),
          createProduct("low", 79),
          createProduct(
            "draft",
            100,
            { status: "borrador" },
          ),
        ],
        () => 0,
      );

    expect(
      selected.map(
        (product) => product.id,
      ),
    ).toEqual(["featured"]);
  });

  it("limita la selección a ocho productos", () => {
    const products = Array.from(
      { length: 10 },
      (_, index) =>
        createProduct(
          `P-${index}`,
          100 - index,
        ),
    );

    expect(
      selectFeaturedProducts(
        products,
        () => 0,
      ),
    ).toHaveLength(8);
  });

  it("usa el factor aleatorio sin mutar la entrada", () => {
    const products = [
      createProduct("A", 80),
      createProduct("B", 80),
    ];
    const original = [...products];
    const values = [0, 1];

    expect(
      selectFeaturedProducts(
        products,
        () => values.shift() ?? 0,
      ).map((product) => product.id),
    ).toEqual(["B", "A"]);
    expect(products).toEqual(original);
  });
});
