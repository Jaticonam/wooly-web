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

import CatalogCompositionModePicker from "./CatalogCompositionModePicker";

describe(
  "CatalogCompositionModePicker",
  () => {
    it(
      "presenta los cuatro alcances comerciales",
      () => {
        const onChange =
          vi.fn();

        render(
          <CatalogCompositionModePicker
            value="all"
            onChange={onChange}
          />,
        );

        expect(
          screen.getByRole(
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

        expect(
          screen.getByRole(
            "button",
            {
              name:
                /Categoría/,
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                /Campaña/,
            },
          ),
        ).toBeInTheDocument();

        const customButton =
          screen.getByRole(
            "button",
            {
              name:
                /Personalizado/,
            },
          );

        expect(
          customButton,
        ).toBeInTheDocument();

        fireEvent.click(
          customButton,
        );

        expect(
          onChange,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          onChange,
        ).toHaveBeenCalledWith(
          "custom",
        );
      },
    );
  },
);
