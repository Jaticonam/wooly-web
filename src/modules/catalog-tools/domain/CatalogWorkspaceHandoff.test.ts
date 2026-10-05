import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createCatalogWorkspaceHandoff,
  createManualCatalogComposition,
  parseCatalogWorkspaceHandoff,
} from "./CatalogWorkspaceHandoff";

describe(
  "CatalogWorkspaceHandoff",
  () => {
    it(
      "normaliza y deduplica la selección del Product Explorer",
      () => {
        expect(
          createCatalogWorkspaceHandoff([
            "CT-001",
            " CT-002 ",
            "CT-001",
            "",
          ]),
        ).toEqual({
          version: 1,
          source:
            "product-explorer",
          productIds: [
            "CT-001",
            "CT-002",
          ],
        });
      },
    );

    it(
      "rechaza estados de navegación ajenos",
      () => {
        expect(
          parseCatalogWorkspaceHandoff(
            null,
          ),
        ).toBeNull();

        expect(
          parseCatalogWorkspaceHandoff({
            version: 99,
            source:
              "product-explorer",
            productIds: [
              "CT-001",
            ],
          }),
        ).toBeNull();
      },
    );

    it(
      "convierte el handoff en composición manual",
      () => {
        const composition =
          createManualCatalogComposition([
            "CT-001",
            "CT-002",
            "CT-001",
          ]);

        expect(
          composition.mode,
        ).toBe("manual");

        expect(
          composition.overrides
            .includedProductIds,
        ).toEqual([
          "CT-001",
          "CT-002",
        ]);

        expect(
          composition.overrides
            .excludedProductIds,
        ).toEqual([]);
      },
    );
  },
);
