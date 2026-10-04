import {
  fireEvent,
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
  ProductVolumePriceSelector,
} from "./ProductVolumePriceSelector";

function createProduct(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id:
      "DETAIL-001",

    title:
      "Producto de prueba",

    description:
      "Producto para validar el selector.",

    category:
      "flores",

    price_1:
      10,

    price_3:
      9,

    price_12:
      8,

    price_50:
      7,

    price_100:
      6,

    price_offer:
      null,

    stock:
      100,

    img:
      "https://example.com/product.jpg",

    status:
      "publicado",

    ...overrides,
  };
}

describe(
  "ProductVolumePriceSelector",
  () => {
    it(
      "muestra únicamente cantidades rápidas neutrales durante una oferta",
      () => {
        const onSelectQty =
          vi.fn();

        render(
          <ProductVolumePriceSelector
            product={createProduct({
              price_offer:
                5,
            })}
            effectiveQty={1}
            onSelectQty={
              onSelectQty
            }
          />,
        );

        expect(
          screen.getByTestId(
            "product-detail-quick-quantity-1",
          ),
        ).toHaveTextContent(
          "1u",
        );

        expect(
          screen.getByTestId(
            "product-detail-quick-quantity-3",
          ),
        ).toHaveTextContent(
          "3u",
        );

        expect(
          screen.getByTestId(
            "product-detail-quick-quantity-12",
          ),
        ).toHaveTextContent(
          "12u",
        );

        expect(
          screen.getByTestId(
            "product-detail-quick-quantity-50",
          ),
        ).toHaveTextContent(
          "50u",
        );

        expect(
          screen.getByTestId(
            "product-detail-quick-quantity-100",
          ),
        ).toHaveTextContent(
          "100u",
        );

        expect(
          screen.queryByText(
            "S/9.00",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "S/8.00",
          ),
        ).not.toBeInTheDocument();

        fireEvent.click(
          screen.getByTestId(
            "product-detail-quick-quantity-3",
          ),
        );

        expect(
          onSelectQty,
        ).toHaveBeenCalledWith(
          3,
        );
      },
    );

    it(
      "mantiene precios y colores dinámicos cuando no existe oferta",
      () => {
        const onSelectQty =
          vi.fn();

        render(
          <ProductVolumePriceSelector
            product={createProduct()}
            effectiveQty={5}
            onSelectQty={
              onSelectQty
            }
          />,
        );

        const tierOne =
          screen.getByTestId(
            "product-detail-volume-tier-1",
          );

        const tierThree =
          screen.getByTestId(
            "product-detail-volume-tier-3",
          );

        const tierTwelve =
          screen.getByTestId(
            "product-detail-volume-tier-12",
          );

        expect(
          tierOne,
        ).toHaveClass(
          "volume-price-1",
        );

        expect(
          tierThree,
        ).toHaveClass(
          "volume-price-3",
        );

        expect(
          tierTwelve,
        ).toHaveClass(
          "volume-price-12",
        );

        expect(
          tierThree,
        ).toHaveAttribute(
          "aria-pressed",
          "true",
        );

        expect(
          tierThree,
        ).toHaveTextContent(
          "S/ 9.00",
        );

        expect(
          tierTwelve,
        ).toHaveTextContent(
          "S/ 8.00",
        );

        fireEvent.click(
          tierTwelve,
        );

        expect(
          onSelectQty,
        ).toHaveBeenCalledWith(
          12,
        );
      },
    );

    it(
      "ignora tiers con precios inválidos",
      () => {
        render(
          <ProductVolumePriceSelector
            product={createProduct({
              price_3:
                0,

              price_12:
                Number.NaN,

              price_50:
                -1,
            })}
            effectiveQty={1}
            onSelectQty={
              vi.fn()
            }
          />,
        );

        expect(
          screen.queryByTestId(
            "product-detail-volume-tier-3",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByTestId(
            "product-detail-volume-tier-12",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByTestId(
            "product-detail-volume-tier-50",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.getByTestId(
            "product-detail-volume-tier-100",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);
