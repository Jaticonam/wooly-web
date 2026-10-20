import {
  normalizeCatalogSelectionValue,
} from "@wooly/contracts/catalog/domain/CatalogSelection";

import {
  CATEGORY_CONFIG,
} from "../../catalog";

import type {
  PdfProduct,
} from "@wooly/contracts/catalog-export/types/PdfProduct";

export interface PdfCategorySection {
  id: string;
  label: string;
  icon: string;
  products: PdfProduct[];
}

const buildProductsByCategory = (
  products: readonly PdfProduct[],
) => {
  const productsByCategory =
    new Map<string, PdfProduct[]>();

  products.forEach(
    (product) => {
      const categoryId =
        normalizeCatalogSelectionValue(
          product.category,
        );

      if (!categoryId) {
        return;
      }

      const categoryProducts =
        productsByCategory.get(
          categoryId,
        ) ?? [];

      categoryProducts.push(
        product,
      );

      productsByCategory.set(
        categoryId,
        categoryProducts,
      );
    },
  );

  return productsByCategory;
};

export function buildPdfCategorySections(
  products: readonly PdfProduct[],
): PdfCategorySection[] {
  const productsByCategory =
    buildProductsByCategory(
      products,
    );

  const officialCategoryIds =
    new Set(
      CATEGORY_CONFIG
        .filter(
          (category) =>
            category.id !== "todas",
        )
        .map(
          (category) =>
            normalizeCatalogSelectionValue(
              category.id,
            ),
        ),
    );

  const officialSections =
    CATEGORY_CONFIG
      .filter(
        (category) =>
          category.id !== "todas",
      )
      .map(
        (category) => {
          const categoryId =
            normalizeCatalogSelectionValue(
              category.id,
            );

          return {
            id:
              category.id,

            label:
              category.name,

            icon:
              category.icon,

            products:
              productsByCategory.get(
                categoryId,
              ) ?? [],
          };
        },
      )
      .filter(
        (section) =>
          section.products.length > 0,
      );

  const additionalSections =
    Array.from(
      productsByCategory.entries(),
    )
      .filter(
        ([categoryId]) =>
          !officialCategoryIds.has(
            categoryId,
          ),
      )
      .map(
        ([
          categoryId,
          categoryProducts,
        ]) => ({
          id:
            categoryId,

          label:
            categoryId
              .replace(
                /[-_]+/g,
                " ",
              )
              .replace(
                /\b\w/g,
                (letter) =>
                  letter.toUpperCase(),
              ),

          icon:
            "📁",

          products:
            categoryProducts,
        }),
      )
      .sort(
        (
          firstSection,
          secondSection,
        ) =>
          firstSection.label.localeCompare(
            secondSection.label,
            "es",
          ),
      );

  return [
    ...officialSections,
    ...additionalSections,
  ];
}
