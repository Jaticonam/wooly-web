import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  CartItem,
} from "@/modules/cart/types";

const checkoutWithProviderMock =
  vi.hoisted(
    () =>
      vi.fn(),
  );

const catalogProviderMock =
  vi.hoisted(
    () => ({
      source:
        "contract-fixture",
    }),
  );

vi.mock(
  "@/modules/cart/utils/checkout",
  () => ({
    checkoutWithProvider:
      checkoutWithProviderMock,
  }),
);

vi.mock(
  "@/modules/catalog/providers/DefaultCatalogProvider",
  () => ({
    catalogProvider:
      catalogProviderMock,
  }),
);

import {
  CartFooter,
} from "./CartFooter";

function createItem():
  CartItem {
  return {
    id:
      "OFERTA-001",

    title:
      "Producto vigente",

    description:
      "Producto para prueba.",

    category:
      "flores",

    price_1:
      10,

    price_3:
      9,

    price_offer:
      null,

    stock:
      100,

    img:
      "https://example.com/product.jpg",

    status:
      "publicado",

    qty:
      3,

    note:
      "",
  };
}

beforeEach(
  () => {
    checkoutWithProviderMock
      .mockReset();
  },
);

describe(
  "CartFooter reconciliado",
  () => {
    it(
      "presenta una jerarquía compacta de productos, unidades y total",
      () => {
        const item =
          createItem();

        render(
          <CartFooter
            cart={[
              item,
            ]}
            totalItems={
              3
            }
            totalPrice={
              27
            }
            savings={
              3
            }
            onClearCart={
              vi.fn()
            }
            onReplaceCart={
              vi.fn()
            }
            onClose={
              vi.fn()
            }
          />,
        );

        expect(
          screen.getByTestId(
            "cart-summary-units",
          ),
        ).toHaveTextContent(
          "3 unidades",
        );

        expect(
          screen.getByTestId(
            "cart-summary-units",
          ),
        ).toHaveTextContent(
          "1 producto",
        );

        expect(
          screen.getByTestId(
            "cart-summary-total",
          ),
        ).toHaveTextContent(
          "S/ 27.00",
        );

        expect(
          screen.getByText(
            "Verificaremos precios y disponibilidad antes de abrir WhatsApp.",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "avisa el cambio y solicita una segunda confirmación",
      async () => {
        const item =
          createItem();

        const onClearCart =
          vi.fn();

        const onReplaceCart =
          vi.fn();

        const onClose =
          vi.fn();

        checkoutWithProviderMock
          .mockResolvedValue({
            status:
              "cart-updated",

            reconciliation: {
              ok:
                true,

              items: [
                item,
              ],

              changes: [{
                code:
                  "PRICE_CHANGED",

                productId:
                  item.id,

                productTitle:
                  item.title,

                previousUnitPrice:
                  8,

                currentUnitPrice:
                  9,
              }],
            },
          });

        render(
          <CartFooter
            cart={[
              item,
            ]}
            totalItems={
              3
            }
            totalPrice={
              27
            }
            savings={
              3
            }
            onClearCart={
              onClearCart
            }
            onReplaceCart={
              onReplaceCart
            }
            onClose={
              onClose
            }
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Enviar pedido por WhatsApp",
            },
          ),
        );

        expect(
          await screen.findByRole(
            "alert",
          ),
        ).toHaveTextContent(
          "El precio de 1 producto cambió.",
        );

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Revisé los cambios: enviar por WhatsApp",
            },
          ),
        ).toBeInTheDocument();

        await waitFor(
          () => {
            expect(
              checkoutWithProviderMock,
            ).toHaveBeenCalledWith(
              catalogProviderMock,
              [
                item,
              ],
              3,
              onClearCart,
              onClose,
              onReplaceCart,
            );
          },
        );
      },
    );

    it(
      "conserva la caja y muestra error cuando falla el provider",
      async () => {
        const item =
          createItem();

        const onReplaceCart =
          vi.fn();

        checkoutWithProviderMock
          .mockResolvedValue({
            status:
              "provider-error",

            reconciliation: {
              ok:
                false,

              reason:
                "PROVIDER_ERROR",

              originalItems: [
                item,
              ],
            },
          });

        render(
          <CartFooter
            cart={[
              item,
            ]}
            totalItems={
              3
            }
            totalPrice={
              27
            }
            savings={
              0
            }
            onClearCart={
              vi.fn()
            }
            onReplaceCart={
              onReplaceCart
            }
            onClose={
              vi.fn()
            }
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Enviar pedido por WhatsApp",
            },
          ),
        );

        expect(
          await screen.findByRole(
            "alert",
          ),
        ).toHaveTextContent(
          "Conservamos todos tus productos.",
        );

        expect(
          onReplaceCart,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
