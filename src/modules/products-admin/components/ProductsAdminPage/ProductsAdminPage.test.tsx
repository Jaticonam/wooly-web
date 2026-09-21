import type {
  ReactNode,
} from "react";

import {
  fireEvent,
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
  useCatalogCampaigns,
} from "@/modules/catalog/hooks/useCatalogCampaigns";
import {
  useCatalogData,
} from "@/modules/catalog/hooks/useCatalogData";

import ProductsAdminPage from "./ProductsAdminPage";

vi.mock("@/modules/catalog/hooks/useCatalogData", () => ({
  useCatalogData: vi.fn(),
}));

vi.mock("@/modules/catalog/hooks/useCatalogCampaigns", () => ({
  useCatalogCampaigns: vi.fn(),
}));

vi.mock("@/modules/admin/components/AdminShell/AdminShell", () => ({
  default: ({
    children,
    title,
  }: {
    children: ReactNode;
    title: string;
  }) => (
    <div data-testid="admin-shell" data-title={title}>
      {children}
    </div>
  ),
}));

vi.mock("@/modules/admin/components/AdminModal/AdminModal", () => ({
  default: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
  }) => open ? (
    <div role="dialog" aria-label={title}>{children}</div>
  ) : null,
}));

vi.mock("@/modules/catalog-tools/components/CatalogSyncPanel/CatalogSyncPanel", () => ({
  default: () => <div>Sincronización real</div>,
}));

vi.mock("@/modules/products-admin/components/ProductAdminExplorer/ProductAdminExplorer", () => ({
  default: ({ products }: { products: readonly unknown[] }) => (
    <div data-testid="product-explorer">products:{products.length}</div>
  ),
}));

describe("ProductsAdminPage", () => {
  it("muestra Productos sin controles de composición", () => {
    vi.mocked(useCatalogData).mockReturnValue({
      data: [{
        id: "FL-001",
        title: "Ramo premium",
        status: "publicado",
        price_1: 10,
        stock: 12,
        img: "/ramo.jpg",
      }],
      isLoading: false,
      isFullCatalogLoaded: true,
    } as ReturnType<typeof useCatalogData>);

    vi.mocked(useCatalogCampaigns).mockReturnValue({
      campaigns: [],
      isLoading: false,
    } as ReturnType<typeof useCatalogCampaigns>);

    render(<ProductsAdminPage />);

    expect(screen.getByTestId("admin-shell"))
      .toHaveAttribute("data-title", "Productos");
    expect(screen.getByTestId("product-explorer"))
      .toHaveTextContent("products:1");
    expect(screen.getByRole("searchbox", {
      name: "Buscar productos",
    })).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por categoría"))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por campaña"))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por stock"))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por estado"))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Resumen de resultados"))
      .toHaveTextContent("1 resultado");
    expect(screen.getByLabelText("Resumen de resultados"))
      .toHaveTextContent("1 vendible");
    expect(screen.queryByText("Preparar catálogo"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Publicar"))
      .not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", {
      name: "Google Sheets",
    }));

    expect(screen.getByRole("dialog", {
      name: "Google Sheets",
    })).toBeInTheDocument();
  });
});
