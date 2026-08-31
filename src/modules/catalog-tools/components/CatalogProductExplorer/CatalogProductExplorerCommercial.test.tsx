import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import CatalogProductExplorer from "./CatalogProductExplorer";

describe(
  "CatalogProductExplorer commercial presentation",
  () => {
    it(
      "muestra informacion comercial sin heredar acciones publicas",
      () => {
        const product =
          {
            id: "A2-5-TEST",
            title:
              "Producto comercial de prueba",
            description:
              "Producto publicado para validar la card administrativa.",
            category:
              "Flores",
            price_1: 10,
            price_3: 9,
            stock: 60,
            img:
              "/placeholder.svg",
            status:
              "publicado",
          } as Product;

        const {
          container,
        } = render(
          <CatalogProductExplorer
            items={[
              {
                product,
                stateLabel:
                  "En catálogo",
                stateTone:
                  "available",
              },
            ]}
            isReady
            emptyMessage="Sin productos"
            presentation="commercial"
          />,
        );

        expect(
          container.querySelector(
            ".catalog-product-explorer__card.is-commercial",
          ),
        ).not.toBeNull();

        expect(
          screen.getByText(
            /Precio unitario/i,
          ),
        ).not.toBeNull();

        expect(
          screen.getByText(
            "Alto stock",
          ),
        ).not.toBeNull();

        expect(
          container.querySelector(
            ".wholesale-list",
          ),
        ).not.toBeNull();

        expect(
          screen.queryByText(
            "Agregar",
          ),
        ).toBeNull();

        expect(
          screen.queryByText(
            "Consultar",
          ),
        ).toBeNull();

        expect(
          screen.queryByText(
            "Capturar",
          ),
        ).toBeNull();
      },
    );
  },
);
