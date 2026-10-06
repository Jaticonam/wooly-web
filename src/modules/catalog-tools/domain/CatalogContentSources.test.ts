import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  createCatalogContentSourcesComposition,
  hasCatalogContentSources,
  mergeCatalogContentProductIds,
  setCatalogContentCampaignIds,
  setCatalogContentCategoryIds,
  setCatalogContentProductOverrides,
  usesCatalogContentSources,
} from "./CatalogContentSources";

describe(
  "CatalogContentSources",
  () => {
    it(
      "crea una composición V2 union e inicialmente vacía",
      () => {
        const composition =
          createCatalogContentSourcesComposition();

        expect(
          composition.mode,
        ).toBe(
          "hybrid",
        );

        expect(
          composition.filters
            .sourceOperator,
        ).toBe(
          "union",
        );

        expect(
          hasCatalogContentSources(
            composition,
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "normaliza productos provenientes del Product Explorer",
      () => {
        const composition =
          createCatalogContentSourcesComposition([
            "P-001",
            " P-002 ",
            "P-001",
            "",
          ]);

        expect(
          composition.overrides
            .includedProductIds,
        ).toEqual([
          "P-001",
          "P-002",
        ]);
      },
    );

    it(
      "agregar categorías preserva campañas y productos",
      () => {
        const base =
          createCatalogContentSourcesComposition([
            "P-001",
          ]);

        const withCampaign =
          setCatalogContentCampaignIds(
            base,
            [
              "cyber",
            ],
          );

        const result =
          setCatalogContentCategoryIds(
            withCampaign,
            [
              "flores",
            ],
          );

        expect(
          result.filters,
        ).toMatchObject({
          sourceOperator:
            "union",

          categoryIds: [
            "flores",
          ],

          campaignIds: [
            "cyber",
          ],
        });

        expect(
          result.overrides
            .includedProductIds,
        ).toEqual([
          "P-001",
        ]);
      },
    );

    it(
      "agregar campañas preserva categorías y productos",
      () => {
        const base =
          createCatalogContentSourcesComposition([
            "P-001",
          ]);

        const withCategory =
          setCatalogContentCategoryIds(
            base,
            [
              "flores",
            ],
          );

        const result =
          setCatalogContentCampaignIds(
            withCategory,
            [
              "cyber",
            ],
          );

        expect(
          result.filters
            .categoryIds,
        ).toEqual([
          "flores",
        ]);

        expect(
          result.filters
            .campaignIds,
        ).toEqual([
          "cyber",
        ]);

        expect(
          result.overrides
            .includedProductIds,
        ).toEqual([
          "P-001",
        ]);
      },
    );

    it(
      "el handoff agrega productos sin borrar fuentes existentes",
      () => {
        let composition =
          createCatalogContentSourcesComposition();

        composition =
          setCatalogContentCategoryIds(
            composition,
            [
              "flores",
            ],
          );

        composition =
          setCatalogContentCampaignIds(
            composition,
            [
              "cyber",
            ],
          );

        const result =
          mergeCatalogContentProductIds(
            composition,
            [
              "P-001",
              "P-001",
              "P-002",
            ],
          );

        expect(
          result.filters
            .categoryIds,
        ).toEqual([
          "flores",
        ]);

        expect(
          result.filters
            .campaignIds,
        ).toEqual([
          "cyber",
        ]);

        expect(
          result.overrides
            .includedProductIds,
        ).toEqual([
          "P-001",
          "P-002",
        ]);
      },
    );

    it(
      "editar una composición histórica activa la semántica union",
      () => {
        const legacy =
          createEmptyCatalogComposition(
            "automatic",
          );

        legacy.filters
          .categoryIds = [
            "flores",
          ];

        expect(
          usesCatalogContentSources(
            legacy,
          ),
        ).toBe(
          false,
        );

        const migrated =
          setCatalogContentCampaignIds(
            legacy,
            [
              "cyber",
            ],
          );

        expect(
          migrated.mode,
        ).toBe(
          "hybrid",
        );

        expect(
          migrated.filters
            .sourceOperator,
        ).toBe(
          "union",
        );

        expect(
          migrated.filters
            .categoryIds,
        ).toEqual([
          "flores",
        ]);
      },
    );
  },
);
describe(
  "CatalogContentSources Draft Compatibility V2",
  () => {
    const createLegacy =
      () => {
        const composition =
          createEmptyCatalogComposition(
            "automatic",
          );

        composition.filters
          .categoryIds = [
            "flores",
          ];

        composition.filters
          .campaignIds = [
            "campana-base",
          ];

        composition.filters
          .sourceOperator =
            "intersection";

        return composition;
      };

    it(
      "migra categoría legacy a union solo cuando cambia realmente",
      () => {
        const legacy =
          createLegacy();

        const result =
          setCatalogContentCategoryIds(
            legacy,
            [
              "flores",
              "peluches",
            ],
          );

        expect(
          result.mode,
        ).toBe(
          "hybrid",
        );

        expect(
          result.filters
            .sourceOperator,
        ).toBe(
          "union",
        );

        expect(
          result.filters
            .campaignIds,
        ).toEqual([
          "campana-base",
        ]);
      },
    );

    it(
      "set category equivalente es no-op semántico sobre legacy",
      () => {
        const legacy =
          createLegacy();

        const result =
          setCatalogContentCategoryIds(
            legacy,
            [
              " flores ",
              "flores",
            ],
          );

        expect(
          result,
        ).toBe(
          legacy,
        );

        expect(
          result.filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );
      },
    );

    it(
      "migra campaña legacy a union solo cuando cambia realmente",
      () => {
        const legacy =
          createLegacy();

        const result =
          setCatalogContentCampaignIds(
            legacy,
            [
              "campana-base",
              "cyber",
            ],
          );

        expect(
          result.mode,
        ).toBe(
          "hybrid",
        );

        expect(
          result.filters
            .sourceOperator,
        ).toBe(
          "union",
        );

        expect(
          result.filters
            .categoryIds,
        ).toEqual([
          "flores",
        ]);
      },
    );

    it(
      "set campaign equivalente es no-op semántico sobre legacy",
      () => {
        const legacy =
          createLegacy();

        const result =
          setCatalogContentCampaignIds(
            legacy,
            [
              "campana-base",
            ],
          );

        expect(
          result,
        ).toBe(
          legacy,
        );

        expect(
          result.filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );
      },
    );

    it(
      "merge de producto nuevo migra legacy a union",
      () => {
        const legacy =
          createLegacy();

        const result =
          mergeCatalogContentProductIds(
            legacy,
            [
              "P-001",
            ],
          );

        expect(
          result.filters
            .sourceOperator,
        ).toBe(
          "union",
        );

        expect(
          result.overrides
            .includedProductIds,
        ).toEqual([
          "P-001",
        ]);
      },
    );

    it(
      "merge vacío es no-op semántico sobre legacy",
      () => {
        const legacy =
          createLegacy();

        const result =
          mergeCatalogContentProductIds(
            legacy,
            [],
          );

        expect(
          result,
        ).toBe(
          legacy,
        );

        expect(
          result.filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );
      },
    );

    it(
      "merge de producto ya incluido no migra legacy",
      () => {
        const legacy =
          createLegacy();

        legacy.overrides
          .includedProductIds = [
            "P-001",
          ];

        const result =
          mergeCatalogContentProductIds(
            legacy,
            [
              "P-001",
            ],
          );

        expect(
          result,
        ).toBe(
          legacy,
        );

        expect(
          result.filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );
      },
    );

    it(
      "product overrides reales migran legacy y preservan filtros y atributos",
      () => {
        const legacy =
          createLegacy();

        legacy.filters
          .attributes = {
            colors: [
              "rojo",
            ],

            tags: [
              "premium",
            ],
          };

        const result =
          setCatalogContentProductOverrides(
            legacy,
            [
              " P-001 ",
              "P-001",
            ],
            [
              " P-002 ",
            ],
          );

        expect(
          result,
        ).toMatchObject({
          mode:
            "hybrid",

          filters: {
            sourceOperator:
              "union",

            categoryIds: [
              "flores",
            ],

            campaignIds: [
              "campana-base",
            ],

            attributes: {
              colors: [
                "rojo",
              ],

              tags: [
                "premium",
              ],
            },
          },

          overrides: {
            includedProductIds: [
              "P-001",
            ],

            excludedProductIds: [
              "P-002",
            ],
          },
        });
      },
    );

    it(
      "product overrides idénticos no migran legacy",
      () => {
        const legacy =
          createLegacy();

        legacy.overrides
          .includedProductIds = [
            "P-001",
          ];

        legacy.overrides
          .excludedProductIds = [
            "P-002",
          ];

        const result =
          setCatalogContentProductOverrides(
            legacy,
            [
              "P-001",
            ],
            [
              "P-002",
            ],
          );

        expect(
          result,
        ).toBe(
          legacy,
        );

        expect(
          result.filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );
      },
    );

    it(
      "una composición union nunca retrocede por operaciones no-op",
      () => {
        const union =
          createCatalogContentSourcesComposition([
            "P-001",
          ]);

        const sameCategories =
          setCatalogContentCategoryIds(
            union,
            [],
          );

        const sameCampaigns =
          setCatalogContentCampaignIds(
            sameCategories,
            [],
          );

        const sameProducts =
          setCatalogContentProductOverrides(
            sameCampaigns,
            [
              "P-001",
            ],
            [],
          );

        expect(
          sameProducts.filters
            .sourceOperator,
        ).toBe(
          "union",
        );

        expect(
          sameProducts.mode,
        ).toBe(
          "hybrid",
        );
      },
    );
  },
);
