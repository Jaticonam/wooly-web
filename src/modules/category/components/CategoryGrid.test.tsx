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
  "@/modules/catalog/components/CatalogProductGrid",
  () => ({
    CatalogProductGrid: ({
      products,
    }: {
      products:
        Product[];
    }) => (
      <div data-catalog-product-grid>
        {products.map(
          (
            product,
          ) => (
            <article
              key={
                product.id
              }
            >
              {
                product.title
              }
            </article>
          ),
        )}
      </div>
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
      "delega la grilla a CatalogProductGrid",
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

        expect(
          container.querySelector(
            "[data-catalog-product-grid]",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);
