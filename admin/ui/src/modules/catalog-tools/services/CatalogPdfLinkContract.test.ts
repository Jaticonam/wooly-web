import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildCatalogPdfPath,
} from "./BuildCatalogPdfUrl";

import {
  parseCatalogPdfLink,
} from "@wooly/contracts/catalog-tools/services/CatalogPdfLinkContract";

describe(
  "CatalogPdfLinkContract v1",
  () => {
    it.each([
      [
        "general",
        {},
        "/catalogo/pdf?v=1",
      ],
      [
        "categoría",
        {
          categoryId:
            "Flores",
        },
        "/catalogo/pdf?v=1&cat=flores",
      ],
      [
        "campaña",
        {
          campaignId:
            "Navidad",
        },
        "/catalogo/pdf?v=1&cpg=navidad",
      ],
      [
        "combinación",
        {
          categoryId:
            "Flores",

          campaignId:
            "Navidad",
        },
        "/catalogo/pdf?v=1&cat=flores&cpg=navidad",
      ],
    ])(
      "genera URL canónica %s",
      (
        _case,
        input,
        expected,
      ) => {
        expect(
          buildCatalogPdfPath(
            input,
          ),
        ).toBe(
          expected,
        );
      },
    );

    it.each([
      [
        "categoria",
        "categoria=flores",
        "categoryId",
      ],
      [
        "category",
        "category=flores",
        "categoryId",
      ],
      [
        "campania",
        "campania=navidad",
        "campaignId",
      ],
      [
        "campaign",
        "campaign=navidad",
        "campaignId",
      ],
    ])(
      "lee alias %s con warning",
      (
        alias,
        query,
        field,
      ) => {
        const result =
          parseCatalogPdfLink(
            query,
          );

        expect(
          result,
        ).toMatchObject({
          ok:
            true,

          warnings: [
            {
              code:
                "LEGACY_PARAMETER_USED",

              parameter:
                alias,
            },
          ],
        });

        if (
          result.ok &&
          result.contract.version ===
            "1"
        ) {
          expect(
            result.contract[
              field as
                | "categoryId"
                | "campaignId"
            ],
          ).toBe(
            field ===
            "categoryId"
              ? "flores"
              : "navidad",
          );
        }
      },
    );

    it(
      "acepta versión ausente legacy y v1",
      () => {
        expect(
          parseCatalogPdfLink(
            "cat=flores",
          ),
        ).toMatchObject({
          ok:
            true,

          contract: {
            version:
              "1",

            categoryId:
              "flores",
          },
        });

        expect(
          parseCatalogPdfLink(
            "v=1&cat=flores",
          ),
        ).toMatchObject({
          ok:
            true,

          contract: {
            version:
              "1",

            categoryId:
              "flores",
          },
        });
      },
    );

    it.each([
      "v=3",
      "v=abc",
    ])(
      "rechaza versión desconocida %s",
      (query) => {
        expect(
          parseCatalogPdfLink(
            query,
          ),
        ).toMatchObject({
          ok:
            false,

          errors: [
            {
              code:
                "UNSUPPORTED_VERSION",
            },
          ],
        });
      },
    );

    it.each([
      [
        "categoría",
        "v=1&cat=valor%20inválido",
        "INVALID_CATEGORY_ID",
      ],
      [
        "campaña",
        "v=1&cpg=%2Fhack",
        "INVALID_CAMPAIGN_ID",
      ],
    ])(
      "rechaza ID de %s inválido",
      (
        _case,
        query,
        code,
      ) => {
        expect(
          parseCatalogPdfLink(
            query,
          ),
        ).toMatchObject({
          ok:
            false,

          errors:
            expect.arrayContaining([
              expect.objectContaining({
                code,
              }),
            ]),
        });
      },
    );

    it(
      "normaliza valores vacíos como catálogo general",
      () => {
        expect(
          parseCatalogPdfLink(
            "v=1&cat=&cpg=",
          ),
        ).toMatchObject({
          ok:
            true,

          contract: {
            version:
              "1",
          },
        });
      },
    );

    it(
      "rechaza parámetros canónicos y legacy en conflicto",
      () => {
        expect(
          parseCatalogPdfLink(
            "v=1&cat=flores&categoria=cajas",
          ),
        ).toMatchObject({
          ok:
            false,

          errors: [
            {
              code:
                "CONFLICTING_PARAMETER",
            },
          ],
        });
      },
    );

    it(
      "el builder V1 nunca genera aliases legacy",
      () => {
        const path =
          buildCatalogPdfPath({
            categoryId:
              "flores",

            campaignId:
              "navidad",
          });

        expect(
          path,
        ).toContain(
          "v=1",
        );

        expect(
          path,
        ).not.toMatch(
          /categoria|category|campania|campaign/,
        );
      },
    );

    it(
      "diagnostica e ignora parámetros desconocidos",
      () => {
        expect(
          parseCatalogPdfLink(
            "v=1&cat=flores&extra=valor",
          ),
        ).toMatchObject({
          ok:
            true,

          warnings: [
            {
              code:
                "UNKNOWN_PARAMETER",

              parameter:
                "extra",
            },
          ],
        });
      },
    );

    it(
      "rechaza parámetros V2 dentro del contrato V1",
      () => {
        expect(
          parseCatalogPdfLink(
            "v=1&cats=flores,peluches",
          ),
        ).toMatchObject({
          ok:
            false,

          errors:
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "CONFLICTING_PARAMETER",

                parameter:
                  "cats",
              }),
            ]),
        });
      },
    );

    it(
      "sin versión sigue siendo V1 y no infiere V2",
      () => {
        expect(
          parseCatalogPdfLink(
            "cats=flores,peluches",
          ),
        ).toMatchObject({
          ok:
            false,

          errors:
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "CONFLICTING_PARAMETER",
              }),
            ]),
        });
      },
    );
  },
);

