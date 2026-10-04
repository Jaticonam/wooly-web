import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

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
  downloadProductCardCapture,
} from "@/modules/catalog/utils/ProductCardCapture";

import {
  ProductCard,
} from "./ProductCard";

vi.mock(
  "@/modules/catalog/utils/ProductCardCapture",
  () => ({
    downloadProductCardCapture: vi.fn(),
  }),
);

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "FLOR-001",
    title: "Rosa premium",
    description: "Producto de prueba.",
    category: "flores",
    price_1: 10,
    price_offer: 8,
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

describe(
  "ProductCard pricing",
  () => {
    it(
      "integra la oferta exclusiva y oculta los tiers mayoristas",
      () => {
        const { container } =
          render(
            <MemoryRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ProductCard
                product={createProduct()}
                onAddToCart={vi.fn()}
              />
            </MemoryRouter>,
          );

        const text =
          container.textContent ??
          "";

        expect(text).toContain(
          "8.0",
        );
        expect(text).toContain(
          "S/10.0",
        );
        expect(text).not.toContain(
          "Por Mayor (3u)",
        );
        expect(text).not.toContain(
          "Por Docena (12u)",
        );
        expect(text).not.toContain(
          "Medio ciento (50u)",
        );
        expect(text).not.toContain(
          "Por Caja (100u)",
        );
      },
    );

    it(
      "rechaza una oferta mayor y omite tiers inválidos",
      () => {
        const { container } =
          render(
            <MemoryRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ProductCard
                product={createProduct({
                  price_offer: 12,
                  price_3: -5,
                  price_12:
                    Number.POSITIVE_INFINITY,
                  price_50:
                    Number.NaN,
                  price_100: 0,
                })}
                onAddToCart={vi.fn()}
              />
            </MemoryRouter>,
          );

        const text =
          container.textContent ??
          "";

        expect(text).toContain(
          "10.0",
        );
        expect(
          container.querySelector(
            ".line-through",
          ),
        ).toBeNull();
        expect(text).not.toContain(
          "Precios mayorista",
        );
      },
    );
  },
);
describe(
  "ProductCard accessibility",
  () => {
    it(
      "permite abrir el detalle con teclado desde la tarjeta",
      () => {
        render(
          <MemoryRouter
            initialEntries={[
              "/",
            ]}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <ProductCard
                    product={createProduct()}
                    onAddToCart={vi.fn()}
                  />
                }
              />

              <Route
                path="/catalogo/producto.html"
                element={
                  <div>
                    Detalle destino
                  </div>
                }
              />
            </Routes>
          </MemoryRouter>,
        );

        fireEvent.keyDown(
          screen.getByRole(
            "link",
            {
              name:
                "Ver detalle de Rosa premium",
            },
          ),
          {
            key:
              "Enter",
          },
        );

        expect(
          screen.getByText(
            "Detalle destino",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);

describe(
  "ProductCard image loading",
  () => {
    it(
      "prioriza explícitamente imágenes del primer viewport",
      () => {
        const {
          getByAltText,
        } = render(
          <MemoryRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ProductCard
              product={createProduct()}
              onAddToCart={vi.fn()}
              imagePriority
            />
          </MemoryRouter>,
        );

        expect(
          getByAltText(
            "Rosa premium",
          ),
        ).toHaveAttribute(
          "loading",
          "eager",
        );

        expect(
          getByAltText(
            "Rosa premium",
          ),
        ).toHaveAttribute(
          "decoding",
          "async",
        );
      },
    );

    it(
      "mantiene lazy loading por defecto",
      () => {
        const {
          getByAltText,
        } = render(
          <MemoryRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ProductCard
              product={createProduct()}
              onAddToCart={vi.fn()}
            />
          </MemoryRouter>,
        );

        expect(
          getByAltText(
            "Rosa premium",
          ),
        ).toHaveAttribute(
          "loading",
          "lazy",
        );
      },
    );
  },
);

describe(
  "ProductCard capture",
  () => {
    it(
      "muestra Capturar producto y descarga usando el codigo",
      async () => {
        vi.mocked(
          downloadProductCardCapture,
        ).mockResolvedValue();

        const { getByRole } =
          render(
            <MemoryRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ProductCard
                product={createProduct()}
                onAddToCart={vi.fn()}
              />
            </MemoryRouter>,
          );

        const captureButton =
          getByRole(
            "button",
            {
              name: "Capturar producto",
            },
          );

        expect(
          captureButton.className,
        ).toContain(
          "bottom-2.5",
        );

        expect(
          captureButton.className,
        ).toContain(
          "left-1/2",
        );

        fireEvent.click(
          captureButton,
        );

        await waitFor(
          () => {
            expect(
              downloadProductCardCapture,
            ).toHaveBeenCalledTimes(
              1,
            );
          },
        );

        expect(
          downloadProductCardCapture,
        ).toHaveBeenCalledWith(
          expect.any(
            HTMLElement,
          ),
          "FLOR-001",
        );

        const captureNode =
          vi.mocked(
            downloadProductCardCapture,
          ).mock.calls[0][0];

        expect(
          captureNode.dataset
            .productCaptureNode,
        ).toBe("true");

        expect(
          captureNode.style.left,
        ).toBe("");

        expect(
          captureNode.parentElement
            ?.dataset
            .productCaptureHost,
        ).toBe("true");

        expect(
          captureNode.parentElement
            ?.style.left,
        ).toBe(
          "-10000px",
        );
      },
    );
  },
);
