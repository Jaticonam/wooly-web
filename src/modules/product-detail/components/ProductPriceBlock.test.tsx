import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ProductPriceBlock,
} from "./ProductPriceBlock";

describe(
  "ProductPriceBlock",
  () => {
    it(
      "muestra PU y total sin confundir un precio escalado con una oferta",
      () => {
        render(
          <ProductPriceBlock
            unitPrice={9}
            total={45}
            effectiveQty={5}
            pricePulse={false}
            showUnlock
            savingsByQty={5}
            basePrice={10}
            nextVolumePrice={{
              qty: 12,
              unitPrice: 8,
            }}
            isQtyInputValid
            hasOffer={false}
          />,
        );

        expect(
          screen.getByTestId(
            "product-detail-unit-price",
          ),
        ).toHaveTextContent(
          "S/ 9.00",
        );

        expect(
          screen.getByTestId(
            "product-detail-unit-price",
          ),
        ).toHaveClass(
          "text-[#1d8299]",
        );

        expect(
          screen.getByTestId(
            "product-detail-total",
          ),
        ).toHaveTextContent(
          "S/ 45.00",
        );

        expect(
          screen.getByText(
            "Total · 5u",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByTestId(
            "product-detail-savings",
          ),
        ).toHaveTextContent(
          "Ahorro total: S/ 5.00",
        );

        expect(
          screen.queryByText(
            "⚡ AHORRAS",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "La oferta aplica a cualquier cantidad hasta agotar stock.",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            /Mejor precio desbloqueado/i,
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            /Estás pagando/i,
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            /Agrega .* más/i,
          ),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "mantiene el precio rojo y el badge secundario durante una oferta",
      () => {
        render(
          <ProductPriceBlock
            unitPrice={5}
            total={15}
            effectiveQty={3}
            pricePulse={false}
            showUnlock={false}
            savingsByQty={15}
            basePrice={10}
            nextVolumePrice={null}
            isQtyInputValid
            hasOffer
          />,
        );

        const offerBadge =
          screen.getByText(
            "⚡ AHORRAS",
          );

        expect(
          offerBadge,
        ).toBeInTheDocument();

        expect(
          offerBadge,
        ).toHaveClass(
          "text-purple-700",
        );

        expect(
          screen.getByText(
            "La oferta aplica a cualquier cantidad hasta agotar stock.",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByTestId(
            "product-detail-unit-price",
          ),
        ).toHaveTextContent(
          "S/ 5.00",
        );

        expect(
          screen.getByTestId(
            "product-detail-unit-price",
          ),
        ).toHaveClass(
          "text-red-600",
        );

        expect(
          screen.getByTestId(
            "product-detail-total",
          ),
        ).toHaveTextContent(
          "S/ 15.00",
        );
      },
    );

    it(
      "muestra solo el precio unitario cuando el producto no es transaccionable",
      () => {
        render(
          <ProductPriceBlock
            unitPrice={10}
            total={10}
            effectiveQty={1}
            pricePulse={false}
            showUnlock={false}
            savingsByQty={0}
            basePrice={10}
            nextVolumePrice={null}
            isQtyInputValid
            hasOffer={false}
            showTotal={false}
          />,
        );

        expect(
          screen.getByTestId(
            "product-detail-unit-price",
          ),
        ).toHaveTextContent(
          "S/ 10.00",
        );

        expect(
          screen.queryByTestId(
            "product-detail-total",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByTestId(
            "product-detail-savings",
          ),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "muestra la validación cuando la cantidad es inválida",
      () => {
        render(
          <ProductPriceBlock
            unitPrice={10}
            total={10}
            effectiveQty={1}
            pricePulse={false}
            showUnlock={false}
            savingsByQty={0}
            basePrice={10}
            nextVolumePrice={null}
            isQtyInputValid={false}
            hasOffer={false}
          />,
        );

        expect(
          screen.getByText(
            "Ingresa una cantidad válida para continuar",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);
