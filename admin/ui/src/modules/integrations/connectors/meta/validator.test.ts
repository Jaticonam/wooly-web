import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  MetaFeedItem,
} from "../../types/feed";
import {
  validateMetaFeedItem,
} from "./validator";

function item(overrides: Partial<MetaFeedItem> = {}): MetaFeedItem {
  return {
    id: "p1",
    title: "Producto",
    description: "Descripción",
    availability: "in stock",
    condition: "new",
    price: "10.00 PEN",
    link: "https://example.com/product",
    image_link: "https://example.com/image.jpg",
    brand: "Wooly Imports",
    google_product_category: "Category",
    ...overrides,
  };
}

function issueCodes(overrides: Partial<MetaFeedItem>) {
  return validateMetaFeedItem(item(overrides)).map((issue) => issue.code);
}

describe("validateMetaFeedItem", () => {
  it("acepta item válido", () => {
    expect(validateMetaFeedItem(item())).toEqual([]);
  });

  it.each([
    ["id", { id: "" }],
    ["title", { title: "" }],
    ["description", { description: "" }],
    ["brand", { brand: "" }],
  ])("rechaza %s vacío", (_case, overrides) => {
    expect(issueCodes(overrides)).toContain("MISSING_REQUIRED_FIELD");
  });

  it("rechaza availability y condition desconocidas", () => {
    expect(issueCodes({ availability: "available" })).toContain(
      "UNSUPPORTED_AVAILABILITY",
    );
    expect(issueCodes({ condition: "used" })).toContain(
      "MISSING_REQUIRED_FIELD",
    );
  });

  it.each([
    ["cero", "0.00 PEN"],
    ["negativo", "-1.00 PEN"],
    ["NaN", "NaN PEN"],
    ["Infinity", "Infinity PEN"],
  ])("rechaza precio %s", (_case, price) => {
    expect(issueCodes({ price })).toContain("INVALID_PRICE");
  });

  it("rechaza moneda distinta", () => {
    expect(issueCodes({ price: "10.00 USD" })).toContain("INVALID_CURRENCY");
  });

  it.each([
    ["link javascript", { link: "javascript:alert(1)" }, "INVALID_PRODUCT_URL"],
    ["link relativo", { link: "/product" }, "INVALID_PRODUCT_URL"],
    ["imagen data", { image_link: "data:image/png,x" }, "INVALID_IMAGE_URL"],
    ["imagen ftp", { image_link: "ftp://example.com/a" }, "INVALID_IMAGE_URL"],
  ])("rechaza %s", (_case, overrides, code) => {
    expect(issueCodes(overrides)).toContain(code);
  });
});
