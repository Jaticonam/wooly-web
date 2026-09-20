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
        name: "Encuentra y prepara tu catálogo",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Prepara tu catálogo",
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Preparar catálogo →",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Prepara tu catálogo",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        "Resumen del catálogo en tiempo real",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Encuentra y prepara tu catálogo",
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "← Volver a productos",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Encuentra y prepara tu catálogo",
      }),
    ).toBeInTheDocument();
  });
});
