import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildCategoryCampaignRoute,
  buildCategoryCatalogRoute,
} from "./CategoryCatalogNavigation";

describe(
  "CategoryCatalogNavigation",
  () => {
    it(
      "mantiene una ruta dedicada para categorías y vuelve al catálogo en Todas",
      () => {
        expect(
          buildCategoryCatalogRoute(
            "flores",
          ),
        ).toBe(
          "/catalogo/categoria.html?cat=flores",
        );

        expect(
          buildCategoryCatalogRoute(
            "todas",
          ),
        ).toBe(
          "/catalogo",
        );
      },
    );

    it(
      "envía combinaciones categoría + campaña al catálogo V2",
      () => {
        expect(
          buildCategoryCampaignRoute(
            "flores",
            "cyber-wooly",
          ),
        ).toBe(
          "/catalogo?cat=flores&cpg=cyber-wooly",
        );

        expect(
          buildCategoryCampaignRoute(
            "todas",
            "cyber-wooly",
          ),
        ).toBe(
          "/catalogo?cpg=cyber-wooly",
        );
      },
    );
  },
);
