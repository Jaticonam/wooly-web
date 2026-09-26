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
  it("prioriza el PDF y separa los canales futuros", () => {
    render(
      <CommercialOutputsPanel
        productCount={24}
        hasPublicUrl
        pdfUrl="/catalogo/pdf?print=1"
      />,
    );

    expect(screen.getByText("Catálogo mayorista PDF")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Generar PDF" })).toHaveAttribute(
      "href",
      "/catalogo/pdf?print=1",
    );
    expect(screen.getByText("Meta Catalog")).toBeInTheDocument();
    expect(screen.getByText("Mercado Libre")).toBeInTheDocument();
    expect(screen.getByText("Canales en preparación")).toBeInTheDocument();
  });

  it("bloquea el PDF cuando la composición no tiene productos", () => {
    render(
      <CommercialOutputsPanel
        productCount={0}
        hasPublicUrl={false}
      />,
    );

    expect(screen.getByText("Sin productos")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Generar PDF" })).not.toBeInTheDocument();
  });
});
