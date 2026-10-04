import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import {
  resolveProductShareImage,
} from "./ProductShareAsset";

const product: Product = {
  id: "TEST-001",
  title: "Producto",
  description: "Descripción",
  category: "flores",
  price_1: 10,
  stock: 10,
  img: "https://catalog.example/current.jpg",
  status: "publicado",
};

describe(
  "resolveProductShareImage",
  () => {
    it(
      "prioriza un artefacto comercial listo para redes cuando JUNG CORE lo entregue",
      () => {
        expect(
          resolveProductShareImage({
            product,
            media: [
              {
                id: "media-1",
                type: "image",
                src: "https://catalog.example/resolved.jpg",
                alt: "Producto",
                order: 1,
              },
            ],
            commercialImageUrl:
              "https://core.example/share.jpg",
          }),
        ).toEqual({
          url:
            "https://core.example/share.jpg",
          source:
            "commercial-output",
        });
      },
    );

    it(
      "usa la media ya resuelta del producto mientras no exista artefacto comercial",
      () => {
        expect(
          resolveProductShareImage({
            product,
            media: [
              {
                id: "media-1",
                type: "image",
                src: "https://core.example/current-primary.jpg",
                alt: "Producto",
                order: 1,
              },
            ],
          }),
        ).toEqual({
          url:
            "https://core.example/current-primary.jpg",
          source:
            "resolved-media",
        });
      },
    );

    it(
      "conserva la imagen primaria como fallback y nunca comparte el placeholder",
      () => {
        expect(
          resolveProductShareImage({
            product,
            media: [],
          }),
        ).toEqual({
          url:
            "https://catalog.example/current.jpg",
          source:
            "product-primary",
        });

        expect(
          resolveProductShareImage({
            product: {
              ...product,
              img:
                "/placeholder.svg",
            },
            media: [
              {
                id:
                  "placeholder",
                type:
                  "image",
                src:
                  "/placeholder.svg",
                alt:
                  "Producto",
                order:
                  1,
              },
            ],
          }),
        ).toEqual({
          url:
            null,
          source:
            "none",
        });
      },
    );
  },
);
