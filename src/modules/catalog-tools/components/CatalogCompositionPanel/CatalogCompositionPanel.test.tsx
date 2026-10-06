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

import type {
  CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import CatalogCompositionPanel from "./CatalogCompositionPanel";

vi.mock(
  "@/modules/catalog-tools/components/CatalogDraftManager/CatalogDraftManager",
  () => ({
    default: ({
      onLoadComposition,
    }: {
      onLoadComposition:
        (
          composition:
            CatalogComposition,
        ) => void;
    }) => (
      <button
        type="button"
        onClick={() =>
          onLoadComposition({
            mode:
              "automatic",

            filters: {
              categoryIds: [
                "flores",
              ],

              campaignIds:
                [],

              sourceOperator:
                "intersection",

              attributes: {
                colors:
                  [],

                tags:
                  [],
              },
            },

            overrides: {
              includedProductIds:
                [],

              excludedProductIds:
                [],
            },
          })
        }
      >
        Cargar draft legacy
      </button>
    ),
  }),
);

const product = ({
  id,
  title,
  category,
  campaigns = [],
}: {
  id: string;
  title: string;
  category: string;
  campaigns?: string[];
}): Product => ({
  id,
  title,
  description:
    `Producto ${id}`,
  category,
  price_1:
    10,
  price_3:
    9,
  stock:
    20,
  img:
    `/${id}.jpg`,
  status:
    "publicado",
  campaigns,
});

const products: Product[] = [
  product({
    id:
      "FL-001",
    title:
      "Ramo campaña",
    category:
      "flores",
    campaigns: [
      "campana-prueba",
    ],
  }),

  product({
    id:
      "FL-002",
    title:
      "Ramo clásico",
    category:
      "flores",
  }),

  product({
    id:
      "PE-001",
    title:
      "Peluche campaña",
    category:
      "peluches",
    campaigns: [
      "campana-prueba",
    ],
  }),

  product({
    id:
      "CA-001",
    title:
      "Caja especial",
    category:
      "cajas",
  }),
];

const campaign: Campaign = {
  id:
    "campana-prueba",
  name:
    "Campaña prueba",
  icon:
    "●",
  themeToken:
    "campaign.test",
  colorClass:
    "test",
  startDate:
    "2026-01-01",
  endDate:
    "2026-12-31",
  priority:
    1,
  publicationStatus:
    "publicado",
  computedStatus:
    "activa",
};

describe(
  "CatalogCompositionPanel content sources",
  () => {
    it(
      "inicia vacío y sin selector de alcance",
      () => {
        render(
          <CatalogCompositionPanel
            products={
              products
            }
            campaigns={[
              campaign,
            ]}
            isReady
          />,
        );

        expect(
          screen.queryByRole(
            "group",
            {
              name:
                "Alcance comercial",
            },
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.getByText(
            "Define el contenido",
          ),
        ).toBeInTheDocument();

        const board =
          screen.getByLabelText(
            "Composición del catálogo",
          );

        expect(
          within(
            board,
          ).getByText(
            "Sin productos incluidos",
          ),
        ).toBeInTheDocument();

        expect(
          within(
            board,
          ).getByRole(
            "button",
            {
              name:
                "Vista previa",
            },
          ),
        ).toBeDisabled();

        expect(
          within(
            board,
          ).getByRole(
            "button",
            {
              name:
                "Preparar salida",
            },
          ),
        ).toBeDisabled();
      },
    );

    it(
      "acumula categoría y campaña mediante unión",
      () => {
        render(
          <CatalogCompositionPanel
            products={
              products
            }
            campaigns={[
              campaign,
            ]}
            isReady
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                /Flores/,
            },
          ),
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                /Campaña prueba/,
            },
          ),
        );

        const board =
          screen.getByLabelText(
            "Composición del catálogo",
          );

        expect(
          within(
            board,
          ).getByText(
            "Ramo campaña",
          ),
        ).toBeInTheDocument();

        expect(
          within(
            board,
          ).getByText(
            "Ramo clásico",
          ),
        ).toBeInTheDocument();

        expect(
          within(
            board,
          ).getByText(
            "Peluche campaña",
          ),
        ).toBeInTheDocument();

        expect(
          within(
            board,
          ).queryByText(
            "Caja especial",
          ),
        ).not.toBeInTheDocument();

        expect(
          within(
            board,
          ).getAllByRole(
            "article",
          ),
        ).toHaveLength(
          3,
        );
      },
    );

    it(
      "preserva el handoff de Product Explorer al añadir categorías",
      () => {
        render(
          <CatalogCompositionPanel
            initialProductIds={[
              "CA-001",
            ]}
            products={
              products
            }
            campaigns={[
              campaign,
            ]}
            isReady
          />,
        );

        const board =
          screen.getByLabelText(
            "Composición del catálogo",
          );

        expect(
          within(
            board,
          ).getByText(
            "Caja especial",
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
            board,
          ).getByText(
            "Caja especial",
          ),
        ).toBeInTheDocument();

        expect(
          within(
            board,
          ).getByText(
            "Ramo campaña",
          ),
        ).toBeInTheDocument();

        expect(
          within(
            board,
          ).getByText(
            "Ramo clásico",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "presenta categorías campañas y productos como fuentes simultáneas",
      () => {
        render(
          <CatalogCompositionPanel
            initialProductIds={[
              "CA-001",
            ]}
            products={
              products
            }
            campaigns={[
              campaign,
            ]}
            isReady
          />,
        );

        expect(
          screen.getAllByText(
            "Categorías",
          ).length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          screen.getAllByText(
            "Campañas",
          ).length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          screen.getAllByText(
            "Productos",
          ).length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          screen.getByText(
            "1 agregado",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /resultado acumulado de categorías \+ campañas \+ productos/i,
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "habilita preview y salida solo con contenido resuelto",
      () => {
        render(
          <CatalogCompositionPanel
            products={
              products
            }
            campaigns={[
              campaign,
            ]}
            isReady
          />,
        );

        const board =
          screen.getByLabelText(
            "Composición del catálogo",
          );

        const preview =
          within(
            board,
          ).getByRole(
            "button",
            {
              name:
                "Vista previa",
            },
          );

        const prepare =
          within(
            board,
          ).getByRole(
            "button",
            {
              name:
                "Preparar salida",
            },
          );

        expect(
          preview,
        ).toBeDisabled();

        expect(
          prepare,
        ).toBeDisabled();

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
          preview,
        ).toBeEnabled();

        expect(
          prepare,
        ).toBeEnabled();

        fireEvent.click(
          prepare,
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
      },
    );

    it(
      "abre el gestor de productos sin borrar las otras fuentes",
      () => {
        render(
          <CatalogCompositionPanel
            products={
              products
            }
            campaigns={[
              campaign,
            ]}
            isReady
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                /Flores/,
            },
          ),
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Gestionar productos",
            },
          ),
        );

        expect(
          screen.getByText(
            "Productos · agregar, retirar o excluir",
          ),
        ).toBeInTheDocument();

        const board =
          screen.getByLabelText(
            "Composición del catálogo",
          );

        expect(
          within(
            board,
          ).getByText(
            "Ramo campaña",
          ),
        ).toBeInTheDocument();

        expect(
          within(
            board,
          ).getByText(
            "Ramo clásico",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);
const renderDraftCompatibilityPanel =
  () =>
    render(
      <CatalogCompositionPanel
        products={
          products
        }
        campaigns={[
          campaign,
        ]}
        isReady
      />,
    );

const loadLegacyDraftIntoPanel =
  () => {
    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name:
            "Mis catálogos",
        },
      ),
    );

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name:
            "Cargar draft legacy",
        },
      ),
    );

    expect(
      screen.getAllByText("Selección histórica")[0],
    ).toBeInTheDocument();
  };

