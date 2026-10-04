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
  ProductVolumePriceProgress,
} from "./ProductVolumePriceProgress";

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "DETAIL-001",
    title: "Producto de prueba",
    description: "Producto para validar el progreso.",
    category: "flores",
    price_1: 10,
    price_3: 9,
    price_12: 8,
    price_50: 7,
    price_100: 6,
    price_offer: null,
    stock: 100,
    img: "https://example.com/product.jpg",
    status: "publicado",
    ...overrides,
  };
}

describe(
  "ProductVolumePriceProgress",
  () => {
    it(
      "guía a la siguiente escala y permite seleccionarla",
      () => {
        const onSelectQty =
          vi.fn();

        render(
          <ProductVolumePriceProgress
            product={createProduct()}
            effectiveQty={1}
            nextVolumePrice={{
              qty: 3,
              unitPrice: 9,
            }}
            onSelectQty={onSelectQty}
          />,
        );

        const incentive =
          screen.getByTestId(
            "product-detail-next-tier",
          );

        expect(
          incentive,
        ).toHaveTextContent(
          "Te faltan 2 unidades para 3u",
        );

        expect(
          incentive,
        ).toHaveTextContent(
          "Ahorra S/ 1.00 c/u",
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Completar escala de 3 unidades",
            },
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
      "muestra el mejor precio cuando ya no existe una escala siguiente",
      () => {
        render(
          <ProductVolumePriceProgress
            product={createProduct()}
            effectiveQty={100}
            nextVolumePrice={null}
            onSelectQty={vi.fn()}
          />,
        );

        expect(
          screen.getByTestId(
            "product-detail-best-price",
          ),
        ).toHaveTextContent(
          "Mejor precio disponible activado",
        );
      },
    );
  },
);
