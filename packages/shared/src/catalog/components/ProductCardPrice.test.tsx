import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  ProductCardPrice,
} from "./ProductCardPrice";

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "FLOR-001",
    title: "Rosa premium",
    description: "Producto de prueba.",
    category: "flores",
    price_1: 10,
    stock: 20,
    img: "https://example.com/product.jpg",
    status: "publicado",
    ...overrides,
  };
}

describe(
  "ProductCardPrice",
  () => {
    it.each([
      ["sin oferta", undefined, "10.0"],
      ["oferta igual", 10, "10.0"],
      ["oferta mayor", 12, "10.0"],
      ["oferta cero", 0, "10.0"],
      ["oferta negativa", -2, "10.0"],
      ["oferta NaN", Number.NaN, "10.0"],
      [
        "oferta Infinity",
        Number.POSITIVE_INFINITY,
        "10.0",
      ],
    ])(
      "muestra el precio base con %s",
      (
        _case,
        price_offer,
        expected,
      ) => {
        render(
          <ProductCardPrice
            product={createProduct({
              price_offer,
            })}
          />,
        );

        expect(
          screen.getByText(
            expected,
          ),
        ).toBeInTheDocument();

        expect(
          document.querySelector(
            ".line-through",
          ),
        ).toBeNull();
      },
    );

    it(
      "muestra una oferta canónica y el precio anterior",
      () => {
        render(
          <ProductCardPrice
            product={createProduct({
              price_offer: 8,
            })}
          />,
        );

        expect(
          screen.getByText("8.0"),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "S/10.0",
          ),
        ).toHaveClass(
          "line-through",
        );
      },
    );

    it.each([
      0,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      "muestra cero para price_1 inválido: %s",
      (price_1) => {
        render(
          <ProductCardPrice
            product={createProduct({
              price_1,
            })}
          />,
        );

        expect(
          screen.getByText("0.0"),
        ).toBeInTheDocument();
      },
    );

    it(
      "no acepta una oferta sin precio base válido",
      () => {
        render(
          <ProductCardPrice
            product={createProduct({
              price_1: 0,
              price_offer: 8,
            })}
          />,
        );

        expect(
          screen.getByText("0.0"),
        ).toBeInTheDocument();

        expect(
          screen.queryByText(
            "8.0",
          ),
        ).not.toBeInTheDocument();
      },
    );
  },
);
