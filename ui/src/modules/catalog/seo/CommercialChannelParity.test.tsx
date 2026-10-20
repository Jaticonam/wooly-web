import {
  render,
} from "@testing-library/react";

import {
  MemoryRouter,
} from "react-router-dom";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ReactNode,
} from "react";

import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  mapProductsToPdfProducts,
} from "@wooly/shared/catalog-export/mappers/PdfProductMapper";

import BlogCatalogProductCard from "@/modules/blog/components/products/BlogCatalogProductCard";

import {
  ProductSeo,
} from "@wooly/shared/catalog/seo/ProductSeoComponent";

vi.mock(
  "react-helmet-async",
  () => ({
    Helmet: ({
      children,
    }: {
      children:
        ReactNode;
    }) => children,
  }),
);

function createProduct(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id: "PARITY-001",
    title:
      "Producto multicanal",
    description:
      "Producto para paridad.",
    category: "flores",
    price_1: 10,
    price_3: 9,
    stock: 20,
    img:
      "https://example.com/product.jpg",
    status: "publicado",
    ...overrides,
  };
}

function getChannelVisibility(
  product:
    Product,
) {
  const pdfVisible =
    mapProductsToPdfProducts([
      product,
    ]).length === 1;

  const blog =
    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <BlogCatalogProductCard
          product={product}
        />
      </MemoryRouter>,
    );

  const blogVisible =
    Boolean(
      blog.container.textContent,
    );

  blog.unmount();

  const seo = render(
    <ProductSeo
      seo={{
        title:
          product.title,
        description:
          product.description,
        canonical:
          "https://www.woolyimports.com/catalogo/producto.html?id=PARITY-001",
        image:
          product.img,
      }}
      product={product}
    />,
  );

  const seoVisible =
    Boolean(
      seo.container.querySelector(
        'script[type="application/ld+json"]',
      ),
    );

  seo.unmount();

  return {
    pdfVisible,
    blogVisible,
    seoVisible,
  };
}

describe(
  "paridad comercial PDF, Blog y SEO",
  () => {
    it.each([
      [
        "disponible",
        {},
        true,
      ],
      [
        "preventa",
        {
          status: "preventa",
          price_1: 0,
          stock: null,
        },
        true,
      ],
      [
        "agotado",
        {
          status: "agotado",
          stock: 0,
        },
        true,
      ],
      [
        "oculto",
        {
          status: "oculto",
        },
        false,
      ],
      [
        "inválido",
        {
          stock: 0,
        },
        false,
      ],
    ])(
      "mantiene decisión coherente para %s",
      (
        _label,
        overrides,
        expected,
      ) => {
        expect(
          getChannelVisibility(
            createProduct(
              overrides,
            ),
          ),
        ).toEqual({
          pdfVisible:
            expected,
          blogVisible:
            expected,
          seoVisible:
            expected,
        });
      },
    );
  },
);
