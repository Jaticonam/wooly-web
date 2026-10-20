import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";
import type {
  ProductSeoData,
} from "./productSeo";
import {
  buildProductSeoSchema,
} from "./ProductSeoSchema";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    title: "Producto",
    description: "Descripción",
    category: "flores",
    price_1: 10,
    price_offer: null,
    stock: 5,
    img: "https://example.com/image.jpg",
    status: "publicado",
    ...overrides,
  };
}

function seo(overrides: Partial<ProductSeoData> = {}): ProductSeoData {
  return {
    title: "Producto | Wooly",
    description: "Descripción",
    canonical: "https://www.woolyimports.com/catalogo/producto.html?id=p1",
    image: "https://example.com/image.jpg",
    ...overrides,
  };
}

describe("buildProductSeoSchema", () => {
  it("genera disponible con Offer InStock y JSON parseable", () => {
    const result = buildProductSeoSchema(product(), seo());
    expect(result).toMatchObject({
      ok: true,
      schema: {
        "@type": "Product",
        offers: {
          price: 10,
          priceCurrency: "PEN",
          availability: "https://schema.org/InStock",
        },
      },
    });
    if (result.ok) expect(JSON.parse(result.json)).toEqual(result.schema);
  });

  it("genera agotado con Offer OutOfStock", () => {
    expect(buildProductSeoSchema(
      product({ status: "agotado", stock: 0 }),
      seo(),
    )).toMatchObject({
      ok: true,
      schema: {
        offers: { availability: "https://schema.org/OutOfStock" },
      },
    });
  });

  it("genera preventa sin Offer", () => {
    const result = buildProductSeoSchema(
      product({ status: "preventa", stock: null }),
      seo(),
    );
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.schema).not.toHaveProperty("offers");
  });

  it("no genera schema para producto oculto", () => {
    expect(buildProductSeoSchema(
      product({ status: "oculto" }),
      seo(),
    )).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "PRODUCT_NOT_PUBLIC" }),
      ]),
    });
  });

  it.each([
    ["cero", 0],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
  ])("rechaza precio %s", (_case, price_1) => {
    expect(buildProductSeoSchema(product({ price_1 }), seo())).toMatchObject({
      ok: false,
    });
  });

  it.each([
    ["canonical javascript", seo({ canonical: "javascript:alert(1)" }), product()],
    ["product URL relativa", seo({ canonical: "/producto/p1" }), product()],
    ["imagen javascript", seo(), product({ img: "javascript:alert(1)" })],
    ["imagen data", seo(), product({ img: "data:image/png,x" })],
    ["imagen relativa", seo(), product({ img: "/image.jpg" })],
  ])("rechaza %s", (_case, seoData, productData) => {
    expect(buildProductSeoSchema(productData, seoData)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_URL" }),
      ]),
    });
  });

  it("acepta imagen HTTP", () => {
    expect(buildProductSeoSchema(
      product({ img: "http://example.com/image.jpg" }),
      seo(),
    )).toMatchObject({ ok: true });
  });

  it("no serializa undefined, NaN ni Infinity", () => {
    const result = buildProductSeoSchema(product(), seo());
    if (!result.ok) throw new Error("Resultado inesperado");
    expect(result.json).not.toMatch(/undefined|NaN|Infinity/);
  });
});
