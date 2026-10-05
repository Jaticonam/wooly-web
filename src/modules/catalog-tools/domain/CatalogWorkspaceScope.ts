import type {
  CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

export type CatalogWorkspaceScope =
  | "all"
  | "category"
  | "campaign"
  | "custom";

export interface CatalogWorkspaceScopeOption {
  id: CatalogWorkspaceScope;
  label: string;
  description: string;
}

export const CATALOG_WORKSPACE_SCOPE_OPTIONS:
  readonly CatalogWorkspaceScopeOption[] = [
    {
      id: "all",
      label: "Todos",
      description:
        "Todo el catálogo publicable",
    },
    {
      id: "category",
      label: "Categoría",
      description:
        "Una o varias categorías",
    },
    {
      id: "campaign",
      label: "Campaña",
      description:
        "Productos de campañas",
    },
    {
      id: "custom",
      label: "Personalizado",
      description:
        "Selección específica",
    },
  ];

export const resolveCatalogWorkspaceScope = (
  composition: CatalogComposition,
): CatalogWorkspaceScope => {
  if (
    composition.mode ===
    "manual"
  ) {
    return "custom";
  }

  if (
    composition.filters
      .categoryIds.length >
    0
  ) {
    return "category";
  }

  if (
    composition.filters
      .campaignIds.length >
    0
  ) {
    return "campaign";
  }

  if (
    composition.mode ===
    "hybrid"
  ) {
    return "custom";
  }

  return "all";
};

export const applyCatalogWorkspaceScope = (
  composition: CatalogComposition,
  scope: CatalogWorkspaceScope,
  customProductIds:
    readonly string[] = [],
): CatalogComposition => {
  if (
    scope ===
    "custom"
  ) {
    return {
      ...composition,

      mode:
        "manual",

      filters: {
        ...composition.filters,
        categoryIds: [],
        campaignIds: [],
      },

      overrides: {
        includedProductIds:
          [...customProductIds],

        excludedProductIds:
          [],
      },
    };
  }

  if (
    scope ===
    "category"
  ) {
    return {
      ...composition,

      mode:
        "automatic",

      filters: {
        ...composition.filters,
        campaignIds: [],
      },

      overrides: {
        includedProductIds: [],
        excludedProductIds: [],
      },
    };
  }

  if (
    scope ===
    "campaign"
  ) {
    return {
      ...composition,

      mode:
        "automatic",

      filters: {
        ...composition.filters,
        categoryIds: [],
      },

      overrides: {
        includedProductIds: [],
        excludedProductIds: [],
      },
    };
  }

  return {
    ...composition,

    mode:
      "automatic",

    filters: {
      ...composition.filters,
      categoryIds: [],
      campaignIds: [],
    },

    overrides: {
      includedProductIds: [],
      excludedProductIds: [],
    },
  };
};
