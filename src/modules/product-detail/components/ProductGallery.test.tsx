import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { Product } from "@/shared/types/product";
import { ProductGallery } from "./ProductGallery";

const mediaState = vi.hoisted(
  () => ({
    items: [
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
  "@/shared/lib/productMedia",
  () => ({
    getProductMedia: () =>
      mediaState.items,
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
  beforeEach(() => {
    mediaState.items = [
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
    ];
  });

  it("usa todo el ancho del hero cuando existe una sola imagen", () => {
    mediaState.items = [
      {
        id: "media-1",
        src: "https://example.com/1.jpg",
        thumb: "https://example.com/1.jpg",
        alt: "Producto 1",
      },
    ];

    const { container } = render(
      <ProductGallery
        product={product}
        available
        onZoom={vi.fn()}
      />,
    );

    const gallery =
      container.querySelector(
        "[data-product-gallery-count='1']",
      );

    expect(
      gallery,
    ).toBeInTheDocument();

    expect(
      gallery,
    ).not.toHaveClass(
      "md:grid",
    );
  });

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
      "bottom-3",
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

  it("el swipe horizontal cambia de imagen sin abrir el zoom", () => {
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
      captureHost?.parentElement as HTMLElement;

    fireEvent.touchStart(
      hero,
      {
        touches: [
          {
            clientX: 240,
            clientY: 180,
          },
        ],
      },
    );

    fireEvent.touchEnd(
      hero,
      {
        changedTouches: [
          {
            clientX: 120,
            clientY: 185,
          },
        ],
      },
    );

    expect(
      screen.getByRole(
        "button",
        {
          name:
            "Ver imagen 2 de 2",
        },
      ),
    ).toHaveAttribute(
      "aria-current",
      "true",
    );

    fireEvent.click(
      hero,
    );

    expect(
      onZoom,
    ).not.toHaveBeenCalled();
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
