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

import type {
  Product,
} from "@/shared/types/product";

import CatalogProductExplorer, {
  type CatalogProductExplorerItem,
} from "./CatalogProductExplorer";

const product =
  {
    id: "P-001",
    title: "Rosa premium",
    category: "flores",
    img: "/producto.jpg",
  } as unknown as Product;

describe("CatalogProductExplorer", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("permite una card exploratoria sin accion", () => {
    const items:
      CatalogProductExplorerItem[] = [
        {
          product,
          stateLabel:
            "Disponible",
          stateTone:
            "available",
        },
      ];

    const {
      container,
    } = render(
      <CatalogProductExplorer
        items={
          items
        }
        isReady
        emptyMessage="Sin productos"
      />,
    );

    expect(
      screen.getByText(
        "Rosa premium",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Disponible",
      ),
    ).toBeInTheDocument();

    expect(
      container.querySelector(
        ".catalog-product-explorer__action",
      ),
    ).toBeNull();
  });

  it("preserva las acciones de manual e hibrido", () => {
    const onAction =
      vi.fn();

    const items:
      CatalogProductExplorerItem[] = [
        {
          product,
          stateLabel:
            "Disponible",
          stateTone:
            "available",
          actionLabel:
            "Agregar",
          actionTone:
            "primary",
          onAction,
        },
      ];

    render(
      <CatalogProductExplorer
        items={
          items
        }
        isReady
        emptyMessage="Sin productos"
      />,
    );

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Agregar",
        },
      ),
    );

    expect(
      onAction,
    ).toHaveBeenCalledTimes(
      1,
    );
  });

  it("reemplaza una imagen fallida por un fallback accesible", () => {
    const items:
      CatalogProductExplorerItem[] = [
        {
          product,
          stateLabel:
            "Disponible",
          stateTone:
            "available",
        },
      ];

    render(
      <CatalogProductExplorer
        items={items}
        isReady
        emptyMessage="Sin productos"
      />,
    );

    fireEvent.error(
      screen.getByRole(
        "img",
        {
          name: "Rosa premium",
        },
      ),
    );

    expect(
      screen.getByRole(
        "img",
        {
          name: "Imagen no disponible para Rosa premium",
        },
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Imagen no disponible",
      ),
    ).toBeInTheDocument();
  });
});
