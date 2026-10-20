import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateCatalogCategoryContractV1,
} from "./CatalogCategoryContractValidation";

function validCategory() {
  return {
    id: "flores",
    slug: "flores",
    name: "Flores",
    icon: "flower",
    priority: 100,
    publicationStatus:
      "published",
  };
}

describe(
  "CatalogCategoryContractValidation",
  () => {
    it(
      "acepta una categoría canónica válida",
      () => {
        const result =
          validateCatalogCategoryContractV1(
            validCategory(),
          );

        expect(result).toEqual({
          ok: true,
          data: validCategory(),
        });
      },
    );

    it(
      "rechaza valores que no son objetos",
      () => {
        const result =
          validateCatalogCategoryContractV1(
            null,
          );

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors[0]?.code,
          ).toBe("INVALID_OBJECT");
        }
      },
    );

    it(
      "rechaza identificadores vacíos",
      () => {
        const result =
          validateCatalogCategoryContractV1({
            ...validCategory(),
            id: "   ",
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code: "EMPTY_FIELD",
                path: "id",
              }),
            ]),
          );
        }
      },
    );

    it(
      "exige null para iconos ausentes",
      () => {
        const result =
          validateCatalogCategoryContractV1({
            ...validCategory(),
            icon: "",
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code: "EMPTY_FIELD",
                path: "icon",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza prioridades no enteras",
      () => {
        const result =
          validateCatalogCategoryContractV1({
            ...validCategory(),
            priority: 1.5,
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code: "INVALID_PRIORITY",
                path: "priority",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza estados desconocidos",
      () => {
        const result =
          validateCatalogCategoryContractV1({
            ...validCategory(),
            publicationStatus:
              "active",
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "INVALID_PUBLICATION_STATUS",
                path:
                  "publicationStatus",
              }),
            ]),
          );
        }
      },
    );
  },
);