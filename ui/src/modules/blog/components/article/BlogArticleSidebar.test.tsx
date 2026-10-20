import {
  render,
} from "@testing-library/react";

import {
  MemoryRouter,
} from "react-router-dom";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";

import type {
  BlogArticle,
} from "../../types/blog";

const mocks = vi.hoisted(
  () => ({
    products: [] as Product[],
    addToCart: vi.fn(),
  }),
);

vi.mock(
  "@/modules/catalog/hooks/useProducts",
  () => ({
    useProducts: () => ({
      data: mocks.products,
    }),
  }),
);

vi.mock(
  "@/modules/cart/store",
  () => ({
    useCart: () => ({
      addToCart:
        mocks.addToCart,
    }),
  }),
);

vi.mock(
  "../../hooks/useBlogArticles",
  () => ({
    useBlogArticles: () => [],
  }),
);

import BlogArticleSidebar from "./BlogArticleSidebar";

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "FLOR-001",
    title: "Rosa premium",
    description: "Producto de prueba.",
    category: "flores",
    price_1: 10,
    stock: 20,
    img: "https://example.com/product.jpg",
    status: "publicado",
    campaigns: [],
    ...overrides,
  };
}

const article: BlogArticle = {
  id: "BLOG-1",
  slug: "guia",
  category: "ventas",
  title: "Guía",
  excerpt: "Resumen",
  image: "guia.jpg",
  readTime: 5,
  published: "2026-07-26",
  relatedProducts: [
    "FLOR-001",
  ],
  template: "guide",
  content: [],
};

function renderSidebar(
  product: Product,
) {
  mocks.products = [product];

  return render(
    <MemoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <BlogArticleSidebar
        article={article}
      />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.products = [];
  mocks.addToCart.mockReset();
});

describe(
  "BlogArticleSidebar",
  () => {
    it.each([
      ["sin oferta", undefined, "S/ 10.00"],
      ["oferta válida", 8, "S/ 8.00"],
      ["oferta superior", 12, "S/ 10.00"],
    ])(
      "muestra precio canónico con %s",
      (
        _case,
        price_offer,
        expected,
      ) => {
        const { container } =
          renderSidebar(
            createProduct({
              price_offer,
            }),
          );

        expect(
          container.textContent,
        ).toContain(expected);
      },
    );

    it(
      "preserva estructura, enlace y CTA",
      () => {
        const { container } =
          renderSidebar(
            createProduct({
              price_offer: 8,
            }),
          );

        expect(
          container.querySelector(
            ".blog-side-product-card",
          ),
        ).toBeInTheDocument();
        expect(
          container.querySelector(
            'a[href="/catalogo/producto.html?id=FLOR-001&cat=flores"]',
          ),
        ).toBeInTheDocument();
        expect(
          container.textContent,
        ).toContain("Agregar");
      },
    );

    it.each([
      [
        "preventa",
        {
          status: "preventa",
          price_1: 0,
          stock: null,
        },
        "Consultar",
      ],
      [
        "agotado",
        {
          status: "agotado",
          stock: 0,
        },
        "Reposición",
      ],
    ])(
      "mantiene %s como consulta",
      (
        _label,
        overrides,
        expectedCta,
      ) => {
        const { container } =
          renderSidebar(
            createProduct(
              overrides,
            ),
          );

        expect(
          container.textContent,
        ).toContain(
          expectedCta,
        );
      },
    );

    it.each([
      ["oculto", { status: "oculto" }],
      [
        "borrador",
        { status: "borrador" },
      ],
      [
        "desconocido",
        { status: "pendiente" },
      ],
      [
        "stock cero",
        { stock: 0 },
      ],
      [
        "precio inválido",
        { price_1: 0 },
      ],
    ])(
      "excluye %s",
      (_label, overrides) => {
        const { container } =
          renderSidebar(
            createProduct(
              overrides,
            ),
          );

        expect(
          container.querySelector(
            ".blog-side-product-card",
          ),
        ).not.toBeInTheDocument();
      },
    );
  },
);
