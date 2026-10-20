import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import IntegrationsPage from "./IntegrationsPage";

vi.mock("@/modules/admin/components/AdminShell/AdminShell", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="admin-shell">{children}</div>
  ),
}));

vi.mock(
  "@/modules/products-admin/components/SheetsMasterPanel/SheetsMasterPanel",
  () => ({
    default: () => <div data-testid="sheets-master-panel">Sheets fixture</div>,
  }),
);

function openRoute(route: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route
            path="/admin/integrations/*"
            element={<IntegrationsPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("INT-01.5 integrations navigation", () => {
  it("renders the integration center without mounting Sheets", () => {
    openRoute("/admin/integrations");

    expect(screen.getByText("Centro de Integraciones")).toBeInTheDocument();
    expect(screen.getByText("Meta Commerce")).toBeInTheDocument();
    expect(screen.queryByTestId("sheets-master-panel")).not.toBeInTheDocument();
  });

  it("mounts Sheets only on its own English route", () => {
    openRoute("/admin/integrations/google-sheets");

    expect(screen.getByTestId("sheets-master-panel")).toBeInTheDocument();
    expect(screen.queryByText("Meta Commerce")).not.toBeInTheDocument();
  });

  it("shows CORE without mounting Sheets", () => {
    openRoute("/admin/integrations/jung-core");

    expect(screen.getByText("Abrir Product Explorer")).toBeInTheDocument();
    expect(screen.queryByTestId("sheets-master-panel")).not.toBeInTheDocument();
  });

  it("shows R2 as pending without mounting Sheets", () => {
    openRoute("/admin/integrations/cloudflare-r2");

    expect(screen.getByText(/Integración de imágenes pendiente/)).toBeInTheDocument();
    expect(screen.queryByTestId("sheets-master-panel")).not.toBeInTheDocument();
  });

  it("rejects unknown integration sections", () => {
    openRoute("/admin/integrations/unknown-service");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Integración no encontrada",
    );
    expect(screen.queryByTestId("sheets-master-panel")).not.toBeInTheDocument();
  });
});