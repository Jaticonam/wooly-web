import {
  describe,
  expect,
  it,
} from "vitest";

import {
  developmentContractFixtureCatalogProvider,
} from "./DevelopmentContractFixtureCatalogProvider";

describe(
  "DevelopmentContractFixtureCatalogProvider",
  () => {
    it(
      "expone la fuente contractual y categorías de arranque",
      () => {
        expect(
          developmentContractFixtureCatalogProvider
            .source,
        ).toBe(
          "contract-fixture",
        );

        expect(
          developmentContractFixtureCatalogProvider
            .getCategories()
            .length,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "carga dinámicamente el provider contractual en desarrollo",
      async () => {
        const categories =
          developmentContractFixtureCatalogProvider
            .getCategories();

        const campaigns =
          await developmentContractFixtureCatalogProvider
            .loadCampaigns();

        expect(
          Array.isArray(
            campaigns,
          ),
        ).toBe(
          true,
        );

        const products =
          await developmentContractFixtureCatalogProvider
            .loadCategoryProducts(
              categories[0],
              campaigns,
            );

        expect(
          Array.isArray(
            products,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "conserva el resultado detallado del provider cargado",
      async () => {
        const categories =
          developmentContractFixtureCatalogProvider
            .getCategories();

        const campaigns =
          await developmentContractFixtureCatalogProvider
            .loadCampaigns();

        const result =
          await developmentContractFixtureCatalogProvider
            .loadCategoryProductsDetailed?.(
              categories[0],
              campaigns,
            );

        expect(
          result,
        ).toBeDefined();

        expect(
          result?.source,
        ).toBe(
          "contract-fixture",
        );

        expect(
          Array.isArray(
            result?.data,
          ),
        ).toBe(
          true,
        );

        expect(
          Array.isArray(
            result?.issues,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
