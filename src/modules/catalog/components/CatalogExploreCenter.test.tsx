import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CatalogExploreCenter,
} from "./CatalogExploreCenter";

const defaultProps = {
  open: true,
  activeCampaign: "",
  activeCategory: "todas",
  campaignCounts: {},
  categoryCounts: {
    todas: 10,
    flores: 5,
  },
  categories: [
    {
      id: "todas",
      name: "Todas",
      icon: "🛍️",
    },
    {
      id: "flores",
      name: "Flores",
      icon: "🌸",
    },
  ],
  campaigns: [],
  cartCount: 0,
  onClose: vi.fn(),
  onCampaignSelect: vi.fn(),
  onCategorySelect: vi.fn(),
  onOpenCart: vi.fn(),
};

afterEach(
  () => {
    document.body.style.overflow =
      "";
    vi.clearAllMocks();
  },
);

describe(
  "CatalogExploreCenter",
  () => {
    it(
      "se expone como diálogo modal y bloquea el scroll del fondo",
      () => {
        const {
          unmount,
        } = render(
          <CatalogExploreCenter
            {...defaultProps}
          />,
        );

        expect(
          screen.getByRole(
            "dialog",
            {
              name:
                "Explorar catálogo",
            },
          ),
        ).toHaveAttribute(
          "aria-modal",
          "true",
        );

        expect(
          document.body.style.overflow,
        ).toBe(
          "hidden",
        );

        unmount();

        expect(
          document.body.style.overflow,
        ).toBe(
          "",
        );
      },
    );

    it(
      "cierra con Escape",
      () => {
        const onClose =
          vi.fn();

        render(
          <CatalogExploreCenter
            {...defaultProps}
            onClose={
              onClose
            }
          />,
        );

        fireEvent.keyDown(
          window,
          {
            key:
              "Escape",
          },
        );

        expect(
          onClose,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );
  },
);
