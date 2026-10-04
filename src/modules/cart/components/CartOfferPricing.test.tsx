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
  CartItem,
} from "@/modules/cart/types";

import {
  CartRow,
} from "./CartRow";

import {
  CartVolumePriceSelector,
} from "./CartVolumePriceSelector";

function createItem(
  overrides: Partial<CartItem> = {},
): CartItem {
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
    stock: 100,
    img:
      "https://example.com/product.jpg",
    status: "publicado",
    qty: 1,
    note: "",
    ...overrides,
  } as CartItem;
}

function renderRow(
  item: CartItem,
) {
  return render(
    <CartRow
      item={item}
      onRemove={vi.fn()}
      onChangeQty={vi.fn()}
      onSetQty={vi.fn()}
      onChangeNote={vi.fn()}
    />,
  );
}

describe(
  "precio de oferta dentro de Mi Caja",
  () => {
    it(
      "blinda el selector mayorista cuando la oferta está activa",
      () => {
        const {
          container,
        } = render(
          <CartVolumePriceSelector
            item={createItem({
              price_offer: 8,
              qty: 50,
            })}
            onSetQty={vi.fn()}
          />,
        );

        expect(
          container,
        ).toBeEmptyDOMElement();
      },
    );

    it(
      "muestra exclusivamente el modo oferta aunque la cantidad supere 12",
      () => {
        const {
          container,
        } =
          renderRow(
            createItem({
              price_offer: 8,
              qty: 50,
            }),
          );

        expect(
          screen.getByText(
            "Precio de oferta",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByText(
            "1u",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "3u",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "12u",
          ),
        ).not.toBeInTheDocument();

        expect(
          container,
        ).toHaveTextContent(
          /50u × S\/\s*8\.00 c\/u/,
        );

        expect(
          container,
        ).toHaveTextContent(
          "400.00",
        );
      },
    );

    it(
      "conserva el selector de tiers en modo volumen",
      () => {
        renderRow(
          createItem({
            qty: 3,
          }),
        );

        expect(
          screen.queryByText(
            "Precio de oferta",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.getByText(
            "1u",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "3u",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "12u",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "50u",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "100u",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Seleccionar 50 unidades",
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
                "Seleccionar 50 unidades",
            },
          ),
        ).not.toHaveTextContent(
          "S/",
        );
      },
    );
  },
);
