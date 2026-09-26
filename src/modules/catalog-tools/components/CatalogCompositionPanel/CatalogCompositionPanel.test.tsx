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

import type {
  Campaign,
  Product,
} from "@/shared/types/product";

import CatalogCompositionPanel from "./CatalogCompositionPanel";

vi.mock(
  "@/modules/catalog-tools/components/CatalogDraftManager/CatalogDraftManager",
  () => ({
    default: () => null,
  }),
);

const product: Product = {
  id: "FL-001",
  title: "Ramo premium",
  description: "Producto de prueba",
  category: "flores",
  price_1: 10,
  price_3: 9,
  stock: 20,
  img: "/producto.jpg",
  status: "publicado",
};

const campaign: Campaign = {
  id: "campana-prueba",
  name: "Campaña prueba",
  icon: "●",
  themeToken: "campaign.test",
  colorClass: "test",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  priority: 1,
  publicationStatus: "publicado",
  computedStatus: "activa",
};

describe("CatalogCompositionPanel flow", () => {
  it("separa el explorador del workspace y permite regresar", () => {
    render(
      <CatalogCompositionPanel
        products={[product]}
        campaigns={[campaign]}
        isReady
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Selecciona los productos",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Revisa tu catálogo",
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Revisar catálogo →",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Revisa tu catálogo",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        "Resumen del catálogo en tiempo real",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Selecciona los productos",
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "← Volver a seleccionar",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Selecciona los productos",
      }),
    ).toBeInTheDocument();
  });

  it("permite elegir el modo antes de revisar", () => {
    render(
      <CatalogCompositionPanel
        products={[product]}
        campaigns={[campaign]}
        isReady
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Desde cero/,
      }),
    );

    expect(
      screen.getByRole("button", {
        name: /Desde cero/,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    expect(
      screen.queryByLabelText("Buscar producto en catálogo"),
    ).not.toBeInTheDocument();
  });

  it("abre Generar con el PDF como salida principal", () => {
    render(
      <CatalogCompositionPanel
        products={[product]}
        campaigns={[campaign]}
        isReady
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Generar PDF y compartir/,
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Generar catálogo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Genera el PDF de Wooly" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Generar PDF" }),
    ).toHaveLength(1);
  });
});
