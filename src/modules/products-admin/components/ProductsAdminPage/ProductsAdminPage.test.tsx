import type { ReactNode } from "react";

import { fireEvent, act, within, render, screen } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import { describe, expect, it, vi } from "vitest";

import { useCatalogCampaigns } from "@/modules/catalog/hooks/useCatalogCampaigns";
import { useAdminProducts } from "@/modules/products-admin/hooks/useAdminProducts";

import ProductsAdminPage from "./ProductsAdminPage";

vi.mock("@/modules/products-admin/hooks/useAdminProducts", () => ({
  useAdminProducts: vi.fn(),
}));

vi.mock("@/modules/catalog/hooks/useCatalogCampaigns", () => ({
  useCatalogCampaigns: vi.fn(),
}));

vi.mock("@/modules/admin/components/AdminShell/AdminShell", () => ({
  default: ({ children, title }: { children: ReactNode; title: string }) => (
    <div data-testid="admin-shell" data-title={title}>
      {children}
    </div>
  ),
}));

vi.mock("@/modules/admin/components/AdminModal/AdminModal", () => ({
  default: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/modules/products-admin/components/SheetsMasterPanel/SheetsMasterPanel", () => ({
  default: () => <div>Sincronización real</div>,
}));

vi.mock("@/modules/products-admin/components/ProductAdminExplorer/ProductAdminExplorer", () => ({
  default: ({ products }: { products: readonly unknown[] }) => (
    <div data-testid="product-explorer">products:{products.length}</div>
  ),
}));

describe("ProductsAdminPage", () => {
  it("muestra Productos y actualiza solo desde CORE sin doble ejecución", async () => {
    let finish!: () => void;
    const reload = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    vi.mocked(useAdminProducts).mockReturnValue({
      data: [
        {
          id: "FL-001",
          title: "Ramo premium",
          description: "Descripción",
          category: "flores",
          status: "publicado",
          price_1: 10,
          stock: null,
          img: "/ramo.jpg",
        },
        {
          id: "out",
          title: "Agotado real",
          description: "Descripción",
          category: "flores",
          status: "agotado",
          price_1: 10,
          stock: 0,
          img: "/out.jpg",
        },
      ],
      isLoading: false,
      isFullCatalogLoaded: true,
      categories: [],
      error: null,
      reload,
    } as ReturnType<typeof useAdminProducts>);

    vi.mocked(useCatalogCampaigns).mockReturnValue({
      campaigns: [],
      isLoading: false,
    } as ReturnType<typeof useCatalogCampaigns>);

    render(
      <MemoryRouter>
        <ProductsAdminPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("admin-shell")).toHaveAttribute("data-title", "Productos");
    expect(screen.getByTestId("product-explorer")).toHaveTextContent("products:2");
    expect(
      screen.getByRole("searchbox", {
        name: "Buscar productos",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por categoría")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por campaña")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por stock")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por estado")).toBeInTheDocument();
    expect(screen.getByLabelText("Resumen de resultados")).toHaveTextContent("2 resultados");

    expect(
      screen.getByRole("button", {
        name: /Preparar catálogo/,
      }),
    ).toBeDisabled();
    expect(screen.queryByText("Crear producto")).not.toBeInTheDocument();
    expect(screen.queryByText("Publicar")).not.toBeInTheDocument();

    expect(screen.queryByText("Actualizar datos")).not.toBeInTheDocument();
    expect(screen.queryByText("Google Sheets")).not.toBeInTheDocument();
    expect(screen.queryByText("Sincronización real")).not.toBeInTheDocument();
    const metric = screen.getByText("Sin stock").closest("article")!;
    expect(within(metric).getByText("1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actualizar productos" }));
    const updating = screen.getByRole("button", { name: "Actualizando…" });
    expect(updating).toBeDisabled();
    fireEvent.click(updating);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => finish());
    expect(screen.getByRole("button", { name: "Actualizar productos" })).toBeEnabled();
  });
});
