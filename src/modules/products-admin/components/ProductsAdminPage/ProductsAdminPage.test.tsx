import type { ReactNode } from "react";

import { fireEvent, act, within, render, screen, waitFor } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCatalogCampaigns } from "@/modules/catalog/hooks/useCatalogCampaigns";
import { useAdminProducts } from "@/modules/products-admin/hooks/useAdminProducts";

import { useAdminAuth } from "@/modules/admin-auth/context/AdminAuthContext";
import {
  loadAdminProductPublicationReadiness,
  publishAdminProduct,
} from "@/modules/admin-auth/services/AdminAuthClient";
import type { Product } from "@/shared/types/product";

import ProductsAdminPage from "./ProductsAdminPage";

vi.mock("@/modules/products-admin/hooks/useAdminProducts", () => ({
  useAdminProducts: vi.fn(),
}));

vi.mock("@/modules/admin-auth/context/AdminAuthContext", () => ({ useAdminAuth: vi.fn() }));
vi.mock("@/modules/admin-auth/services/AdminAuthClient", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/modules/admin-auth/services/AdminAuthClient")>(),
  loadAdminProductPublicationReadiness: vi.fn(),
  publishAdminProduct: vi.fn(),
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
  default: ({
    products,
    onPublishProduct,
    publishingProductId,
    campaigns,
  }: {
    products: readonly Product[];
    onPublishProduct?: (product: Product) => void;
    publishingProductId?: string | null;
    campaigns: readonly { name: string }[];
  }) => (
    <div data-testid="product-explorer">
      products:{products.length}
      {campaigns.map((campaign) => (
        <span key={campaign.name}>{campaign.name}</span>
      ))}
      {onPublishProduct &&
        products.map((product) => (
          <button
            key={product.id}
            disabled={!!publishingProductId}
            onClick={() => onPublishProduct(product)}
          >
            Publicar {product.id}
          </button>
        ))}
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAdminAuth).mockReturnValue({
    status: "authenticated",
    session: {
      authenticated: true,
      user: { id: "u", displayName: "Admin" },
      accesses: [{ role: "ADMIN", brand: { id: "b", code: "W", name: "Wooly", slug: "wooly" } }],
      session: { expiresAt: "2099-01-01" },
    },
    configuration: {
      brandId: "b",
      publicationPolicy: {},
      publicationPolicySource: "DEFAULT",
      defaultPriceList: null,
      inventoryLocations: [],
      categories: [],
      badgeDefinitions: [],
      campaigns: [
        {
          id: "campaign",
          code: "C",
          slug: "campaign",
          name: "Campaña CORE",
          icon: null,
          color: null,
          themeToken: null,
          startsAt: null,
          endsAt: null,
          priority: 1,
          publicationStatus: "PUBLISHED",
          ogMediaAssetId: null,
          ogMediaAsset: null,
        },
      ],
    },
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  });
});
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

    expect(useCatalogCampaigns).not.toHaveBeenCalled();
    expect(screen.getAllByText("Campaña CORE").length).toBeGreaterThan(0);
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
    fireEvent.click(screen.getByRole("button", { name: "CORE" }));
    const updating = screen.getByRole("button", { name: "Actualizando…" });
    expect(updating).toBeDisabled();
    fireEvent.click(updating);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => finish());
    expect(screen.getByRole("button", { name: "CORE" })).toBeEnabled();
  });
});

function renderPublicationProduct() {
  const product: Product = {
    id: "core-p",
    code: "SKU",
    title: "Draft",
    description: "Draft",
    category: "flores",
    price_1: 10,
    stock: null,
    img: "",
    status: "borrador",
  };

  const reload = vi.fn().mockResolvedValue(undefined);

  vi.mocked(useAdminProducts).mockReturnValue({
    data: [product],
    isLoading: false,
    isFullCatalogLoaded: true,
    error: null,
    categories: [],
    reload,
  });

  render(
    <MemoryRouter>
      <ProductsAdminPage />
    </MemoryRouter>,
  );

  return { product, reload };
}

