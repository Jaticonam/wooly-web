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

import type { Product } from "@/shared/types/product";
import { ProductGallery } from "./ProductGallery";

vi.mock(
  "@/shared/lib/productMedia",
  () => ({
    getProductMedia: () => [
      {
        id: "media-1",
        src: "https://example.com/1.jpg",
        thumb: "https://example.com/1.jpg",
        alt: "Producto 1",
      },
      {
        id: "media-2",
        src: "https://example.com/2.jpg",
        thumb: "https://example.com/2.jpg",
        alt: "Producto 2",
      },
    ],
  }),
);

vi.mock(
  "@/modules/catalog/components/ProductBadgeStack",
  () => ({
    ProductBadgeStack: () => null,
  }),
);

vi.mock(
  "@/modules/catalog/components/ProductCaptureButton",
  () => ({
    ProductCaptureButton: ({
      product,
    }: {
      product: Product;
    }) => (
      <button
        type="button"
        aria-label="Capturar producto"
        data-capture-product-id={product.id}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        Capturar
      </button>
    ),
  }),
);

const product = {
  id: "DETAIL-001",
} as Product;

describe("ProductGallery capture integration", () => {
  it("muestra Capturar centrado al pie del hero", () => {
    const { container } = render(
      <ProductGallery
        product={product}
        available
        onZoom={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Capturar producto",
      }),
    ).toHaveAttribute(
      "data-capture-product-id",
      "DETAIL-001",
    );

    expect(
      container.querySelector(
        "[data-product-detail-capture]",
      ),
    ).toHaveClass(
      "absolute",
      "bottom-4",
      "left-1/2",
      "z-30",
      "-translate-x-1/2",
    );
  });

  it("el boton Capturar no abre el zoom", () => {
    const onZoom = vi.fn();

    render(
      <ProductGallery
        product={product}
        available
        onZoom={onZoom}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Capturar producto",
      }),
    );

    expect(onZoom).not.toHaveBeenCalled();
  });

  it("la imagen principal conserva la apertura del zoom", () => {
    const onZoom = vi.fn();

    const { container } = render(
      <ProductGallery
        product={product}
        available
        onZoom={onZoom}
      />,
    );

    const captureHost =
      container.querySelector(
        "[data-product-detail-capture]",
      );

    const hero =
      captureHost?.parentElement;

    expect(hero).toBeTruthy();

    fireEvent.click(hero as HTMLElement);

    expect(onZoom).toHaveBeenCalledTimes(1);
    expect(onZoom).toHaveBeenCalledWith(0);
  });
});
