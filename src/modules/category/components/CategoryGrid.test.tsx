import {
  render,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import {
  CategoryGrid,
} from "./CategoryGrid";

vi.mock(
  "@/modules/catalog/components/ProductCard",
  () => ({
    ProductCard: ({
      product,
    }: {
      product:
        Product;
    }) => (
      <article>
        {
          product.title
        }
      </article>
    ),
  }),
);

const product: Product = {
  id:
    "CAT-001",
  title:
    "Producto",
  description:
    "Descripción",
  category:
    "flores",
  price_1:
    10,
  stock:
    10,
  img:
    "https://example.com/product.jpg",
  status:
    "publicado",
};

describe(
  "CategoryGrid",
  () => {
    it(
      "usa la misma densidad responsive que Catalog V2",
      () => {
        const {
          container,
        } =
          render(
            <CategoryGrid
              products={[
                product,
              ]}
              cart={[]}
              onAddToCart={
                vi.fn()
              }
              onImageClick={
                vi.fn()
              }
            />,
          );

        const grid =
          container.querySelector(
            "[data-category-grid]",
          );

        expect(
          grid,
        ).toHaveClass(
          "grid-cols-2",
          "sm:grid-cols-3",
          "md:grid-cols-4",
          "lg:grid-cols-5",
          "xl:grid-cols-6",
          "2xl:grid-cols-7",
        );
      },
    );
  },
);
