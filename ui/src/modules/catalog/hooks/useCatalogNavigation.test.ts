import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isCatalogCategory,
  readCatalogNavigation,
} from "./useCatalogNavigation";

describe("catalog navigation", () => {
  it("lee categoría y campaña desde la URL", () => {
    expect(
      readCatalogNavigation(
        "?cat=flores&cpg=madre",
      ),
    ).toEqual({
      category: "flores",
      campaign: "madre",
    });
  });

  it("normaliza una categoría desconocida sin perder la campaña", () => {
    expect(
      readCatalogNavigation(
        "?cat=desconocida&cpg=madre",
      ),
    ).toEqual({
      category: "todas",
      campaign: "madre",
    });
  });

  it("reconoce únicamente categorías canónicas", () => {
    expect(isCatalogCategory("todas")).toBe(true);
    expect(isCatalogCategory("flores")).toBe(true);
    expect(
      isCatalogCategory("desconocida"),
    ).toBe(false);
  });
});
