import {
  fireEvent,
  render,
  screen,
  within,
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
  campaigns: [
    "campana-prueba",
  ],
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

describe(
  "CatalogCompositionPanel workspace",
  () => {
    it(
      "inicia con alcance Todos y composición continua",
      () => {
        render(
          <CatalogCompositionPanel
            products={[product]}
            campaigns={[campaign]}
            isReady
          />,
        );

        const scopePicker =
          screen.getByRole(
            "group",
            {
              name:
                "Alcance comercial",
            },
          );

        expect(
          within(
            scopePicker,
          ).getByRole(
            "button",
            {
              name:
                /Todos/,
            },
          ),
        ).toHaveAttribute(
          "aria-pressed",
          "true",
        );

        const compositionBoard =
          screen.getByLabelText(
            "Composición del catálogo",
          );

        expect(
          within(
            compositionBoard,
          ).getByText(
            "Ramo premium",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByRole(
            "button",
            {
              name:
                /Revisar catálogo/,
            },
          ),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "muestra controles contextuales para Categoría y Campaña",
      () => {
        render(
          <CatalogCompositionPanel
            products={[product]}
            campaigns={[campaign]}
            isReady
          />,
        );

        const scopePicker =
          screen.getByRole(
            "group",
            {
              name:
                "Alcance comercial",
            },
          );

        fireEvent.click(
          within(
            scopePicker,
          ).getByRole(
            "button",
            {
              name:
                /Categoría/,
            },
          ),
        );

        expect(
          within(
            scopePicker,
          ).getByRole(
            "button",
            {
              name:
                /Categoría/,
            },
          ),
        ).toHaveAttribute(
          "aria-pressed",
          "true",
        );

        expect(
          screen.getByText(
            "Flores",
          ),
        ).toBeInTheDocument();

        fireEvent.click(
          within(
            scopePicker,
          ).getByRole(
            "button",
            {
              name:
                /Campaña/,
            },
          ),
        );

        expect(
          within(
            scopePicker,
          ).getByRole(
            "button",
            {
              name:
                /Campaña/,
            },
          ),
        ).toHaveAttribute(
          "aria-pressed",
          "true",
        );

        expect(
          screen.getByText(
            "Campaña prueba",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "interpreta handoff como Personalizado y conserva la selección al cambiar de alcance",
      () => {
        render(
          <CatalogCompositionPanel
            initialProductIds={[
              product.id,
            ]}
            products={[product]}
            campaigns={[campaign]}
            isReady
          />,
        );

        const scopePicker =
          screen.getByRole(
            "group",
            {
              name:
                "Alcance comercial",
            },
          );

        const customButton =
          within(
            scopePicker,
          ).getByRole(
            "button",
            {
              name:
                /Personalizado/,
            },
          );

        expect(
          customButton,
        ).toHaveAttribute(
          "aria-pressed",
          "true",
        );

        expect(
          screen.getByText(
            "1 producto seleccionado",
          ),
        ).toBeInTheDocument();

        fireEvent.click(
          within(
            scopePicker,
          ).getByRole(
            "button",
            {
              name:
                /Todos/,
            },
          ),
        );

        fireEvent.click(
          customButton,
        );

        expect(
          screen.getByText(
            "1 producto seleccionado",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "no muestra productos hasta configurar Categoría",
      () => {
        render(
          <CatalogCompositionPanel
            products={[product]}
            campaigns={[campaign]}
            isReady
          />,
        );

        const scopePicker =
          screen.getByRole(
            "group",
            {
              name:
                "Alcance comercial",
            },
          );

        fireEvent.click(
          within(
            scopePicker,
          ).getByRole(
            "button",
            {
              name:
                /Categoría/,
            },
          ),
        );

        const compositionBoard =
          screen.getByLabelText(
            "Composición del catálogo",
          );

        expect(
          within(
            compositionBoard,
          ).getByText(
            "Sin productos incluidos",
          ),
        ).toBeInTheDocument();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                /Flores/,
            },
          ),
        );

        expect(
          within(
            compositionBoard,
          ).getByText(
            "Ramo premium",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "abre la salida comercial desde el Composition Board",
      () => {
        render(
          <CatalogCompositionPanel
            products={[product]}
            campaigns={[campaign]}
            isReady
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Preparar salida",
            },
          ),
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Generar catálogo",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Genera el PDF de Wooly",
            },
          ),
        ).toBeInTheDocument();
      },
    );
  },
);
