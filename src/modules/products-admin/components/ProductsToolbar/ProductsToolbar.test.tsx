import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  DEFAULT_PRODUCT_ADMIN_COLUMNS,
} from "@/modules/products-admin/domain/ProductAdminDisplay";

import {
  EMPTY_PRODUCT_ADMIN_FILTERS,
} from "@/modules/products-admin/domain/ProductAdminFilters";

import type {
  ProductAdminViewMode,
} from "@/modules/products-admin/domain/ProductAdminViewMode";

import ProductsToolbar from "./ProductsToolbar";

function renderToolbar(
  viewMode: ProductAdminViewMode,
) {
  return render(
    <ProductsToolbar
      filters={EMPTY_PRODUCT_ADMIN_FILTERS}
      categories={[]}
      campaigns={[]}
      resultCount={0}
      visibleCount={0}
      sellableCount={0}
      viewMode={viewMode}
      density="comfortable"
      columns={DEFAULT_PRODUCT_ADMIN_COLUMNS}
      hasActiveFilters={false}
      onFiltersChange={vi.fn()}
      onViewModeChange={vi.fn()}
      onDensityChange={vi.fn()}
      onToggleColumn={vi.fn()}
      onClear={vi.fn()}
    />,
  );
}

describe("ProductsToolbar", () => {
  it.each([
    "grid",
    "list",
  ] as const)(
    "oculta configuración tabular en vista %s",
    (viewMode) => {
      renderToolbar(viewMode);

      expect(
        screen.queryByLabelText(
          "Densidad de productos",
        ),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByText(
          "Columnas",
        ),
      ).not.toBeInTheDocument();
    },
  );

  it(
    "muestra densidad y columnas únicamente en Tabla",
    () => {
      renderToolbar("table");

      expect(
        screen.getByLabelText(
          "Densidad de productos",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getAllByText(
          "Columnas",
        ).length,
      ).toBeGreaterThan(0);
    },
  );
});