describe(
  "CatalogPdfLinkContract v2",
  () => {
    it(
      "genera múltiples categorías con coma visible",
      () => {
        const path =
          buildCatalogPdfPath({
            version:
              "2",

            categoryIds: [
              "Peluches",
              " Flores ",
              "flores",
            ],
          });

        expect(
          path,
        ).toBe(
          "/catalogo/pdf?v=2&cats=flores,peluches",
        );

        expect(
          path,
        ).not.toContain(
          "%2C",
        );
      },
    );

    it(
      "genera múltiples campañas en orden canónico",
      () => {
        expect(
          buildCatalogPdfPath({
            version:
              "2",

            campaignIds: [
              "Premium",
              "Día-Novia",
            ],
          }),
        ).toBe(
          "/catalogo/pdf?v=2&cpgs=d%C3%ADa-novia,premium",
        );
      },
    );

    it(
      "genera categorías y campañas juntas",
      () => {
        expect(
          buildCatalogPdfPath({
            version:
              "2",

            categoryIds: [
              "peluches",
              "flores",
            ],

            campaignIds: [
              "premium",
              "dia-novia",
            ],
          }),
        ).toBe(
          "/catalogo/pdf?v=2&cats=flores,peluches&cpgs=dia-novia,premium",
        );
      },
    );

    it(
      "permite V2 vacío sin convertirlo en V1",
      () => {
        expect(
          buildCatalogPdfPath({
            version:
              "2",
          }),
        ).toBe(
          "/catalogo/pdf?v=2",
        );

        expect(
          parseCatalogPdfLink(
            "v=2",
          ),
        ).toMatchObject({
          ok:
            true,

          contract: {
            version:
              "2",

            categoryIds:
              [],

            campaignIds:
              [],
          },
        });
      },
    );

    it(
      "parsea, normaliza, deduplica y ordena cats/cpgs",
      () => {
        expect(
          parseCatalogPdfLink(
            "v=2&cats=Peluches,flores,FLORES&cpgs=Premium,dia-novia,premium",
          ),
        ).toMatchObject({
          ok:
            true,

          contract: {
            version:
              "2",

            categoryIds: [
              "flores",
              "peluches",
            ],

            campaignIds: [
              "dia-novia",
              "premium",
            ],
          },
        });
      },
    );

    it.each([
      [
        "categoría",
        "v=2&cats=flores,valor%20invalido",
        "INVALID_CATEGORY_ID",
      ],
      [
        "campaña",
        "v=2&cpgs=navidad,%2Fhack",
        "INVALID_CAMPAIGN_ID",
      ],
    ])(
      "rechaza ID V2 de %s inválido",
      (
        _label,
        query,
        code,
      ) => {
        expect(
          parseCatalogPdfLink(
            query,
          ),
        ).toMatchObject({
          ok:
            false,

          errors:
            expect.arrayContaining([
              expect.objectContaining({
                code,
              }),
            ]),
        });
      },
    );

    it.each([
      "v=2&cat=flores&cats=peluches,cajas",
      "v=2&cpg=navidad&cpgs=premium,dia-novia",
      "v=2&categoria=flores&cats=peluches",
      "v=2&campaign=navidad&cpgs=premium",
    ])(
      "rechaza mezcla de contratos V1/V2: %s",
      (query) => {
        expect(
          parseCatalogPdfLink(
            query,
          ),
        ).toMatchObject({
          ok:
            false,

          errors:
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "CONFLICTING_PARAMETER",
              }),
            ]),
        });
      },
    );

    it(
      "diagnostica parámetros desconocidos sin romper V2",
      () => {
        expect(
          parseCatalogPdfLink(
            "v=2&cats=flores,peluches&extra=valor",
          ),
        ).toMatchObject({
          ok:
            true,

          contract: {
            version:
              "2",
          },

          warnings: [
            {
              code:
                "UNKNOWN_PARAMETER",

              parameter:
                "extra",
            },
          ],
        });
      },
    );
  },
);
describe(
  "CatalogPdfLinkContract Public ID",
  () => {
    it(
      "genera ruta pública canónica sin v=1 ni v=2",
      () => {
        expect(
          buildCatalogPdfPath({
            publicId:
              " PUB-AbC123 ",
          }),
        ).toBe(
          "/catalogo/pdf?id=PUB-AbC123",
        );
      },
    );

    it(
      "parsea Public ID sin degradarlo a V1",
      () => {
        expect(
          parseCatalogPdfLink(
            "id=PUB-AbC123",
          ),
        ).toEqual({
          ok:
            true,

          contract: {
            publicId:
              "PUB-AbC123",
          },

          warnings:
            [],
        });
      },
    );

    it.each([
      [
        "vacío",
        "id=",
      ],
      [
        "espacios",
        "id=valor%20invalido",
      ],
      [
        "barra",
        "id=%2Fhack",
      ],
    ])(
      "rechaza Public ID %s",
      (
        _label,
        query,
      ) => {
        expect(
          parseCatalogPdfLink(
            query,
          ),
        ).toMatchObject({
          ok:
            false,

          errors:
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "INVALID_PUBLIC_ID",

                parameter:
                  "id",
              }),
            ]),
        });
      },
    );

    it(
      "rechaza múltiples Public ID en el mismo enlace",
      () => {
        expect(
          parseCatalogPdfLink(
            "id=PUB123&id=PUB456",
          ),
        ).toMatchObject({
          ok:
            false,

          errors:
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "CONFLICTING_PARAMETER",

                parameter:
                  "id",
              }),
            ]),
        });
      },
    );

    it.each([
      "id=PUB123&v=1",
      "id=PUB123&v=2",
      "id=PUB123&cat=flores",
      "id=PUB123&cpg=navidad",
      "id=PUB123&cats=flores,peluches",
      "id=PUB123&cpgs=navidad,premium",
    ])(
      "rechaza mezcla Public ID con otro contrato: %s",
      (query) => {
        expect(
          parseCatalogPdfLink(
            query,
          ),
        ).toMatchObject({
          ok:
            false,

          errors:
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "CONFLICTING_PARAMETER",
              }),
            ]),
        });
      },
    );

    it(
      "mantiene diagnóstico de parámetros desconocidos",
      () => {
        expect(
          parseCatalogPdfLink(
            "id=PUB123&extra=valor",
          ),
        ).toEqual({
          ok:
            true,

          contract: {
            publicId:
              "PUB123",
          },

          warnings: [
            {
              code:
                "UNKNOWN_PARAMETER",

              parameter:
                "extra",

              message:
                'El parámetro desconocido "extra" será ignorado.',
            },
          ],
        });
      },
    );
  },
);
