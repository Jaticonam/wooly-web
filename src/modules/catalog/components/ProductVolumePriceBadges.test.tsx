import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import {
  ProductVolumePriceBadges,
} from "./ProductVolumePriceBadges";

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
    ...overrides,
  };
}

function renderBadges(
  overrides: Partial<Product> = {},
) {
  return render(
    <ProductVolumePriceBadges
      product={createProduct(
        overrides,
      )}
      available
      isPreventa={false}
    />,
  );
}

describe(
  "ProductVolumePriceBadges",
  () => {
    it(
      "muestra todos los tiers en orden canónico y conserva el límite visual vigente",
      () => {
        const { container } =
          renderBadges();

        const text =
          container.textContent ??
          "";

        expect(text).toContain(
          "Por Mayor (3u) × S/27",
        );
        expect(text).toContain(
          "Por Docena (12u) × S/84",
        );
        expect(text).toContain(
          "Medio ciento (50u) × S/300",
        );
        expect(text).toContain(
          "Por Caja (100u) × S/500",
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

        expect(
          container.querySelectorAll(
            ".wholesale-chip",
          ),
        ).toHaveLength(4);
      },
    );

    it(
      "mantiene oculta la fila del tier base",
      () => {
        const { container } =
          renderBadges();

        expect(
          container.textContent,
        ).not.toContain("(1u)");
      },
    );

    it(
      "resume los tiers cuando la tarjeta define un máximo visible",
      () => {
        const { container } = render(
          <ProductVolumePriceBadges
            product={createProduct()}
            available
            isPreventa={false}
            maxTiers={2}
          />,
        );

        expect(
          container.querySelectorAll(
            ".wholesale-chip",
          ),
        ).toHaveLength(2);

        expect(
          screen.getByText(
            "+2 escalas",
          ),
        ).toBeInTheDocument();

        expect(
          container.textContent,
        ).not.toContain(
          "Medio ciento",
        );
      },
    );

    it(
      "muestra únicamente tiers parciales válidos",
      () => {
        const { container } =
          renderBadges({
            price_3: undefined,
            price_50: null,
            price_100: undefined,
          });

        expect(
          container.textContent,
        ).toContain(
          "Por Docena (12u) × S/84",
        );

        expect(
          container.querySelectorAll(
            ".wholesale-chip",
          ),
        ).toHaveLength(1);
      },
    );

    it.each([
      ["cero", 0],
      ["negativo", -5],
      ["NaN", Number.NaN],
      [
        "Infinity",
        Number.POSITIVE_INFINITY,
      ],
    ])(
      "omite un tier %s",
      (_case, price_3) => {
        const { container } =
          renderBadges({
            price_3,
            price_12: undefined,
            price_50: undefined,
            price_100: undefined,
          });

        expect(
          screen.queryByText(
            "Precios mayorista",
          ),
        ).not.toBeInTheDocument();

        expect(
          container.textContent,
        ).not.toContain("3u");
      },
    );

    it(
      "no muestra tiers que no representan descuento frente al precio base",
      () => {
        const { container } =
          renderBadges({
            price_3: 10,
            price_12: 12,
            price_50: undefined,
            price_100: undefined,
          });

        expect(
          container.textContent,
        ).toBe("");
      },
    );
  },
);
