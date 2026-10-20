import {
  describe,
  expect,
  it,
} from "vitest";

import {
  mapProductsToPdfProducts,
} from "../../../catalog-export/mappers/PdfProductMapper";

import {
  buildPdfCategorySections,
} from "../../../catalog-export/services/BuildPdfCategorySections";

import type {
  Product,
} from "@wooly/contracts/types/product";

const product = ({
  id,
  category,
}: {
  id: string;
  category: string;
}): Product => ({
  id,
  title: id,
  description: `Producto ${id}`,
  category,
  price_1: 10,
  stock: 10,
  img: `/${id}.jpg`,
  status: "publicado",
});

describe(
  "Catalog composition preview pipeline",
  () => {
    it(
      "usa el orden oficial de categorias del PDF",
      () => {
        const products: Product[] = [
          product({
            id: "PELU-001",
            category: "peluches",
          }),

          product({
            id: "FLOR-001",
            category: "flores",
          }),

          product({
            id: "CAJA-001",
            category: "cajas",
          }),
        ];

        const sections =
          buildPdfCategorySections(
            mapProductsToPdfProducts(
              products,
            ),
          );

        expect(
          sections.map(
            (section) =>
              section.id,
          ),
        ).toEqual([
          "flores",
          "peluches",
          "cajas",
        ]);
      },
    );

    it(
      "conserva el orden de entrada dentro de cada categoria",
      () => {
        const products: Product[] = [
          product({
            id: "FLOR-002",
            category: "flores",
          }),

          product({
            id: "FLOR-001",
            category: "flores",
          }),
        ];

        const sections =
          buildPdfCategorySections(
            mapProductsToPdfProducts(
              products,
            ),
          );

        expect(
          sections[0].products.map(
            (currentProduct) =>
              currentProduct.id,
          ),
        ).toEqual([
          "FLOR-002",
          "FLOR-001",
        ]);
      },
    );

    it(
      "coloca categorias no oficiales despues de las oficiales",
      () => {
        const products: Product[] = [
          product({
            id: "OTRO-001",
            category: "manualidades",
          }),

          product({
            id: "FLOR-001",
            category: "flores",
          }),
        ];

        const sections =
          buildPdfCategorySections(
            mapProductsToPdfProducts(
              products,
            ),
          );

        expect(
          sections.map(
            (section) =>
              section.id,
          ),
        ).toEqual([
          "flores",
          "manualidades",
        ]);

        expect(
          sections[1].icon,
        ).toBe(
          "📁",
        );
      },
    );
  },
);