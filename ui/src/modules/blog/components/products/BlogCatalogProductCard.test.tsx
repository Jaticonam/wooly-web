import {
  render,
} from "@testing-library/react";

import {
  MemoryRouter,
} from "react-router-dom";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";

import BlogCatalogProductCard from "./BlogCatalogProductCard";

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "FLOR-001",
    title: "Rosa premium",
    description: "Producto de prueba.",
    category: "flores",
    price_1: 10,
    price_3: 9,
    price_12: 7,
    price_50: 6,
    price_100: 5,
    stock: 20,
    img: "https://example.com/product.jpg",
    status: "publicado",
    campaigns: [],
    ...overrides,
  };
}

function renderCard(
  overrides: Partial<Product> = {},
) {
  return render(
    <MemoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <BlogCatalogProductCard
        product={createProduct(
          overrides,
        )}
      />
    </MemoryRouter>,
  );
}

describe(
  "BlogCatalogProductCard",
  () => {
    it.each([
      ["sin oferta", undefined, "10.00"],
      ["oferta válida", 8, "8.00"],
      ["oferta igual", 10, "10.00"],
      ["oferta superior", 12, "10.00"],
      ["oferta negativa", -2, "10.00"],
      ["oferta NaN", Number.NaN, "10.00"],
      [
        "oferta Infinity",
        Number.POSITIVE_INFINITY,
        "10.00",
      ],
    ])(
      "muestra el precio canónico con %s",
      (
        _case,
        price_offer,
        expected,
      ) => {
        const { container } =
          renderCard({
            price_offer,
          });

        expect(
          container.textContent,
        ).toContain(
          `S/ ${expected}`,
        );
      },
    );

    it(
      "no publica un producto con precio base inválido",
      () => {
        const { container } =
          renderCard({
            price_1: 0,
            price_offer: 8,
          });

        expect(
          container.textContent,
        ).toBe("");
      },
    );

    it.each([
      [
        "preventa",
        {
          status: "preventa",
          price_1: 0,
          stock: null,
        },
        "Consultar preventa",
        "Consultar",
      ],
      [
        "agotado",
        {
          status: "agotado",
          stock: 0,
        },
        "Consultar reposición",
        "S/ 10.00",
      ],
    ])(
      "mantiene visible %s con su presentación comercial",
      (
        _label,
        overrides,
        expectedCta,
        expectedPrice,
      ) => {
        const { container } =
          renderCard(
            overrides,
          );

        expect(
          container.textContent,
        ).toContain(
          expectedCta,
        );
        expect(
          container.textContent,
        ).toContain(
          expectedPrice,
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
      "excluye producto %s",
      (_label, overrides) => {
        const { container } =
          renderCard(
            overrides,
          );

        expect(
          container.textContent,
        ).toBe("");
      },
    );

    it(
      "muestra tiers válidos en orden y conserva sus etiquetas",
      () => {
        const { container } =
          renderCard();

        const text =
          container.textContent ??
          "";

        expect(text).toContain(
          "Mayor (3u)",
        );
        expect(text).toContain(
          "Docena (12u)",
        );
        expect(text).toContain(
          "Medio ciento (50u)",
        );
        expect(text).toContain(
          "Caja (100u)",
        );
        expect(text).toContain(
          "S/9.00",
        );

        expect(
          text.indexOf("3u"),
        ).toBeLessThan(
          text.indexOf("12u"),
        );
        expect(
          text.indexOf("12u"),
        ).toBeLessThan(
          text.indexOf("50u"),
        );
        expect(
          text.indexOf("50u"),
        ).toBeLessThan(
          text.indexOf("100u"),
        );
        expect(text).not.toContain(
          "(1u)",
        );
      },
    );

    it(
      "omite tiers inválidos y conserva tiers parciales",
      () => {
        const { container } =
          renderCard({
            price_3: -5,
            price_12:
              Number.POSITIVE_INFINITY,
            price_50:
              Number.NaN,
            price_100: 5,
          });

        const text =
          container.textContent ??
          "";

        expect(text).not.toContain(
          "Mayor (3u)",
        );
        expect(text).not.toContain(
          "Docena (12u)",
        );
        expect(text).not.toContain(
          "Medio ciento (50u)",
        );
        expect(text).toContain(
          "Caja (100u)",
        );
        expect(text).not.toMatch(
          /NaN|Infinity|-5/,
        );
      },
    );

    it(
      "omite tiers cero",
      () => {
        const { container } =
          renderCard({
            price_3: 0,
            price_12: undefined,
            price_50: undefined,
            price_100: undefined,
          });

        expect(
          container.textContent,
        ).not.toContain(
          "Precios mayoristas",
        );
      },
    );
  },
);
