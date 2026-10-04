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
  AddToCartModal,
} from "./AddToCartModal";

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "FLOR-001",
    title: "Rosa premium",
    description:
      "Producto de prueba.",
    category: "flores",
    price_1: 10,
    price_3: 9,
    price_12: 7,
    price_50: 6,
    price_100: 5,
    price_offer: null,
    stock: 30,
    img:
      "https://example.com/product.jpg",
    status: "publicado",
    ...overrides,
  };
}

function renderModal(
  overrides: Partial<
    React.ComponentProps<
      typeof AddToCartModal
    >
  > = {},
) {
  const props = {
    open: true,
    product:
      createProduct(),
    currentQty: 0,
    onClose: vi.fn(),
    onConfirmQuantity:
      vi.fn(),
    onOpenCart: vi.fn(),
    ...overrides,
  };

  return {
    props,
    ...render(
      <AddToCartModal
        {...props}
      />,
    ),
  };
}

describe(
  "AddToCartModal",
  () => {
    it(
      "permite seleccionar las cinco escalas comerciales hasta 100 unidades",
      () => {
        renderModal();

        const decrease =
          screen.getByRole(
            "button",
            {
              name:
                "Disminuir cantidad",
            },
          );

        const increase =
          screen.getByRole(
            "button",
            {
              name:
                "Aumentar cantidad",
            },
          );

        expect(
          decrease,
        ).toBeDisabled();

        expect(
          screen.getByTestId(
            "quick-add-quantity",
          ),
        ).toHaveTextContent(
          "1",
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 100 unidades a S/ 5.00 c/u",
            },
          ),
        );

        expect(
          screen.getByTestId(
            "quick-add-quantity",
          ),
        ).toHaveTextContent(
          "100",
        );

        expect(
          increase,
        ).toBeDisabled();
      },
    );

    it(
      "confirma la cantidad seleccionada antes de agregar al carrito",
      () => {
        const {
          props,
        } =
          renderModal();

        expect(
          props.onConfirmQuantity,
        ).not.toHaveBeenCalled();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Aumentar cantidad",
            },
          ),
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Aumentar cantidad",
            },
          ),
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Agregar 3 unidades a mi caja",
            },
          ),
        );

        expect(
          props.onConfirmQuantity,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          props.onConfirmQuantity,
        ).toHaveBeenCalledWith(
          3,
        );

        expect(
          screen.getByRole(
            "status",
          ),
        ).toHaveTextContent(
          "Ahora tienes 3 unidades",
        );

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Ver mi caja",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Agregar otro producto",
            },
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "oculta precios por escala y mantiene la oferta para la cantidad proyectada",
      () => {
        renderModal({
          product:
            createProduct({
              price_offer: 8,
            }),
        });

        expect(
          screen.getByText(
            /Oferta válida para cualquier cantidad hasta agotar stock\./,
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 3 unidades",
            },
          ),
        ).not.toHaveClass("tier");

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 12 unidades",
            },
          ),
        ).not.toHaveClass("tier");

        expect(
          screen.queryByText(
            "S/ 9.00",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "S/ 7.00",
          ),
        ).not.toBeInTheDocument();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Aumentar cantidad",
            },
          ),
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Aumentar cantidad",
            },
          ),
        );

        expect(
          screen.getByText(
            "S/ 8.00",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "S/ 24.00",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "mantiene las escalas para un producto sin oferta",
      () => {
        const {
          container,
        } =
          renderModal();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 3 unidades a S/ 9.00 c/u",
            },
          ),
        ).toHaveTextContent(
          "3u",
        );

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 12 unidades a S/ 7.00 c/u",
            },
          ),
        ).toHaveTextContent(
          "12u",
        );

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 50 unidades a S/ 6.00 c/u",
            },
          ),
        ).toHaveTextContent(
          "50u",
        );

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 100 unidades a S/ 5.00 c/u",
            },
          ),
        ).toHaveTextContent(
          "100u",
        );

        const unitShortcut =
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 1 unidad a S/ 10.00 c/u",
            },
          );

        const wholesaleShortcut =
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 3 unidades a S/ 9.00 c/u",
            },
          );

        const dozenShortcut =
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 12 unidades a S/ 7.00 c/u",
            },
          );

        expect(
          unitShortcut,
        ).toHaveClass(
          "tier",
          "tier-chip",
        );

        expect(
          wholesaleShortcut,
        ).toHaveClass(
          "tier",
          "tier-chip",
        );

        expect(
          dozenShortcut,
        ).toHaveClass(
          "tier",
          "tier-chip",
        );

        expect(
          unitShortcut.className,
        ).not.toBe(
          wholesaleShortcut.className,
        );

        expect(
          wholesaleShortcut.className,
        ).not.toBe(
          dozenShortcut.className,
        );

        fireEvent.click(
          wholesaleShortcut,
        );

        expect(
          screen.getByTestId(
            "quick-add-quantity",
          ),
        ).toHaveTextContent(
          "3",
        );

        expect(
          container,
        ).toHaveTextContent(
          /PU\s*=\s*S\/\s*9\.00/,
        );
      },
    );

    it(
      "muestra la siguiente escala y permite completarla desde el incentivo",
      () => {
        renderModal();

        const nextTier =
          screen.getByTestId(
            "next-volume-tier",
          );

        expect(
          nextTier,
        ).toHaveTextContent(
          "Te faltan 2 unidades para 3u",
        );

        expect(
          nextTier,
        ).toHaveTextContent(
          "S/ 9.00 c/u",
        );

        expect(
          nextTier,
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
          screen.getByTestId(
            "quick-add-quantity",
          ),
        ).toHaveTextContent(
          "3",
        );

        expect(
          screen.getByTestId(
            "next-volume-tier",
          ),
        ).toHaveTextContent(
          "Te faltan 9 unidades para 12u",
        );
      },
    );

    it(
      "no muestra incentivo de siguiente escala cuando hay una oferta activa",
      () => {
        renderModal({
          product:
            createProduct({
              price_offer: 8,
            }),
        });

        expect(
          screen.queryByTestId(
            "next-volume-tier",
          ),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "usa las escalas como cantidad total objetivo cuando el producto ya está en Mi Caja",
      () => {
        const {
          props,
          container,
        } =
          renderModal({
            currentQty: 2,
          });

        const reachedTier =
          screen.getByTestId(
            "quick-quantity-1",
          );

        expect(
          reachedTier,
        ).toBeDisabled();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Llegar a 3 unidades agregando 1 a S/ 9.00 c/u",
            },
          ),
        ).toBeInTheDocument();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Llegar a 12 unidades agregando 10 a S/ 7.00 c/u",
            },
          ),
        );

        expect(
          screen.getByTestId(
            "quick-add-quantity",
          ),
        ).toHaveTextContent(
          "10",
        );

        expect(
          container,
        ).toHaveTextContent(
          /PU\s*=\s*S\/\s*7\.00/,
        );

        expect(
          container,
        ).toHaveTextContent(
          /Total acumulado\s*=\s*S\/\s*84\.00/,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Agregar 10 unidades a mi caja",
            },
          ),
        );

        expect(
          props.onConfirmQuantity,
        ).toHaveBeenCalledWith(
          10,
        );

        expect(
          screen.getByRole(
            "status",
          ),
        ).toHaveTextContent(
          "Ahora tienes 12 unidades",
        );
      },
    );

    it(
      "oculta escalas sin precio válido",
      () => {
        renderModal({
          product:
            createProduct({
              price_50: null,
              price_100: null,
            }),
        });

        expect(
          screen.getByTestId(
            "quick-quantity-1",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByTestId(
            "quick-quantity-3",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByTestId(
            "quick-quantity-12",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByTestId(
            "quick-quantity-50",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByTestId(
            "quick-quantity-100",
          ),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "respeta la etiqueta secundaria personalizada",
      () => {
        const {
          props,
        } =
          renderModal({
            secondaryActionLabel:
              "Seguir viendo",
          });

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Agregar 1 unidad a mi caja",
            },
          ),
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Seguir viendo",
            },
          ),
        );

        expect(
          props.onClose,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );
  },
);
