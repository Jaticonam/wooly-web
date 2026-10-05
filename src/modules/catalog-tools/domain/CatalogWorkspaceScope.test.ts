import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  applyCatalogWorkspaceScope,
  resolveCatalogWorkspaceScope,
} from "./CatalogWorkspaceScope";

describe(
  "CatalogWorkspaceScope",
  () => {
    it(
      "resuelve Todos desde composición automática vacía",
      () => {
        const composition =
          createEmptyCatalogComposition(
            "automatic",
          );

        expect(
          resolveCatalogWorkspaceScope(
            composition,
          ),
        ).toBe(
          "all",
        );
      },
    );

    it(
      "resuelve Categoría cuando existe filtro de categoría",
      () => {
        const composition = {
          ...createEmptyCatalogComposition(
            "automatic",
          ),

          filters: {
            categoryIds: [
              "flores",
            ],
            campaignIds: [],
          },
        };

        expect(
          resolveCatalogWorkspaceScope(
            composition,
          ),
        ).toBe(
          "category",
        );
      },
    );

    it(
      "resuelve Campaña cuando existe filtro de campaña",
      () => {
        const composition = {
          ...createEmptyCatalogComposition(
            "automatic",
          ),

          filters: {
            categoryIds: [],
            campaignIds: [
              "madre",
            ],
          },
        };

        expect(
          resolveCatalogWorkspaceScope(
            composition,
          ),
        ).toBe(
          "campaign",
        );
      },
    );

    it(
      "resuelve Personalizado desde modo manual",
      () => {
        const composition =
          createEmptyCatalogComposition(
            "manual",
          );

        expect(
          resolveCatalogWorkspaceScope(
            composition,
          ),
        ).toBe(
          "custom",
        );
      },
    );

    it(
      "no mezcla overrides manuales dentro de alcances automáticos",
      () => {
        const manual = {
          ...createEmptyCatalogComposition(
            "manual",
          ),

          overrides: {
            includedProductIds: [
              "A",
              "B",
            ],
            excludedProductIds: [
              "C",
            ],
          },
        };

        const category =
          applyCatalogWorkspaceScope(
            manual,
            "category",
          );

        expect(
          category.mode,
        ).toBe(
          "automatic",
        );

        expect(
          category.overrides,
        ).toEqual({
          includedProductIds: [],
          excludedProductIds: [],
        });
      },
    );

    it(
      "restaura productos personalizados cuando se proporcionan",
      () => {
        const automatic =
          createEmptyCatalogComposition(
            "automatic",
          );

        const custom =
          applyCatalogWorkspaceScope(
            automatic,
            "custom",
            [
              "A",
              "B",
            ],
          );

        expect(
          custom.mode,
        ).toBe(
          "manual",
        );

        expect(
          custom.overrides
            .includedProductIds,
        ).toEqual([
          "A",
          "B",
        ]);
      },
    );
  },
);
