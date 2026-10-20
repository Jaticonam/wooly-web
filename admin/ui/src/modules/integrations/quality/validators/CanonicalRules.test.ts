import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";
import {
  ImageRule,
} from "./ImageRule";
import {
  PriceRule,
} from "./PriceRule";

function product(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id: "P-1",
    title: "Producto",
    description: "Descripción",
    category: "flores",
    price_1: 10,
    img:
      "https://example.com/image.jpg",
    ...overrides,
  };
}

describe("PriceRule", () => {
  it("acepta precio base y oferta válida", () => {
    expect(
      PriceRule.validate(
        product(),
      ),
    ).toEqual([]);
    expect(
      PriceRule.validate(
        product({
          price_offer: 8,
        }),
      ),
    ).toEqual([]);
  });

  it("ignora oferta inválida y valida la base canónica", () => {
    expect(
      PriceRule.validate(
        product({
          price_offer: 12,
        }),
      ),
    ).toEqual([]);
  });

  it("rechaza una base inválida", () => {
    expect(
      PriceRule.validate(
        product({
          price_1: 0,
        }),
      ),
    ).toEqual([
      expect.objectContaining({
        code: "PRICE_INVALID",
      }),
    ]);
  });
});

describe("ImageRule", () => {
  it.each([
    "https://example.com/image.jpg",
    "http://example.com/image.webp?size=2",
    "https://dl.dropboxusercontent.com/file",
  ])(
    "acepta URL HTTP(S): %s",
    (img) => {
      expect(
        ImageRule.validate(
          product({
            img,
          }),
        ).filter(
          (issue) =>
            issue.level ===
            "error",
        ),
      ).toEqual([]);
    },
  );

  it.each([
    "javascript:alert(1)",
    "data:image/png;base64,abc",
    "ftp://example.com/image.jpg",
    "/relative/image.jpg",
    "not a url",
  ])(
    "rechaza URL no pública: %s",
    (img) => {
      expect(
        ImageRule.validate(
          product({
            img,
          }),
        ),
      ).toEqual([
        expect.objectContaining({
          code:
            "IMAGE_NOT_PUBLIC_URL",
        }),
      ]);
    },
  );
});
