import {
  render,
  screen,
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
  RelatedProducts,
} from "./RelatedProducts";

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

function product(
  id:
    string,
): Product {
  return {
    id,
    title:
      `Producto ${id}`,
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
}

describe(
  "RelatedProducts",
  () => {
    it(
      "nunca vuelve a mostrar el producto actual",
      () => {
        render(
          <RelatedProducts
            products={[
              product(
                "CURRENT",
              ),
              product(
                "OTHER",
              ),
            ]}
            currentProductId="CURRENT"
            onAddToCart={
              vi.fn()
            }
            onImageClick={
              vi.fn()
            }
          />,
        );

        expect(
          screen.queryByText(
            "Producto CURRENT",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.getByText(
            "Producto OTHER",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "mantiene la densidad responsive del catálogo",
      () => {
        const {
          container,
        } =
          render(
            <RelatedProducts
              products={[
                product(
                  "A",
                ),
                product(
                  "B",
                ),
              ]}
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
            ".grid",
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
