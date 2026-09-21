import {
  render,
  screen,
} from "@testing-library/react";
import {
  MemoryRouter,
} from "react-router-dom";
import {
  describe,
  expect,
  it,
} from "vitest";

import AdminShell from "./AdminShell";

describe("AdminShell 2.0", () => {
  it("muestra solo los módulos operativos y activa Productos", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminShell>
          <div>Contenido</div>
        </AdminShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Productos/ }))
      .toHaveClass("is-active");
    expect(screen.getByRole("link", { name: /Catálogos/ }))
      .not.toHaveClass("is-active");
    expect(screen.queryByText("Campañas"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Sistema"))
      .not.toBeInTheDocument();
  });
});
