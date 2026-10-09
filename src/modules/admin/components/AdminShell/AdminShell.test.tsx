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

describe(
  "AdminShell 2.0",
  () => {
    it(
      "muestra los módulos operativos y activa Productos",
      () => {
        render(
          <MemoryRouter
            initialEntries={[
              "/admin",
            ]}
          >
            <AdminShell>
              <div>
                Contenido
              </div>
            </AdminShell>
          </MemoryRouter>,
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                /Productos/,
            },
          ),
        ).toHaveClass(
          "is-active",
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                /Catálogos/,
            },
          ),
        ).not.toHaveClass(
          "is-active",
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                /Configuración/,
            },
          ),
        ).not.toHaveClass(
          "is-active",
        );

        expect(
          screen.queryByText(
            "Campañas",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "Sistema",
          ),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "activa Configuración en la ruta de datos maestros",
      () => {
        render(
          <MemoryRouter
            initialEntries={[
              "/admin/configuracion/catalogo",
            ]}
          >
            <AdminShell>
              <div>
                Configuración
              </div>
            </AdminShell>
          </MemoryRouter>,
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                /Configuración/,
            },
          ),
        ).toHaveClass(
          "is-active",
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                /Productos/,
            },
          ),
        ).not.toHaveClass(
          "is-active",
        );
      },
    );
  },
);
