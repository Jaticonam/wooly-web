import type {
  ReactNode,
} from "react";

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

const testState =
  vi.hoisted(
    () => ({
      auth:
        null as unknown,
    }),
  );

vi.mock(
  "@/modules/admin/components/AdminShell/AdminShell",
  () => ({
    default: ({
      children,
    }: {
      children:
        ReactNode;
    }) => (
      <div>
        {children}
      </div>
    ),
  }),
);

vi.mock(
  "@/modules/admin-auth/context/AdminAuthContext",
  () => ({
    useAdminAuth:
      () =>
        testState.auth,
  }),
);

import CatalogSettingsPage from "./CatalogSettingsPage";

function createAuth() {
  return {
    status:
      "authenticated",

    session: {
      authenticated:
        true,

      user: {
        id:
          "admin-1",

        displayName:
          "Admin Test",
      },

      accesses: [
        {
          role:
            "ADMIN",

          brand: {
            id:
              "brand-1",

            code:
              "WOOLY",

            name:
              "Wooly",

            slug:
              "wooly",
          },
        },
      ],

      session: {
        expiresAt:
          "2026-10-09T10:00:00.000Z",
      },
    },

    configuration: {
      brandId:
        "brand-1",

      publicationPolicy:
        {},

      publicationPolicySource:
        "DEFAULT",

      defaultPriceList:
        null,

      inventoryLocations:
        [],

      categories: [
        {
          id:
            "category-1",

          code:
            "peluches",

          name:
            "Peluches",

          slug:
            "peluches",

          description:
            "Peluches y regalos",

          priority:
            100,

          status:
            "ACTIVE",

          ogMediaAssetId:
            "media-1",

          ogMediaAsset: {
            id:
              "media-1",

            mediaCode:
              "peluches-og",

            title:
              "Peluches OG",

            publicUrl:
              "https://example.com/peluches.jpg",

            thumbnailUrl:
              null,

            mimeType:
              "image/jpeg",

            width:
              1200,

            height:
              630,

            status:
              "ACTIVE",
          },
        },

        {
          id:
            "category-2",

          code:
            "flores",

          name:
            "Flores",

          slug:
            "flores",

          description:
            null,

          priority:
            80,

          status:
            "INACTIVE",

          ogMediaAssetId:
            null,

          ogMediaAsset:
            null,
        },
      ],

      campaigns:
        [],

      badgeDefinitions: [
        {
          id:
            "badge-1",

          code:
            "merchandising.new",

          label:
            "Nuevo",

          icon:
            "✨",

          kind:
            "merchandising",

          themeToken:
            "merchandising.new",

          priority:
            75,

          status:
            "ACTIVE",
        },
      ],
    },

    error:
      null,

    login:
      vi.fn(),

    logout:
      vi.fn(),

    refresh:
      vi.fn(),
  };
}

describe(
  "CatalogSettingsPage",
  () => {
    beforeEach(
      () => {
        testState.auth =
          createAuth();
      },
    );

    it(
      "muestra categorías canónicas y su OG por defecto",
      () => {
        render(
          <CatalogSettingsPage />,
        );

        expect(
          screen.getByRole(
            "tab",
            {
              name:
                /Categorías 2/,
            },
          ),
        ).toHaveAttribute(
          "aria-selected",
          "true",
        );

        expect(
          screen.getByText(
            "Peluches",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Flores",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByAltText(
            "OG Peluches",
          ),
        ).toHaveAttribute(
          "src",
          "https://example.com/peluches.jpg",
        );

        expect(
          screen.getByText(
            "Inactivo",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "muestra estado vacío real cuando no existen campañas",
      () => {
        render(
          <CatalogSettingsPage />,
        );

        fireEvent.click(
          screen.getByRole(
            "tab",
            {
              name:
                /Campañas 0/,
            },
          ),
        );

        expect(
          screen.getByText(
            "Sin campañas canónicas",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /todavía no tiene campañas registradas en JUNG CORE/,
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "presenta el registro de badges sin habilitar mutaciones",
      () => {
        render(
          <CatalogSettingsPage />,
        );

        fireEvent.click(
          screen.getByRole(
            "tab",
            {
              name:
                /Badges 1/,
            },
          ),
        );

        expect(
          screen.getByText(
            "Nuevo",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getAllByText(
            "merchandising.new",
          ),
        ).toHaveLength(
          2,
        );

        expect(
          screen.getByText(
            "merchandising",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByRole(
            "button",
            {
              name:
                /crear|editar|guardar/i,
            },
          ),
        ).not.toBeInTheDocument();
      },
    );
  },
);
