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
  CatalogProductGrid,
} from "./CatalogProductGrid";

vi.mock(
  "@/modules/catalog/components/ProductCard",
  () => ({
    ProductCard: ({
      product,
      imagePriority,
    }: {
      product:
        Product;
      imagePriority?:
        boolean;
    }) => (
      <article
        data-testid={`grid-product-${product.id}`}
        data-priority={
          imagePriority
            ? "yes"
            : "no"
        }
      >
        {
          product.title
        }
      </article>
    ),
  }),
);

function createProduct(
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
  "CatalogProductGrid",
  () => {
    it(
      "conserva la matriz responsive oficial de Catalog V2",
      () => {
        const {
          container,
        } =
          render(
            <CatalogProductGrid
              products={[
                createProduct(
                  "A",
                ),
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
            "[data-catalog-product-grid]",
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

    it(
      "centraliza la prioridad de imágenes sin cambiar ProductCard",
      () => {
        render(
          <CatalogProductGrid
            products={[
              createProduct(
                "A",
              ),
              createProduct(
                "B",
              ),
            ]}
            cart={[]}
            imagePriorityIds={
              new Set([
                "A",
              ])
            }
            onAddToCart={
              vi.fn()
            }
            onImageClick={
              vi.fn()
            }
          />,
        );

        expect(
          screen.getByTestId(
            "grid-product-A",
          ),
        ).toHaveAttribute(
          "data-priority",
          "yes",
        );

        expect(
          screen.getByTestId(
            "grid-product-B",
          ),
        ).toHaveAttribute(
          "data-priority",
          "no",
        );
      },
    );
  },
);
