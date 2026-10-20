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

import {
  ProductPurchaseActions,
} from "./ProductPurchaseActions";

describe(
  "ProductPurchaseActions",
  () => {
    it(
      "mantiene compra directa para producto disponible",
      () => {
        const onAddToCart =
          vi.fn();

        render(
          <ProductPurchaseActions
            showWhatsAppButton={false}
            isPreventa={false}
            available
            isQtyInputValid
            effectiveQty={12}
            total={96}
            onWhatsApp={vi.fn()}
            onAddToCart={onAddToCart}
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Agregar 12 unidades · S/ 96.00",
            },
          ),
        );

        expect(
          onAddToCart,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "distingue visualmente preventa de reposición",
      () => {
        const {
          rerender,
        } = render(
          <ProductPurchaseActions
            showWhatsAppButton
            isPreventa
            available={false}
            isQtyInputValid
            effectiveQty={1}
            total={0}
            onWhatsApp={vi.fn()}
            onAddToCart={vi.fn()}
          />,
        );

        expect(
          screen.getByTestId(
            "product-detail-preorder-action",
          ),
        ).toHaveClass(
          "bg-green-600",
        );

        rerender(
          <ProductPurchaseActions
            showWhatsAppButton
            isPreventa={false}
            available={false}
            isQtyInputValid
            effectiveQty={1}
            total={10}
            onWhatsApp={vi.fn()}
            onAddToCart={vi.fn()}
          />,
        );

        expect(
          screen.getByTestId(
            "product-detail-restock-action",
          ),
        ).toHaveClass(
          "bg-orange-500",
        );

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Pedir reposición",
            },
          ),
        ).toBeInTheDocument();
      },
    );
  },
);
