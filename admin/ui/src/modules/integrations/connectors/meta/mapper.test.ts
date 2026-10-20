import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  mapProductToMetaDetailed,
} from "./mapper";

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

function mapped(overrides: Partial<Product> = {}) {
  return mapProductToMetaDetailed(product(overrides));
}

describe("mapProductToMetaDetailed", () => {
  it("exporta publicado disponible con precio y disponibilidad canónicos", () => {
    expect(mapped()).toMatchObject({
      ok: true,
      item: {
        price: "10.00 PEN",
        availability: "in stock",
      },
    });
  });

  it("exporta agotado como out of stock", () => {
    expect(mapped({ status: "agotado", stock: 0 })).toMatchObject({
      ok: true,
      item: { availability: "out of stock" },
    });
  });

  it.each([
    ["preventa", "preventa"],
    ["oculto", "oculto"],
    ["borrador", "borrador"],
    ["desconocido", "futuro"],
  ])("excluye estado %s", (_case, status) => {
    expect(mapped({ status })).toMatchObject({ ok: false });
  });

  it("excluye publicado con stock incompatible", () => {
    expect(mapped({ status: "publicado", stock: 0 })).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "PRODUCT_NOT_EXPORTABLE" }),
      ]),
    });
  });

  it.each([
    ["base cero", 0],
    ["base negativa", -1],
    ["base NaN", Number.NaN],
    ["base Infinity", Number.POSITIVE_INFINITY],
  ])("excluye %s", (_case, price_1) => {
    expect(mapped({ price_1 })).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_PRICE" }),
      ]),
    });
  });

  it.each([
    ["oferta válida", 8, "8.00 PEN"],
    ["oferta igual", 10, "10.00 PEN"],
    ["oferta superior", 12, "10.00 PEN"],
    ["oferta negativa", -1, "10.00 PEN"],
    ["oferta NaN", Number.NaN, "10.00 PEN"],
    ["oferta Infinity", Number.POSITIVE_INFINITY, "10.00 PEN"],
  ])("resuelve %s con getBaseUnitPrice", (_case, price_offer, expected) => {
    expect(mapped({ price_offer })).toMatchObject({
      ok: true,
      item: { price: expected },
    });
  });

  it.each([
    ["javascript", "javascript:alert(1)"],
    ["data", "data:image/png;base64,abc"],
    ["malformada", "http no-es-url"],
    ["relativa", "/image.jpg"],
  ])("rechaza imagen %s", (_case, img) => {
    expect(mapped({ img })).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_IMAGE_URL" }),
      ]),
    });
  });

  it("acepta URLs HTTP y HTTPS absolutas", () => {
    expect(mapped({ img: "http://example.com/image.jpg" })).toMatchObject({
      ok: true,
    });
    expect(mapped({ img: "https://example.com/image.jpg" })).toMatchObject({
      ok: true,
    });
  });

  it("rechaza una URL de producto no HTTP(S)", () => {
    expect(mapProductToMetaDetailed(product(), {
      siteUrl: "javascript:",
    })).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_PRODUCT_URL" }),
      ]),
    });
  });

  it("no muta Product", () => {
    const input = product({ price_offer: 8 });
    const before = structuredClone(input);
    mapProductToMetaDetailed(input);
    expect(input).toEqual(before);
  });
});