it("reviews the canonical product before POST, confirms, then reloads", async () => {
  const { product, reload } = renderPublicationProduct();

  vi.mocked(loadAdminProductPublicationReadiness).mockResolvedValue({
    success: true,
    data: {
      productId: "core-p",
      ready: true,
      reasons: [],
      warnings: [],
      blockers: [],
      requiredConfirmations: [],
    },
  });

  let finish!: (value: Awaited<ReturnType<typeof publishAdminProduct>>) => void;

  vi.mocked(publishAdminProduct).mockImplementationOnce(
    () => new Promise((resolve) => { finish = resolve; }),
  );

  fireEvent.click(screen.getByRole("button", { name: "Publicar core-p" }));

  const dialog = await screen.findByRole("dialog", { name: "Revisar publicación" });

  expect(loadAdminProductPublicationReadiness).toHaveBeenCalledWith("b", "core-p");
  expect(publishAdminProduct).not.toHaveBeenCalled();
  expect(reload).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar publicación" }));

  await waitFor(() => expect(publishAdminProduct).toHaveBeenCalledOnce());

  expect(publishAdminProduct).toHaveBeenCalledWith("b", "core-p", {
    useDefaultImage: false,
    publishWithoutStock: false,
  });

  expect(reload).not.toHaveBeenCalled();
  expect(product.status).toBe("borrador");

  await act(async () => {
    finish({ success: true, message: "OK", data: { id: "core-p", status: "PUBLISHED" } });
  });

  await waitFor(() => expect(reload).toHaveBeenCalledOnce());
  expect(screen.queryByRole("dialog", { name: "Revisar publicación" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Draft: publicación confirmada por JUNG CORE.");
});

it("cancels after GET without publishing", async () => {
  renderPublicationProduct();

  vi.mocked(loadAdminProductPublicationReadiness).mockResolvedValue({
    success: true,
    data: {
      productId: "core-p",
      ready: true,
      reasons: [],
      warnings: [],
      blockers: [],
      requiredConfirmations: [],
    },
  });

  fireEvent.click(screen.getByRole("button", { name: "Publicar core-p" }));

  const dialog = await screen.findByRole("dialog", { name: "Revisar publicación" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(publishAdminProduct).not.toHaveBeenCalled();
});

it("blocks invalid prices and never sends POST", async () => {
  renderPublicationProduct();

  vi.mocked(loadAdminProductPublicationReadiness).mockResolvedValue({
    success: true,
    data: {
      productId: "core-p",
      ready: false,
      reasons: ["PRICING_INVALID"],
      warnings: [],
      blockers: ["PRICING_INVALID"],
      requiredConfirmations: [],
    },
  });

  fireEvent.click(screen.getByRole("button", { name: "Publicar core-p" }));

  const dialog = await screen.findByRole("dialog", { name: "Revisar publicación" });

  expect(within(dialog).getByText(/precio unitario debe ser mayor/)).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Confirmar publicación" })).toBeDisabled();
  expect(publishAdminProduct).not.toHaveBeenCalled();
});

it("requires separate image and stock confirmations before POST", async () => {
  renderPublicationProduct();

  vi.mocked(loadAdminProductPublicationReadiness).mockResolvedValue({
    success: true,
    data: {
      productId: "core-p",
      ready: false,
      reasons: ["PUBLIC_MEDIA_MISSING", "INVENTORY_OUT_OF_STOCK"],
      warnings: ["PUBLIC_MEDIA_MISSING", "INVENTORY_OUT_OF_STOCK"],
      blockers: [],
      requiredConfirmations: ["useDefaultImage", "publishWithoutStock"],
    },
  });

  vi.mocked(publishAdminProduct).mockResolvedValue({
    success: true,
    message: "OK",
    data: { id: "core-p", status: "PUBLISHED" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Publicar core-p" }));

  const dialog = await screen.findByRole("dialog", { name: "Revisar publicación" });
  const confirm = within(dialog).getByRole("button", { name: "Confirmar publicación" });

  expect(confirm).toBeDisabled();
  fireEvent.click(within(dialog).getByLabelText("Publicar con imagen predeterminada"));
  expect(confirm).toBeDisabled();
  expect(publishAdminProduct).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByLabelText(/Publicar aunque no exista stock/));
  expect(confirm).toBeEnabled();

  fireEvent.click(confirm);

  await waitFor(() => expect(publishAdminProduct).toHaveBeenCalledWith(
    "b",
    "core-p",
    { useDefaultImage: true, publishWithoutStock: true },
  ));
});

it("does not publish when the readiness GET fails", async () => {
  renderPublicationProduct();

  vi.mocked(loadAdminProductPublicationReadiness).mockRejectedValue(
    new Error("CORE no disponible"),
  );

  fireEvent.click(screen.getByRole("button", { name: "Publicar core-p" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("CORE no disponible");
  expect(publishAdminProduct).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("does not offer publication to VIEWER", () => {
  const auth = useAdminAuth();
  vi.mocked(useAdminAuth).mockReturnValue({
    ...auth,
    session: {
      ...auth.session!,
      accesses: [{ role: "VIEWER", brand: { id: "b", code: "W", name: "Wooly", slug: "wooly" } }],
    },
  });
  vi.mocked(useAdminProducts).mockReturnValue({
    data: [
      {
        id: "p",
        title: "Draft",
        description: "",
        category: "flores",
        price_1: 10,
        img: "",
        status: "borrador",
      },
    ],
    isLoading: false,
    isFullCatalogLoaded: true,
    error: null,
    categories: [],
    reload: vi.fn(),
  });
  render(
    <MemoryRouter>
      <ProductsAdminPage />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("button", { name: "Publicar p" })).not.toBeInTheDocument();
});


async function openPublicationConfirmation() {
  vi.mocked(loadAdminProductPublicationReadiness).mockResolvedValue({
    success: true,
    data: { productId: "core-p", ready: true, reasons: [], warnings: [], blockers: [], requiredConfirmations: [] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publicar core-p" }));
  const dialog = await screen.findByRole("dialog", { name: "Revisar publicación" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar publicación" }));
  return dialog;
}

it.each([401, 403, 400])("keeps the product unchanged and shows HTTP %s rejection inside the dialog", async (status) => {
  const { AdminAuthHttpError } = await import("@/modules/admin-auth/services/AdminAuthClient");
  const { product, reload } = renderPublicationProduct();
  vi.mocked(publishAdminProduct).mockRejectedValueOnce(new AdminAuthHttpError(
    status, "Product requires publication corrections or confirmations.", ["PRICING_INVALID"],
  ));
  const dialog = await openPublicationConfirmation();
  const alert = await within(dialog).findByRole("alert");
  expect(alert).toHaveTextContent(status === 401 ? "sesión ha caducado" : status === 403 ? "No tienes permiso" : "precio unitario debe ser mayor que cero");
  expect(product.status).toBe("borrador");
  expect(reload).not.toHaveBeenCalled();
  expect(screen.queryByText(/publicación confirmada por JUNG CORE/)).not.toBeInTheDocument();
});

it("distinguishes confirmed publication from a failed refresh without offering a second POST", async () => {
  const { reload } = renderPublicationProduct();
  reload.mockRejectedValueOnce(new Error("offline"));
  vi.mocked(publishAdminProduct).mockResolvedValueOnce({ success: true, message: "OK", data: { id: "core-p", status: "PUBLISHED" } });
  await openPublicationConfirmation();
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("status")).toHaveTextContent("publicación confirmada por JUNG CORE");
  expect(screen.getByRole("alert")).toHaveTextContent("no se pudo actualizar el listado");
  expect(publishAdminProduct).toHaveBeenCalledOnce();
});

it.each([{ id: "other", status: "PUBLISHED" }, { id: "core-p", status: "DRAFT" }])("does not claim success for an inconsistent response %j", async (data) => {
  const { reload } = renderPublicationProduct();
  vi.mocked(publishAdminProduct).mockResolvedValueOnce({ success: true, message: "OK", data });
  const dialog = await openPublicationConfirmation();
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("CORE no confirmó el estado publicado");
  expect(reload).not.toHaveBeenCalled();
  expect(screen.queryByText(/publicación confirmada por JUNG CORE/)).not.toBeInTheDocument();
});
