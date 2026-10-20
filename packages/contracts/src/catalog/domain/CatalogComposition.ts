export type CatalogCompositionMode =
  | "automatic"
  | "hybrid"
  | "manual";

export type CatalogCompositionSourceOperator =
  | "intersection"
  | "union";

export interface CatalogCompositionAttributeFilters {
  /**
   * Reservado para una fase posterior.
   *
   * El Product productivo de Wooly todavía no expone
   * colores estructurados.
   */
  colors?: readonly string[];

  /**
   * Reservado para una fase posterior.
   *
   * El Product productivo de Wooly todavía no expone
   * tags comerciales estructurados.
   */
  tags?: readonly string[];
}

export interface CatalogCompositionFilters {
  /**
   * Semántica entre categorías y campañas.
   *
   * `intersection` conserva el comportamiento histórico:
   * categoría AND campaña.
   *
   * `union` representa Wooly Admin V2:
   * categorías ∪ campañas.
   *
   * Los borradores antiguos sin este campo se interpretan
   * como `intersection`.
   */
  sourceOperator?: CatalogCompositionSourceOperator;

  /**
   * OR dentro de la dimensión.
   *
   * Ejemplo:
   * ["flores", "peluches"]
   * = flores OR peluches.
   */
  categoryIds: readonly string[];

  /**
   * OR dentro de la dimensión.
   *
   * Ejemplo:
   * ["dia-novio", "flores-amarillas"]
   * = dia-novio OR flores-amarillas.
   */
  campaignIds: readonly string[];

  /**
   * Los grupos de atributos se incorporan al contrato
   * desde V3.1, pero no se resuelven hasta que Product
   * tenga campos estructurados compatibles.
   */
  attributes?: CatalogCompositionAttributeFilters;
}

export interface CatalogCompositionOverrides {
  /**
   * Productos agregados manualmente.
   *
   * Una inclusión manual tiene prioridad sobre filtros
   * automáticos y sobre una exclusión accidental del
   * mismo producto.
   */
  includedProductIds: readonly string[];

  /**
   * Productos retirados manualmente del resultado
   * automático.
   */
  excludedProductIds: readonly string[];
}

/**
 * Contrato de selección del Compositor Comercial V3.
 *
 * Las responsabilidades de presentación, Open Graph,
 * persistencia y publicación se incorporarán en fases
 * posteriores sin contaminar este núcleo de selección.
 */
export interface CatalogComposition {
  mode: CatalogCompositionMode;

  filters: CatalogCompositionFilters;

  overrides: CatalogCompositionOverrides;
}

const VALID_MODES:
  readonly CatalogCompositionMode[] =
[
  "automatic",
  "hybrid",
  "manual",
];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function sanitizeStringArray(
  value: unknown,
): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const result:
    string[] = [];

  const seen =
    new Set<string>();

  for (const candidate of value) {
    if (
      typeof candidate !==
        "string"
    ) {
      return null;
    }

    const normalized =
      candidate.trim();

    if (!normalized) {
      continue;
    }

    if (
      seen.has(
        normalized,
      )
    ) {
      continue;
    }

    seen.add(
      normalized,
    );

    result.push(
      normalized,
    );
  }

  return result;
}

/**
 * Sanitiza una composición proveniente de persistencia
 * o de cualquier frontera externa.
 *
 * La regla vive en el dominio de composición para que
 * drafts y publicaciones públicas compartan exactamente
 * la misma semántica.
 */
export function sanitizeCatalogComposition(
  value: unknown,
): CatalogComposition | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.mode !==
      "string" ||
    !VALID_MODES.includes(
      value.mode as CatalogCompositionMode,
    )
  ) {
    return null;
  }

  if (
    !isRecord(
      value.filters,
    ) ||
    !isRecord(
      value.overrides,
    )
  ) {
    return null;
  }

  const categoryIds =
    sanitizeStringArray(
      value.filters.categoryIds,
    );

  const campaignIds =
    sanitizeStringArray(
      value.filters.campaignIds,
    );

  const sourceOperator:
    CatalogCompositionSourceOperator |
    null =
      value.filters.sourceOperator ===
        undefined
        ? "intersection"
        : value.filters.sourceOperator ===
              "intersection" ||
            value.filters.sourceOperator ===
              "union"
          ? value.filters.sourceOperator
          : null;

  const includedProductIds =
    sanitizeStringArray(
      value.overrides
        .includedProductIds,
    );

  const excludedProductIds =
    sanitizeStringArray(
      value.overrides
        .excludedProductIds,
    );

  if (
    categoryIds ===
      null ||
    campaignIds ===
      null ||
    sourceOperator ===
      null ||
    includedProductIds ===
      null ||
    excludedProductIds ===
      null
  ) {
    return null;
  }

  let colors:
    string[] = [];

  let tags:
    string[] = [];

  if (
    value.filters.attributes !==
      undefined
  ) {
    if (
      !isRecord(
        value.filters.attributes,
      )
    ) {
      return null;
    }

    const parsedColors =
      sanitizeStringArray(
        value.filters.attributes
          .colors ??
          [],
      );

    const parsedTags =
      sanitizeStringArray(
        value.filters.attributes
          .tags ??
          [],
      );

    if (
      parsedColors ===
        null ||
      parsedTags ===
        null
    ) {
      return null;
    }

    colors =
      parsedColors;

    tags =
      parsedTags;
  }

  return {
    mode:
      value.mode as CatalogCompositionMode,

    filters: {
      categoryIds,
      campaignIds,
      sourceOperator,

      attributes: {
        colors,
        tags,
      },
    },

    overrides: {
      includedProductIds,
      excludedProductIds,
    },
  };
}

export const createEmptyCatalogComposition = (
  mode: CatalogCompositionMode = "automatic",
): CatalogComposition => ({
  mode,

  filters: {
    categoryIds: [],
    campaignIds: [],
    sourceOperator:
      "intersection",
    attributes: {
      colors: [],
      tags: [],
    },
  },

  overrides: {
    includedProductIds: [],
    excludedProductIds: [],
  },
});
