import {
  render,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ReactNode,
} from "react";

import {
  getBaseUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

import type {
  Product,
} from "@/shared/types/product";

import type {
  ProductSeoData,
} from "./productSeo";

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

import {
  ProductSeo,
} from "./ProductSeoComponent";

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
    stock: 20,
    img: "https://example.com/product.jpg",
    status: "publicado",
    ...overrides,
  };
}

const seo: ProductSeoData = {
  title: "Rosa premium",
  description: "Producto de prueba.",
  canonical:
    "https://www.woolyimports.com/catalogo/producto.html?id=core-product-1",
  image:
    "https://example.com/product.jpg",
};

function renderSchema(
  product: Product,
) {
  const { container } =
    render(
      <ProductSeo
        seo={seo}
        product={product}
      />,
    );

  const script =
    container.querySelector(
      'script[type="application/ld+json"]',
    );

  return script
    ? JSON.parse(
        script.textContent ??
          "{}",
      )
    : null;
}

describe(
  "ProductSeo JSON-LD",
  () => {
    it.each([
      ["sin oferta", undefined, 10],
      ["oferta válida", 8, 8],
      ["oferta igual", 10, 10],
      ["oferta superior", 12, 10],
      ["oferta negativa", -2, 10],
      ["oferta NaN", Number.NaN, 10],
      [
        "oferta Infinity",
        Number.POSITIVE_INFINITY,
        10,
      ],
    ])(
      "publica precio canónico con %s",
      (
        _case,
        price_offer,
        expected,
      ) => {
        const product =
          createProduct({
            price_offer,
          });

        const schema =
          renderSchema(
            product,
          );

        expect(
          schema.offers.price,
        ).toBe(expected);
        expect(
          schema.offers.price,
        ).toBe(
          getBaseUnitPrice(
            product,
          ),
        );
        expect(
          schema.offers.priceCurrency,
        ).toBe("PEN");
        expect(
          schema.offers.availability,
        ).toBe(
          "https://schema.org/InStock",
        );
        expect(
          JSON.stringify(schema),
        ).not.toMatch(
          /NaN|Infinity/,
        );
      },
    );

    it(
      "no emite JSON-LD para producto con precio base inválido",
      () => {
        expect(
          renderSchema(
            createProduct({
              price_1: 0,
              price_offer: 8,
            }),
          ),
        ).toBeNull();
      },
    );

    it(
      "publica preventa sin Offer",
      () => {
        const schema =
          renderSchema(
            createProduct({
              status: "preventa",
              price_1: 0,
              stock: null,
            }),
          );

        expect(
          schema["@type"],
        ).toBe("Product");
        expect(
          schema.offers,
        ).toBeUndefined();
      },
    );

    it(
      "publica agotado con Offer OutOfStock",
      () => {
        const schema =
          renderSchema(
            createProduct({
              status: "agotado",
              stock: 100,
            }),
          );

        expect(
          schema.offers.price,
        ).toBe(10);
        expect(
          schema.offers.availability,
        ).toBe(
          "https://schema.org/OutOfStock",
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
    ])(
      "no emite JSON-LD para %s",
      (_label, overrides) => {
        expect(
          renderSchema(
            createProduct(
              overrides,
            ),
          ),
        ).toBeNull();
      },
    );

    it(
      "preserva identidad, URL e imagen Schema.org",
      () => {
        const schema =
          renderSchema(
            createProduct({
              price_offer: 8,
            }),
          );

        expect(schema).toMatchObject({
          "@type": "Product",
          name: "Rosa premium",
          description:
            "Producto de prueba.",
          sku: "FLOR-001",
          image: [
            "https://example.com/product.jpg",
          ],
          offers: {
            "@type": "Offer",
            url: seo.canonical,
            price: 8,
          },
        });
      },
    );
  },
);
