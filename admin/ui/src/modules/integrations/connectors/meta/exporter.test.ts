import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  buildMetaExport,
  exportMetaCsv,
} from "./exporter";
import {
  validateMetaFeedItem,
} from "./validator";

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

describe("buildMetaExport", () => {
  it("exporta lista válida y todo item pasa el validator", () => {
    const result = buildMetaExport([
      product(),
      product({ id: "p2", status: "agotado", stock: 0 }),
    ]);
    expect(result.items).toHaveLength(2);
    expect(result.rejected).toEqual([]);
    expect(result.items.every((item) =>
      validateMetaFeedItem(item).length === 0)).toBe(true);
    expect(result.items.map((item) => item.availability)).toEqual([
      "in stock",
      "out of stock",
    ]);
  });

  it("separa válidos e inválidos sin fila parcial", () => {
    const result = buildMetaExport([
      product(),
      product({ id: "hidden", status: "oculto" }),
      product({ id: "bad-price", price_1: Number.NaN }),
      product({ id: "bad-url", img: "javascript:x" }),
    ]);
    expect(result.items).toHaveLength(1);
    expect(result.rejected.map((entry) => entry.productId)).toEqual([
      "hidden",
      "bad-price",
      "bad-url",
    ]);
    expect(result.csv).not.toContain("hidden");
    expect(result.csv).not.toContain("bad-price");
    expect(result.csv).not.toContain("bad-url");
  });

  it("todos inválidos producen solo una cabecera", () => {
    const result = buildMetaExport([
      product({ status: "preventa" }),
      product({ id: "hidden", status: "oculto" }),
    ]);
    expect(result.items).toEqual([]);
    expect(result.csv.split("\n")).toHaveLength(1);
    expect(result.csv).toMatch(/^id,title,description,/);
  });

  it("escapa comas, comillas y saltos de línea", () => {
    const result = buildMetaExport([
      product({
        title: 'Producto, "especial"',
        description: "Línea uno\nLínea dos",
      }),
    ]);
    expect(result.csv).toContain('"Producto, ""especial"""');
    expect(result.csv).toContain('"Línea uno\nLínea dos"');
    expect(result.csv.match(/^id,title,description,/gm)).toHaveLength(1);
  });

  it("nunca serializa undefined, null, NaN o Infinity", () => {
    const result = buildMetaExport([
      product({ price_offer: Number.NaN }),
      product({ id: "invalid", price_1: Number.POSITIVE_INFINITY }),
    ]);
    expect(result.csv).not.toMatch(/undefined|null|NaN|Infinity/);
  });

  it("la fachada conserva el CSV detallado", () => {
    const products = [product()];
    expect(exportMetaCsv(products)).toBe(buildMetaExport(products).csv);
  });

  it("frontera completa excluye preventa y usa precio canónico", () => {
    const result = buildMetaExport([
      product({ id: "offer", price_offer: 8 }),
      product({ id: "sold", status: "agotado", stock: 0 }),
      product({ id: "preorder", status: "preventa" }),
    ]);
    expect(result.items).toEqual([
      expect.objectContaining({ id: "offer", price: "8.00 PEN" }),
      expect.objectContaining({ id: "sold", availability: "out of stock" }),
    ]);
    expect(result.csv).not.toContain("preorder");
  });
});
