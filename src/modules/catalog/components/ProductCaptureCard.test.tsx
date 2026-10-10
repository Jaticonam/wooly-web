import { render } from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { Product } from "@/shared/types/product";

import { ProductCaptureCard } from "./ProductCaptureCard";

vi.mock("./ProductCardBadges", () => ({
  ProductCardBadges: () => (
    <div data-testid="capture-badges">
      Badge
    </div>
  ),
}));

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "core-product-1",
    code: "FLOR-001",
    title: "Rosa premium",
    description: "Producto de prueba.",
    category: "flores",
    price_1: 10,
    price_offer: null,
    price_3: 9,
    price_12: 7,
    price_50: 6,
    price_100: 5,
    stock: 20,
    img: "https://example.com/product.jpg",
    status: "publicado",
    campaigns: [],
    ...overrides,
  };
}

describe("ProductCaptureCard", () => {
  it("renderiza una ficha mobile-first de 360 por 640", () => {
    const { container } = render(
      <ProductCaptureCard
        product={createProduct()}
        available
        isPreventa={false}
      />,
    );

    const card =
      container.querySelector(
        "[data-product-capture-card]",
      );

    expect(card).not.toBeNull();
    expect(card?.className).toContain(
      "h-[640px]",
    );
    expect(card?.className).toContain(
      "w-[360px]",
    );

    const text =
      container.textContent ?? "";

    expect(text).toContain("FLOR-001");
    expect(text).toContain("flores");
    expect(text).toContain("Rosa premium");
    expect(text).toContain("Precio unitario");
    expect(text).toContain("10.0");
    expect(text).toContain("Stock limitado");
    expect(text).toContain("Precios mayoristas");

    expect(text).not.toContain("Agregar");
    expect(text).not.toContain(
      "Capturar producto",
    );
  });

  it("conserva la fotografia en 3:4 casi a ancho completo", () => {
    const { container } = render(
      <ProductCaptureCard
        product={createProduct()}
        available
        isPreventa={false}
      />,
    );

    const frame =
      container.querySelector(
        "[data-product-capture-image-frame]",
      );

    expect(frame).not.toBeNull();
    expect(frame?.className).toContain(
      "aspect-[3/4]",
    );
    expect(frame?.className).toContain(
      "w-[324px]",
    );

    const image =
      container.querySelector("img");

    expect(image?.className).toContain(
      "object-cover",
    );
  });

  it("mantiene visibles y etiquetados los precios mayoristas disponibles", () => {
    const { container } = render(
      <ProductCaptureCard
        product={createProduct()}
        available
        isPreventa={false}
      />,
    );

    const tiers =
      container.querySelectorAll(
        "[data-product-capture-volume-price]",
      );

    expect(tiers).toHaveLength(4);

    const labels =
      container.querySelectorAll(
        "[data-product-capture-volume-label]",
      );

    expect(labels).toHaveLength(4);

    const text =
      container.textContent ?? "";

    expect(text).toContain("Por mayor");
    expect(text).toContain("Docena");
    expect(text).toContain("Medio ciento");
    expect(text).toContain("Caja");

    expect(text).toContain("3u");
    expect(text).toContain("12u");
    expect(text).toContain("50u");
    expect(text).toContain("100u");
  });
});