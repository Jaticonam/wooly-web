import {
  describe,
  expect,
  it,
} from "vitest";

import {
  mapDevelopmentCoreProduct,
} from "./DevelopmentJungCorePreviewCatalogProvider";

describe(
  "DevelopmentJungCorePreviewCatalogProvider",
  () => {
    it(
      "mapea un producto CORE real a la presentación temporal Wooly",
      () => {
        const product =
          mapDevelopmentCoreProduct({
            id: "core-preview-product-1",
            sku:
              "AKT-RG702",

            name:
              "Ramo de hortensias grandes",

            description:
              "Solo azul disponible",

            brand: {
              slug:
                "wooly",
            },

            category: {
              slug:
                "flores",
            },
          });

        expect(
          product,
        ).toEqual(
          expect.objectContaining({
            id: "core-preview-product-1",
            sku: "AKT-RG702",

            title:
              "Ramo de hortensias grandes",

            category:
              "flores",

            price_1:
              30,

            price_3:
              26.5,

            price_50:
              14.5,

            stock:
              150,

            img:
              "/placeholder.svg",

            status:
              "publicado",

            priority:
              0,
          }),
        );
      },
    );

    it(
      "usa el placeholder institucional mientras JUNG Media no entrega imagen",
      () => {
        const product =
          mapDevelopmentCoreProduct({
            id: "core-preview-product-1",
            sku:
              "CER001",

            name:
              "Peluche Cerdito con Vestido Overol mate",

            description:
              "cerdito",

            brand: {
              slug:
                "wooly",
            },

            category: {
              slug:
                "peluches",
            },
          });

        expect(
          product?.img,
        ).toBe(
          "/placeholder.svg",
        );

        expect(
          product?.price_12,
        ).toBe(
          16.5,
        );
      },
    );

    it(
      "no inventa commercial data para SKU todavía no certificado",
      () => {
        const product =
          mapDevelopmentCoreProduct({
            id: "core-preview-product-1",
            sku:
              "SKU-FUTURO",

            name:
              "Producto futuro",

            description:
              "Pendiente",

            brand: {
              slug:
                "wooly",
            },

            category: {
              slug:
                "flores",
            },
          });

        expect(
          product,
        ).toBeNull();
      },
    );

    it(
      "ignora productos de otra marca",
      () => {
        const product =
          mapDevelopmentCoreProduct({
            id: "core-preview-product-1",
            sku:
              "AKT-RG702",

            name:
              "Otro producto",

            brand: {
              slug:
                "gleemour",
            },

            category: {
              slug:
                "flores",
            },
          });

        expect(
          product,
        ).toBeNull();
      },
    );
  },
);