describe(
  "CatalogCompositionPanel Draft Compatibility V2",
  () => {
    it(
      "abrir Gestionar productos no migra un draft intersection",
      () => {
        renderDraftCompatibilityPanel();
        loadLegacyDraftIntoPanel();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Gestionar productos",
            },
          ),
        );

        expect(
          screen.getAllByText("Selección histórica")[0],
        ).toBeInTheDocument();
      },
    );

    it(
      "abrir y cerrar details de ajustes es no-op semántico",
      () => {
        renderDraftCompatibilityPanel();
        loadLegacyDraftIntoPanel();

        const details =
          document.getElementById(
            "catalog-product-adjustments",
          ) as HTMLDetailsElement;

        details.open =
          true;

        fireEvent(
          details,
          new Event(
            "toggle",
            {
              bubbles:
                true,
            },
          ),
        );

        expect(
          screen.getAllByText("Selección histórica")[0],
        ).toBeInTheDocument();

        details.open =
          false;

        fireEvent(
          details,
          new Event(
            "toggle",
            {
              bubbles:
                true,
            },
          ),
        );

        expect(
          screen.getAllByText("Selección histórica")[0],
        ).toBeInTheDocument();
      },
    );

    it(
      "una acción real de producto migra intersection a Content Sources",
      () => {
        renderDraftCompatibilityPanel();
        loadLegacyDraftIntoPanel();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Gestionar productos",
            },
          ),
        );

        fireEvent.click(
          screen.getAllByRole(
            "button",
            {
              name:
                "+ Agregar",
            },
          )[0],
        );

        expect(
          (screen.queryAllByText("Selección histórica")[0] ?? null),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "cambiar categoría realmente migra intersection a union",
      () => {
        renderDraftCompatibilityPanel();
        loadLegacyDraftIntoPanel();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                /Peluches/,
            },
          ),
        );

        expect(
          (screen.queryAllByText("Selección histórica")[0] ?? null),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "cambiar campaña realmente migra intersection a union",
      () => {
        renderDraftCompatibilityPanel();
        loadLegacyDraftIntoPanel();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                /Campaña prueba/,
            },
          ),
        );

        expect(
          (screen.queryAllByText("Selección histórica")[0] ?? null),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "editar solo el título conserva intersection",
      () => {
        renderDraftCompatibilityPanel();
        loadLegacyDraftIntoPanel();

        fireEvent.change(
          screen.getByRole(
            "textbox",
            {
              name:
                "Título del catálogo",
            },
          ),

          {
            target: {
              value:
                "Catálogo renombrado",
            },
          },
        );

        expect(
          screen.getAllByText("Selección histórica")[0],
        ).toBeInTheDocument();
      },
    );
  },
);
