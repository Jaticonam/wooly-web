import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createCatalogWorkspaceHandoff,
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
  },
);
