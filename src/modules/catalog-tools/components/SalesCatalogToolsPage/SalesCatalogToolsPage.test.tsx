import type {
  ReactNode,
} from "react";

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  beforeEach,
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

import SalesCatalogToolsPage from "./SalesCatalogToolsPage";

vi.mock(
  "@/modules/catalog/hooks/useCatalogData",
  () => ({
    useCatalogData: vi.fn(),
  }),
);

vi.mock(
  "@/modules/catalog/hooks/useCatalogCampaigns",
  () => ({
    useCatalogCampaigns: vi.fn(),
  }),
);

vi.mock(
  "@/modules/admin/components/AdminShell/AdminShell",
  () => ({
    default: ({
      children,
    }: {
      children: ReactNode;
    }) => (
      <div data-testid="admin-shell">
        {children}
      </div>
    ),
  }),
);

vi.mock(
  "@/modules/admin/components/AdminModal/AdminModal",
  () => ({
    default: ({
      open,
      title,
      children,
      onClose,
    }: {
      open: boolean;
      title: string;
      children: ReactNode;
      onClose: () => void;
    }) =>
      open ? (
        <div
          role="dialog"
          aria-label={title}
        >
          {children}

          <button
            type="button"
            onClick={
              onClose
            }
          >
            Cerrar
          </button>
        </div>
      ) : null,
  }),
);

vi.mock(
  "@/modules/catalog-tools/components/CatalogCompositionPanel/CatalogCompositionPanel",
  () => ({
    default: ({
      products,
      campaigns,
      isReady,
      onOpenCatalogSync,
    }: {
      products: readonly unknown[];
      campaigns: readonly unknown[];
      isReady: boolean;
      onOpenCatalogSync?: () => void;
    }) => (
      <section data-testid="composition-panel">
        <span>
          products:{products.length}
        </span>

        <span>
          campaigns:{campaigns.length}
        </span>

        <span>
          ready:{String(isReady)}
        </span>

        <button
          type="button"
          onClick={
            onOpenCatalogSync
          }
        >
          Abrir sincronización
        </button>
      </section>
    ),
  }),
);

vi.mock(
  "@/modules/catalog-tools/components/CatalogSyncPanel/CatalogSyncPanel",
  () => ({
    default: ({
      currentProductCount,
      campaignCount,
      isReady,
    }: {
      currentProductCount: number;
      campaignCount: number;
      isReady: boolean;
    }) => (
      <section data-testid="sync-panel">
        <span>
          products:{currentProductCount}
        </span>

        <span>
          campaigns:{campaignCount}
        </span>

        <span>
          ready:{String(isReady)}
        </span>
      </section>
    ),
  }),
);

const setReadyHooks = () => {
  vi.mocked(
    useCatalogData,
  ).mockReturnValue(
    {
      data: [
        {
          id: "P-001",
        },
      ],
      isLoading: false,
      isFullCatalogLoaded: true,
    } as ReturnType<typeof useCatalogData>,
  );

  vi.mocked(
    useCatalogCampaigns,
  ).mockReturnValue(
    {
      campaigns: [
        {
          id: "C-001",
        },
      ],
      isLoading: false,
    } as ReturnType<typeof useCatalogCampaigns>,
  );
};

describe("SalesCatalogToolsPage Admin 1.0", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setReadyHooks();
  });

  it("deja CatalogCompositionPanel como workspace principal", () => {
    render(
      <SalesCatalogToolsPage />,
    );

    expect(
      screen.getByTestId(
        "admin-shell",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(
        "composition-panel",
      ),
    ).toHaveTextContent(
      "products:1",
    );

    expect(
      screen.getByTestId(
        "composition-panel",
      ),
    ).toHaveTextContent(
      "campaigns:1",
    );

    expect(
      screen.getByTestId(
        "composition-panel",
      ),
    ).toHaveTextContent(
      "ready:true",
    );

    expect(
      screen.queryByText(
        "Catálogos por categoría",
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        "Catálogo listo",
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        "Copiar link",
      ),
    ).not.toBeInTheDocument();
  });

  it("abre Google Sheets desde el coordinador de composición", () => {
    render(
      <SalesCatalogToolsPage />,
    );

    expect(
      screen.queryByRole(
        "dialog",
        {
          name: "Google Sheets",
        },
      ),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Abrir sincronización",
        },
      ),
    );

    expect(
      screen.getByRole(
        "dialog",
        {
          name: "Google Sheets",
        },
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(
        "sync-panel",
      ),
    ).toHaveTextContent(
      "products:1",
    );

    expect(
      screen.getByTestId(
        "sync-panel",
      ),
    ).toHaveTextContent(
      "campaigns:1",
    );
  });

  it("mantiene el estado de carga del workspace", () => {
    vi.mocked(
      useCatalogData,
    ).mockReturnValue(
      {
        data: [],
        isLoading: true,
        isFullCatalogLoaded: false,
      } as unknown as ReturnType<typeof useCatalogData>,
    );

    vi.mocked(
      useCatalogCampaigns,
    ).mockReturnValue(
      {
        campaigns: [],
        isLoading: true,
      } as ReturnType<typeof useCatalogCampaigns>,
    );

    render(
      <SalesCatalogToolsPage />,
    );

    expect(
      screen.getByText(
        "Cargando catálogo y campañas oficiales...",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(
        "composition-panel",
      ),
    ).toHaveTextContent(
      "ready:false",
    );
  });
});
