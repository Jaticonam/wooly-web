import {
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ProductShareActions,
} from "./ProductShareActions";

describe(
  "ProductShareActions",
  () => {
    it(
      "presenta acciones directas de compartir y deja Pinterest preparado",
      () => {
        render(
          <ProductShareActions
            title="Ramo premium"
            description="Descripción"
            url="https://wooly.example/producto"
            imageUrl="https://cdn.example/share.jpg"
            imageSource="commercial-output"
          />,
        );

        const facebook =
          screen.getByRole(
            "link",
            {
              name:
                "Compartir en Facebook",
            },
          );

        expect(
          facebook,
        ).toBeInTheDocument();

        expect(
          facebook,
        ).toHaveAttribute(
          "data-social-brand",
          "facebook",
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                "Compartir por correo",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "link",
            {
              name:
                "Compartir por WhatsApp",
            },
          ),
        ).toBeInTheDocument();

        const pinterest =
          screen.getByRole(
            "button",
            {
              name:
                "Pinterest próximamente",
            },
          );

        expect(
          pinterest,
        ).toBeDisabled();

        expect(
          pinterest,
        ).toHaveAttribute(
          "data-social-brand",
          "pinterest",
        );
      },
    );

    it(
      "activa Pinterest sin cambiar la UI cuando existe imagen comercial",
      () => {
        render(
          <ProductShareActions
            title="Ramo premium"
            url="https://wooly.example/producto"
            imageUrl="https://cdn.example/share.jpg"
            imageSource="commercial-output"
            pinterestEnabled
          />,
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                "Compartir en Pinterest",
            },
          ),
        ).toHaveAttribute(
          "href",
          expect.stringContaining(
            "media=https%3A%2F%2Fcdn.example%2Fshare.jpg",
          ),
        );
      },
    );
  },
);
