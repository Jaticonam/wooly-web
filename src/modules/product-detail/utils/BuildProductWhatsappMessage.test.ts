import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import {
  buildProductWhatsappMessage,
  buildProductWhatsappUrl,
} from "./BuildProductWhatsappMessage";

/* =========================================================
   FIXTURE
   ========================================================= */

const product:
  Product = {
  id: "technical-uuid",
  code: "FLOR-001",

  title:
    "Rosa premium",

  description:
    "Producto de prueba.",

  category:
    "flores",

  price_1:
    10,

  stock:
    20,

  img:
    "https://example.com/product.jpg",

  status:
    "publicado",

  campaigns:
    [],

  priority:
    0,
};

/* =========================================================
   PRUEBAS
   ========================================================= */

describe(
  "BuildProductWhatsappMessage",
  () => {
    it(
      "genera consulta de preventa con saltos naturales",
      () => {
        const message =
          buildProductWhatsappMessage(
            product,
            {
              intent:
                "preorder",

              productUrl:
                "https://wooly.test/producto/FLOR-001",
            },
          );

        expect(
          message,
        ).toContain(
          "producto en preventa",
        );

        expect(
          message,
        ).toContain(
          "\n",
        );

        expect(
          message,
        ).not.toContain(
          "%0A",
        );

        expect(
          message,
        ).toContain(
          "Código: FLOR-001",
        );

        expect(
          message,
        ).toContain(
          "Link: https://wooly.test/producto/FLOR-001",
        );
      },
    );

    it(
      "genera consulta de reposición para agotado",
      () => {
        const message =
          buildProductWhatsappMessage(
            product,
            {
              intent:
                "restock",
            },
          );

        expect(
          message,
        ).toContain(
          "consultar reposición",
        );
      },
    );

    it(
      "codifica el mensaje exactamente una vez",
      () => {
        const message =
          buildProductWhatsappMessage(
            product,
            {
              intent:
                "information",
            },
          );

        const url =
          buildProductWhatsappUrl(
            message,
          );

        const encodedMessage =
          url.split(
            "?text=",
          )[1];

        expect(
          decodeURIComponent(
            encodedMessage,
          ),
        ).toBe(
          message,
        );

        expect(
          url,
        ).not.toContain(
          "%250A",
        );
      },
    );
  },
);
