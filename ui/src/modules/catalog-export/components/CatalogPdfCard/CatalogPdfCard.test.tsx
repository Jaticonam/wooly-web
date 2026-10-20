import {
  render,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  mapProductToPdfProduct,
} from "@wooly/shared/catalog-export/mappers/PdfProductMapper";

import CatalogPdfCard from "./CatalogPdfCard";

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "FLOR-001",
    title: "Rosa premium",
    description: "Producto de prueba.",
    category: "flores",
    price_1: 10,
    price_offer: 8,
    price_3: 9,
    price_12: 7,
    price_50: 6,
    price_100: 5,
    stock: 20,
    img: "https://example.com/product.jpg",
    status: "publicado",
    ...overrides,
  };
}

describe(
  "CatalogPdfCard",
  () => {
    it(
      "renderiza la oferta exclusiva y oculta los tiers mayoristas",
      () => {
        const { container } =
          render(
            <CatalogPdfCard
              product={
                mapProductToPdfProduct(
                  createProduct(),
                )
              }
            />,
          );

        const text =
          container.textContent ??
          "";

        expect(text).toContain(
          "Precio unidad:",
        );
        expect(text).toContain(
          "S/ 10.00",
        );
        expect(text).toContain(
          "Precio oferta:",
        );
        expect(text).toContain(
          "S/ 8.00",
        );
        expect(text).toContain(
          "Mayorista: consultar con asesora.",
        );
        expect(text).not.toContain(
          "Por Mayor (3u) a",
        );
        expect(text).not.toContain(
          "Por 100 (100u) a",
        );
        expect(
          container.querySelector(
            ".catalog-pdf-card__tiers",
          ),
        ).toBeNull();
      },
    );

    it(
      "no presenta oferta inválida ni valores monetarios inseguros",
      () => {
        const { container } =
          render(
            <CatalogPdfCard
              product={
                mapProductToPdfProduct(
                  createProduct({
                    price_offer: 12,
                    price_3: -5,
                    price_12:
                      Number.POSITIVE_INFINITY,
                    price_50:
                      Number.NaN,
                    price_100: 0,
                  }),
                )
              }
            />,
          );

        const text =
          container.textContent ??
          "";

        expect(text).toContain(
          "S/ 10.00",
        );
        expect(text).not.toContain(
          "Precio oferta:",
        );
        expect(text).not.toMatch(
          /NaN|Infinity|-5/,
        );
      },
    );

    it(
      "conserva la estructura comercial de la card",
      () => {
        const { container } =
          render(
            <CatalogPdfCard
              product={
                mapProductToPdfProduct(
                  createProduct({ price_offer: null }),
                )
              }
            />,
          );

        expect(
          container.querySelector(
            ".catalog-pdf-card__media",
          ),
        ).toBeInTheDocument();
        expect(
          container.querySelector(
            ".catalog-pdf-card__content",
          ),
        ).toBeInTheDocument();
        expect(
          container.querySelector(
            ".catalog-pdf-card__tiers",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);
