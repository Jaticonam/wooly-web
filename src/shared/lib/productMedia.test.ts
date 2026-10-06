import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import {
  applyProductImageFallback,
  getProductMedia,
  PRODUCT_IMAGE_PLACEHOLDER,
  resolveProductImageSrc,
} from "./productMedia";

function createProduct(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id:
      "TEST-001",

    title:
      "Producto Wooly",

    description:
      "Producto de prueba",

    category:
      "flores",

    price_1:
      10,

    stock:
      10,

    img:
      "",

    status:
      "publicado",

    ...overrides,
  };
}

describe(
  "productMedia placeholder",
  () => {
    it(
      "usa el placeholder oficial cuando no existe imagen",
      () => {
        expect(
          resolveProductImageSrc(
            "",
          ),
        ).toBe(
          PRODUCT_IMAGE_PLACEHOLDER,
        );

        expect(
          resolveProductImageSrc(
            "   ",
          ),
        ).toBe(
          PRODUCT_IMAGE_PLACEHOLDER,
        );
      },
    );

    it(
      "conserva la imagen real cuando existe",
      () => {
        expect(
          resolveProductImageSrc(
            "https://cdn.example.com/product.jpg",
          ),
        ).toBe(
          "https://cdn.example.com/product.jpg",
        );
      },
    );

    it(
      "crea media placeholder cuando el producto no tiene media",
      () => {
        const media =
          getProductMedia(
            createProduct(),
          );

        expect(
          media,
        ).toHaveLength(
          1,
        );

        expect(
          media[0],
        ).toEqual({
          id:
            "TEST-001-placeholder",

          type:
            "image",

          src:
            "/placeholder.svg",

          thumb:
            "/placeholder.svg",

          alt:
            "Imagen en proceso de Producto Wooly",

          order:
            1,
        });
      },
    );

    it(
      "reemplaza una URL rota sin crear loop de onError",
      () => {
        const image =
          document.createElement(
            "img",
          );

        image.src =
          "https://cdn.example.com/broken.jpg";

        applyProductImageFallback(
          image,
        );

        expect(
          image.getAttribute(
            "src",
          ),
        ).toBe(
          "/placeholder.svg",
        );

        expect(
          image.dataset
            .productFallbackApplied,
        ).toBe(
          "true",
        );

        applyProductImageFallback(
          image,
        );

        expect(
          image.getAttribute(
            "src",
          ),
        ).toBe(
          "/placeholder.svg",
        );
      },
    );
  },
);
