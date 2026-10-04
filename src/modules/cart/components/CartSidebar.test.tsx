import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CartSidebar,
} from "./CartSidebar";

vi.mock(
  "@/modules/cart/components/CartHeader",
  () => ({
    CartHeader: ({
      onClose,
    }: {
      onClose:
        () => void;
    }) => (
      <button
        type="button"
        onClick={
          onClose
        }
      >
        Cerrar
      </button>
    ),
  }),
);

vi.mock(
  "@/modules/cart/components/CartEmpty",
  () => ({
    CartEmpty:
      () => (
        <div>
          Caja vacía
        </div>
      ),
  }),
);

vi.mock(
  "@/modules/cart/components/CartRow",
  () => ({
    CartRow:
      () => null,
  }),
);

vi.mock(
  "@/modules/cart/components/CartFooter",
  () => ({
    CartFooter:
      () => null,
  }),
);

function renderSidebar(
  isOpen:
    boolean,
  onClose =
    vi.fn(),
) {
  return render(
    <CartSidebar
      isOpen={
        isOpen
      }
      onClose={
        onClose
      }
      cart={
        []
      }
      totalItems={
        0
      }
      totalPrice={
        0
      }
      savings={
        0
      }
      onRemove={
        vi.fn()
      }
      onChangeQty={
        vi.fn()
      }
      onSetQty={
        vi.fn()
      }
      onChangeNote={
        vi.fn()
      }
      onClearCart={
        vi.fn()
      }
      onReplaceCart={
        vi.fn()
      }
    />,
  );
}

afterEach(
  () => {
    document.body.style.overflow =
      "";
  },
);

describe(
  "CartSidebar",
  () => {
    it(
      "se expone como diálogo modal y bloquea el scroll mientras está abierto",
      () => {
        const {
          unmount,
        } =
          renderSidebar(
            true,
          );

        expect(
          screen.getByRole(
            "dialog",
            {
              name:
                "Mi Caja",
            },
          ),
        ).toHaveAttribute(
          "aria-modal",
          "true",
        );

        expect(
          document.body.style.overflow,
        ).toBe(
          "hidden",
        );

        unmount();

        expect(
          document.body.style.overflow,
        ).toBe(
          "",
        );
      },
    );

    it(
      "cierra con Escape",
      () => {
        const onClose =
          vi.fn();

        renderSidebar(
          true,
          onClose,
        );

        fireEvent.keyDown(
          window,
          {
            key:
              "Escape",
          },
        );

        expect(
          onClose,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );
  },
);
