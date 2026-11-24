import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AdminShell from "./AdminShell";

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <AdminShell><div>Contenido</div></AdminShell>
  </MemoryRouter>
);

describe("AdminShell 2.0 / W-SIDEBAR-01", () => {
  it("prioriza operaciones y conserva la ruta principal Productos", () => {
    renderAt("/admin");
    expect(screen.getByRole("link", { name: "Productos" })).toHaveClass("is-active");
    expect(screen.getByRole("link", { name: "Catálogos" })).not.toHaveClass("is-active");
    expect(screen.getByRole("link", { name: "Configuración" })).not.toHaveClass("is-active");
    expect(screen.queryByText("Campañas")).not.toBeInTheDocument();
    expect(screen.queryByText("Sistema")).not.toBeInTheDocument();
  });

  it("conserva Configuración y no activa Productos en datos maestros", () => {
    renderAt("/admin/configuracion/catalogo");
    expect(screen.getByRole("link", { name: "Configuración" })).toHaveClass("is-active");
    expect(screen.getByRole("link", { name: "Productos" })).not.toHaveClass("is-active");
  });

  it("despliega las vistas de Pedidos al navegar al tablero", () => {
    renderAt("/admin/pedidos/tablero");
    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveClass("is-active");
    expect(screen.getByRole("link", { name: "Listado de pedidos" })).toHaveAttribute("href", "/admin/pedidos");
    expect(screen.getByRole("link", { name: "Tablero Kanban" })).toHaveClass("is-active");
  });

  it("expande Integraciones desde su control y conserva los enlaces existentes", () => {
    renderAt("/admin");
    fireEvent.click(screen.getByRole("button", { name: "Desplegar Integraciones" }));
    expect(screen.getByRole("link", { name: "Google Sheets" })).toHaveAttribute("href", "/admin/integrations/google-sheets");
    expect(screen.getByRole("link", { name: "JUNG CORE" })).toHaveAttribute("href", "/admin/integrations/jung-core");
    expect(screen.getByRole("link", { name: "Cloudflare R2" })).toHaveAttribute("href", "/admin/integrations/cloudflare-r2");
  });

  it("contrae y vuelve a expandir el menú sin cambiar las rutas", () => {
    renderAt("/admin/pedidos");
    fireEvent.click(screen.getByRole("button", { name: "Contraer menú" }));
    expect(document.querySelector(".wooly-admin-shell--collapsed")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Productos" })).toHaveAttribute("href", "/admin");
    fireEvent.click(screen.getByRole("button", { name: "Expandir menú" }));
    expect(screen.getByRole("link", { name: "Listado de pedidos" })).toBeInTheDocument();
  });
});
