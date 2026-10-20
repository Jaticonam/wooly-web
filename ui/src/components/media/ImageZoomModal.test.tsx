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

import { ImageZoomModal } from "./ImageZoomModal";

describe("ImageZoomModal footerAction", () => {
  it("renderiza la accion opcional en el pie y no cierra el modal al usarla", () => {
    const onClose = vi.fn();
    const onCapture = vi.fn();

    const { container } = render(
      <ImageZoomModal
        src="https://example.com/product.jpg"
        title="Producto de prueba"
        onClose={onClose}
        footerAction={
          <button
            type="button"
            onClick={onCapture}
          >
            Capturar
          </button>
        }
      />,
    );

    expect(
      container.querySelector(
        "[data-image-zoom-footer]",
      ),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Capturar",
      }),
    );

    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("bloquea el scroll del documento mientras está abierto y lo restaura al cerrar", () => {
    document.body.style.overflow =
      "auto";

    const {
      unmount,
    } = render(
      <ImageZoomModal
        src="https://example.com/product.jpg"
        title="Producto de prueba"
        onClose={vi.fn()}
      />,
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
      "auto",
    );
  });

  it("sigue funcionando sin footerAction", () => {
    render(
      <ImageZoomModal
        src="https://example.com/product.jpg"
        title="Producto sin accion"
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: "Capturar",
      }),
    ).toBeNull();

    expect(
      screen.getByRole("button", {
        name: "Cerrar imagen",
      }),
    ).toBeTruthy();
  });
});
