import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useAdminProducts } from "@/modules/products-admin/hooks/useAdminProducts";
import { useCoreCatalogCampaigns } from "@/modules/catalog-tools/hooks/useCoreCatalogCampaigns";
import SalesCatalogToolsPage from "./SalesCatalogToolsPage";

vi.mock("@/modules/products-admin/hooks/useAdminProducts", () => ({ useAdminProducts: vi.fn() }));
vi.mock("@/modules/catalog-tools/hooks/useCoreCatalogCampaigns", () => ({ useCoreCatalogCampaigns: vi.fn() }));
vi.mock("@/modules/admin/components/AdminShell/AdminShell", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="admin-shell">{children}</div>,
}));
vi.mock("@/modules/catalog-tools/components/CatalogCompositionPanel/CatalogCompositionPanel", () => ({
  default: ({ products, campaigns, isReady, campaignsReady }: {
    products: readonly unknown[]; campaigns: readonly unknown[];
    isReady: boolean; campaignsReady: boolean;
  }) => <section data-testid="composition-panel">
    <span>products:{products.length}</span>
    <span>campaigns:{campaigns.length}</span>
    <span>ready:{String(isReady)}</span>
    <span>campaigns-ready:{String(campaignsReady)}</span>
  </section>,
}));

const renderPage = () => render(
  <MemoryRouter initialEntries={["/admin/catalogos"]}><SalesCatalogToolsPage /></MemoryRouter>,
);
describe("Catálogos / CORE administrativo exclusivo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCoreCatalogCampaigns).mockReturnValue({
      campaigns: [{ id: "campaign-core-id" }], isLoading: false,
      isReady: true, error: null,
    } as ReturnType<typeof useCoreCatalogCampaigns>);
    vi.mocked(useAdminProducts).mockReturnValue({
      data: [{ id: "producto-core" }], isLoading: false,
      isFullCatalogLoaded: true, error: null,
    } as ReturnType<typeof useAdminProducts>);
  });

  it("lee productos desde CORE y no presenta la ventana antigua de Sheets", () => {
    renderPage();
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("products:1");
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("campaigns:1");
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("ready:true");
    expect(screen.queryByRole("dialog", { name: "Google Sheets" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Campañas pendientes de integración/)).not.toBeInTheDocument();
  });

  it("mantiene las campañas disponibles aunque CORE aún no entregue productos", () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: [], isLoading: true, isFullCatalogLoaded: false, error: null,
    } as ReturnType<typeof useAdminProducts>);
    renderPage();
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("products:0");
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("campaigns:1");
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("campaigns-ready:true");
  });

  it("conserva productos disponibles incluso si falla la consulta de campañas", () => {
    vi.mocked(useCoreCatalogCampaigns).mockReturnValue({
      campaigns: [], isLoading: false, isReady: false, error: new Error("campaigns unavailable"),
    } as ReturnType<typeof useCoreCatalogCampaigns>);
    renderPage();
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("products:1");
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("ready:true");
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("campaigns-ready:false");
  });

  it("no usa Sheets como fallback ante un error de CORE", () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: [], isLoading: false, isFullCatalogLoaded: false,
      error: new Error("CORE unavailable"),
    } as ReturnType<typeof useAdminProducts>);
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("No se utilizarán datos antiguos de Sheets");
    expect(screen.getByTestId("composition-panel")).toHaveTextContent("ready:false");
  });
});
