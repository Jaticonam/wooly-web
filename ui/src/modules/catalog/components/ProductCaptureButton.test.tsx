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

import type { Product } from "@wooly/contracts/types/product";
import { downloadProductCardCapture } from "@/modules/catalog/utils/ProductCardCapture";
import { ProductCaptureButton } from "./ProductCaptureButton";

vi.mock(
  "@/modules/catalog/utils/ProductCardCapture",
  () => ({
    downloadProductCardCapture: vi.fn(),
  }),
);

vi.mock(
  "@/modules/catalog/components/ProductCaptureCard",
  () => ({
    ProductCaptureCard: () => (
      <div data-testid="product-capture-card" />
    ),
  }),
);

const product: Product = {
  id: "TEST-001",
  title: "Producto de prueba",
  description: "Producto para captura",
  category: "Flores",
  price_1: 10,
  price_3: 27,
  price_12: 100,
  stock: 20,
  img: "https://example.com/product.jpg",
  status: "publicado",
};

describe("ProductCaptureButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(
      downloadProductCardCapture,
    ).mockResolvedValue();
  });

  it("muestra Capturar y conserva el host de captura fuera de pantalla", () => {
    const { container } = render(
      <ProductCaptureButton product={product} />,
    );

    expect(
      screen.getByRole("button", {
        name: "Capturar producto",
      }),
    ).toHaveTextContent("Capturar");

    expect(
      container.querySelector(
        "[data-product-capture-host]",
      ),
    ).toHaveStyle({
      position: "fixed",
      left: "-10000px",
      width: "360px",
      height: "640px",
    });

    expect(
      container.querySelector(
        "[data-product-capture-node]",
      ),
    ).toBeTruthy();

    expect(
      screen.getByTestId(
        "product-capture-card",
      ),
    ).toBeTruthy();
  });

  it("descarga usando el mismo motor y el codigo del producto", async () => {
    const { container } = render(
      <ProductCaptureButton product={product} />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Capturar producto",
      }),
    );

    const captureNode =
      container.querySelector(
        "[data-product-capture-node]",
      );

    await waitFor(() => {
      expect(
        downloadProductCardCapture,
      ).toHaveBeenCalledWith(
        captureNode,
        "TEST-001",
      );
    });
  });
});
