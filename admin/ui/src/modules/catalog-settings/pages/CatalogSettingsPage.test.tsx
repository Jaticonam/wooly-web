import type {
  ReactNode,
} from "react";

import {
  fireEvent,
  render,
  screen,
  waitFor,
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
  "@/modules/admin-auth/services/AdminAuthClient",
  () => ({
    loadAdminCategoryAttributes: vi.fn().mockResolvedValue({success:true,data:[]}),
    createAdminCategoryAttribute: vi.fn(),
    updateAdminCategoryAttribute: vi.fn(),
    createAdminCategoryAttributeOption: vi.fn(),
    updateAdminCategoryAttributeOption: vi.fn(),
    createAdminCategory:
      vi.fn(),

    updateAdminCategory:
      vi.fn(),

    createAdminCampaign:
      vi.fn(),

    updateAdminCampaign:
      vi.fn(),

    createAdminBadge:
      vi.fn(),

    updateAdminBadge:
      vi.fn(),
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

function createAuth(
  role =
    "ADMIN",
) {
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
          role,

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

            originalFilename:
              "flores-amarillas.jpg",

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
      vi.fn()
        .mockResolvedValue(
          undefined,
        ),
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
      "mantiene la lectura canónica y habilita acciones para ADMIN",
      () => {
        render(
          <CatalogSettingsPage />,
        );

        expect(
          screen.getByText(
            "Peluches",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Nueva categoría",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Editar categoría Peluches",
            },
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "cambia la acción de creación según el maestro activo",
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
          screen.getByRole(
            "button",
            {
              name:
                "Nueva campaña",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Sin campañas canónicas",
          ),
        ).toBeInTheDocument();

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
          screen.getByRole(
            "button",
            {
              name:
                "Nuevo badge",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Editar badge Nuevo",
            },
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "abre el formulario de edición de categoría",
      () => {
        render(
          <CatalogSettingsPage />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Editar categoría Peluches",
            },
          ),
        );

        expect(
          screen.getByRole(
            "dialog",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByDisplayValue(
            "Peluches",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByDisplayValue(
            "flores-amarillas.jpg",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "oculta todas las mutaciones para VIEWER",
      () => {
        testState.auth =
          createAuth(
            "VIEWER",
          );

        render(
          <CatalogSettingsPage />,
        );

        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Nueva categoría",
            },
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Editar categoría Peluches",
            },
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.getByText(
            /VIEWER · solo lectura/,
          ),
        ).toBeInTheDocument();
      },
    );
  },
);

import { loadAdminCategoryAttributes } from "@/modules/admin-auth/services/AdminAuthClient";

describe("Lazy category registry integration", () => {
  beforeEach(() => {
    testState.auth = createAuth();
    vi.mocked(loadAdminCategoryAttributes).mockClear();
  });
  it.each(["ADMIN", "OWNER", "VIEWER"])(
    "opens the selected category for %s without eager requests",
    async (role) => {
      testState.auth = createAuth(role);
      render(<CatalogSettingsPage />);
      expect(loadAdminCategoryAttributes).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Atributos de Peluches" }));
      await waitFor(() =>
        expect(loadAdminCategoryAttributes).toHaveBeenCalledWith("brand-1", "category-1"),
      );
      expect(screen.getByRole("dialog", { name: "Atributos · Peluches" })).toBeInTheDocument();
      await screen.findByText("Esta categoría todavía no tiene atributos.");
      if (role === "VIEWER")
        expect(screen.queryByRole("button", { name: /Agregar atributo/ })).not.toBeInTheDocument();
      else expect(screen.getByRole("button", { name: /Agregar atributo/ })).toBeInTheDocument();
      expect((testState.auth as ReturnType<typeof createAuth>).refresh).not.toHaveBeenCalled();
    },
  );
});
