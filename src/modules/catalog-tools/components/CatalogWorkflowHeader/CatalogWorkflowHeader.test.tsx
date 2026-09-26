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

import CatalogWorkflowHeader from "./CatalogWorkflowHeader";

describe("CatalogWorkflowHeader", () => {
  it("presenta el flujo real y comunica las acciones", () => {
    const onStageChange = vi.fn();
    const onOpenGenerate = vi.fn();
    const onOpenDrafts = vi.fn();
    const onOpenCatalogSync = vi.fn();
    const onReset = vi.fn();

    render(
      <CatalogWorkflowHeader
        stage="select"
        isGenerateOpen={false}
        canGenerate
        showCatalogSync
        onStageChange={onStageChange}
        onOpenGenerate={onOpenGenerate}
        onOpenDrafts={onOpenDrafts}
        onOpenCatalogSync={onOpenCatalogSync}
        onReset={onReset}
      />,
    );

    expect(screen.getByRole("heading", { name: "Creador de catálogos" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seleccionar/ }))
      .toHaveAttribute("aria-current", "step");

    fireEvent.click(screen.getByRole("button", { name: /Revisar/ }));
    fireEvent.click(screen.getByRole("button", { name: /Generar/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mis catálogos" }));
    fireEvent.click(screen.getByRole("button", { name: "Google Sheets" }));
    fireEvent.click(screen.getByRole("button", { name: "Nuevo catálogo" }));

    expect(onStageChange).toHaveBeenCalledWith("review");
    expect(onOpenGenerate).toHaveBeenCalledOnce();
    expect(onOpenDrafts).toHaveBeenCalledOnce();
    expect(onOpenCatalogSync).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("bloquea la generación mientras no exista una selección", () => {
    render(
      <CatalogWorkflowHeader
        stage="select"
        isGenerateOpen={false}
        canGenerate={false}
        showCatalogSync={false}
        onStageChange={vi.fn()}
        onOpenGenerate={vi.fn()}
        onOpenDrafts={vi.fn()}
        onOpenCatalogSync={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Generar/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Google Sheets" }))
      .not.toBeInTheDocument();
  });
});
