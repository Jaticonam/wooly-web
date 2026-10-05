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