import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import CommercialOutputsPanel from "./CommercialOutputsPanel";

describe("CommercialOutputsPanel", () => {
  it("distingue salidas listas de adapters todavía pendientes", () => {
    render(
      <CommercialOutputsPanel
        productCount={24}
        hasPublicUrl
      />,
    );

    expect(screen.getByText("commercial-composition.v1")).toBeInTheDocument();
    expect(screen.getByText("PDF catálogo")).toBeInTheDocument();
    expect(screen.getByText("Meta")).toBeInTheDocument();
    expect(screen.getByText("Mercado Libre")).toBeInTheDocument();
    expect(screen.getAllByText("Listo")).toHaveLength(3);
    expect(screen.getAllByText("Pendiente")).toHaveLength(3);
  });

  it("bloquea compartir cuando la composición no tiene productos", () => {
    render(
      <CommercialOutputsPanel
        productCount={0}
        hasPublicUrl={false}
      />,
    );

    expect(screen.getAllByText("Bloqueado")).toHaveLength(3);
  });
});
