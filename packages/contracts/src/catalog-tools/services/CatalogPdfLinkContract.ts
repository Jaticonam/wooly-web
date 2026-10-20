export const CATALOG_PDF_LINK_VERSION_V1 =
  "1" as const;

export const CATALOG_PDF_LINK_VERSION_V2 =
  "2" as const;

/**
 * Alias histórico.
 *
 * El builder V1 productivo continúa dependiendo de este
 * nombre. Se conserva apuntando exclusivamente a V1.
 */
export const CATALOG_PDF_LINK_VERSION =
  CATALOG_PDF_LINK_VERSION_V1;

export interface CatalogPdfLinkContractV1 {
  version:
    typeof CATALOG_PDF_LINK_VERSION_V1;

  categoryId?:
    string;

  campaignId?:
    string;

  /**
   * Mantiene acceso estructural seguro desde consumidores
   * V1 mientras convive con los contratos posteriores.
   */
  categoryIds?:
    never;

  campaignIds?:
    never;

  publicId?:
    never;
}

export interface CatalogPdfLinkContractV2 {
  version:
    typeof CATALOG_PDF_LINK_VERSION_V2;

  categoryIds:
    readonly string[];

  campaignIds:
    readonly string[];

  /**
   * V2 utiliza exclusivamente cats/cpgs.
   */
  categoryId?:
    never;

  campaignId?:
    never;

  publicId?:
    never;
}

/**
 * Catálogo publicado mediante identidad pública.
 *
 * No utiliza v=1 ni v=2 porque el Public ID identifica
 * una publicación persistida, no una combinación de
 * filtros transportada por la URL.
 */
export interface CatalogPdfLinkContractPublicId {
  publicId:
    string;

  version?:
    never;

  categoryId?:
    never;

  campaignId?:
    never;

  categoryIds?:
    never;

  campaignIds?:
    never;
}

export type CatalogPdfLinkContract =
  | CatalogPdfLinkContractV1
  | CatalogPdfLinkContractV2
  | CatalogPdfLinkContractPublicId;

export type PdfLinkIssueCode =
  | "UNSUPPORTED_VERSION"
  | "INVALID_CATEGORY_ID"
  | "INVALID_CAMPAIGN_ID"
  | "INVALID_PUBLIC_ID"
  | "LEGACY_PARAMETER_USED"
  | "CONFLICTING_PARAMETER"
  | "UNKNOWN_PARAMETER";

export interface PdfLinkIssue {
  code:
    PdfLinkIssueCode;

  parameter?:
    string;

  message:
    string;
}

export type CatalogPdfLinkParseResult =
  | {
      ok:
        true;

      contract:
        CatalogPdfLinkContract;

      warnings:
        readonly PdfLinkIssue[];
    }
  | {
      ok:
        false;

      errors:
        readonly PdfLinkIssue[];
    };

const ID_PATTERN =
  /^[\p{L}\p{N}._-]+$/u;

const MAX_ID_LENGTH =
  100;

const V1_PARAMETERS =
  [
    "cat",
    "cpg",
    "categoria",
    "category",
    "campania",
    "campaign",
  ] as const;

const V2_PARAMETERS =
  [
    "cats",
    "cpgs",
  ] as const;

function clean(
  value:
    string | null,
): string {
  return String(
    value ?? "",
  )
    .trim()
    .toLowerCase();
}

function cleanPublicId(
  value:
    string | null,
): string {
  /**
   * Public ID no se fuerza a lower-case.
   *
   * La futura capa persistente será responsable de
   * decidir si sus identificadores son case-sensitive.
   * El contrato web no debe destruir esa información.
   */
  return String(
    value ?? "",
  ).trim();
}

function validatedId(
  value:
    string,

  kind:
    "category" |
    "campaign",

  parameter:
    string,
): PdfLinkIssue | null {
  if (
    value.length >
      MAX_ID_LENGTH ||
    !ID_PATTERN.test(
      value,
    )
  ) {
    return {
      code:
        kind ===
        "category"
          ? "INVALID_CATEGORY_ID"
          : "INVALID_CAMPAIGN_ID",

      parameter,

      message:
        `El ID de ${
          kind ===
          "category"
            ? "categoría"
            : "campaña"
        } no es válido.`,
    };
  }

  return null;
}

function validatedPublicId(
  value:
    string,
): PdfLinkIssue | null {
  if (
    !value ||
    value.length >
      MAX_ID_LENGTH ||
    !ID_PATTERN.test(
      value,
    )
  ) {
    return {
      code:
        "INVALID_PUBLIC_ID",

      parameter:
        "id",

      message:
        "El Public ID del catálogo no es válido.",
    };
  }

  return null;
}

function resolveParameter(
  params:
    URLSearchParams,

  canonical:
    string,

  aliases:
    readonly string[],

  warnings:
    PdfLinkIssue[],

  errors:
    PdfLinkIssue[],
): string {
  const candidates =
    [
      [
        canonical,
        clean(
          params.get(
            canonical,
          ),
        ),
      ],

      ...aliases.map(
        (alias) =>
          [
            alias,
            clean(
              params.get(
                alias,
              ),
            ),
          ] as const,
      ),
    ] as const;

  const present =
    candidates.filter(
      (
        [
          ,
          value,
        ],
      ) =>
        value,
    );

  const values =
    new Set(
      present.map(
        (
          [
            ,
            value,
          ],
        ) =>
          value,
      ),
    );

  for (
    const [
      parameter,
    ] of present
  ) {
    if (
      parameter !==
      canonical
    ) {
      warnings.push({
        code:
          "LEGACY_PARAMETER_USED",

        parameter,

        message:
          `Se utilizó el parámetro legacy "${parameter}".`,
      });
    }
  }

  if (
    values.size >
    1
  ) {
    errors.push({
      code:
        "CONFLICTING_PARAMETER",

      parameter:
        canonical,

      message:
        `Existen valores en conflicto para "${canonical}".`,
    });
  }

  return (
    present[0]?.[1] ??
    ""
  );
}

function parseIdList(
  params:
    URLSearchParams,

  parameter:
    "cats" |
    "cpgs",

  kind:
    "category" |
    "campaign",

  errors:
    PdfLinkIssue[],
): string[] {
  const raw =
    clean(
      params.get(
        parameter,
      ),
    );

  if (!raw) {
    return [];
  }

  const values =
    raw
      .split(",")
      .map(
        (value) =>
          clean(
            value,
          ),
      )
      .filter(
        Boolean,
      );

  const uniqueValues =
    Array.from(
      new Set(
        values,
      ),
    )
      .sort();

  uniqueValues.forEach(
    (value) => {
      const issue =
        validatedId(
          value,
          kind,
          parameter,
        );

      if (issue) {
        errors.push(
          issue,
        );
      }
    },
  );

  return uniqueValues;
}

function addParameterConflict(
  errors:
    PdfLinkIssue[],

  parameter:
    string,

  version:
    "1" |
    "2",
) {
  errors.push({
    code:
      "CONFLICTING_PARAMETER",

    parameter,

    message:
      `El parámetro "${parameter}" no pertenece al contrato PDF v${version}.`,
  });
}

function addPublicIdParameterConflict(
  errors:
    PdfLinkIssue[],

  parameter:
    string,
) {
  errors.push({
    code:
      "CONFLICTING_PARAMETER",

    parameter,

    message:
      `El parámetro "${parameter}" no puede combinarse con Public ID.`,
  });
}

export function parseCatalogPdfLink(
  input:
    URLSearchParams |
    string,
): CatalogPdfLinkParseResult {
  const params =
    typeof input ===
    "string"
      ? new URLSearchParams(
          input.startsWith(
            "?",
          )
            ? input.slice(
                1,
              )
            : input,
        )
      : input;

  const warnings:
    PdfLinkIssue[] =
      [];

  const errors:
    PdfLinkIssue[] =
      [];

  const knownParameters =
    new Set([
      "v",
      "id",
      ...V1_PARAMETERS,
      ...V2_PARAMETERS,
    ]);

  for (
    const parameter of
    params.keys()
  ) {
    if (
      !knownParameters.has(
        parameter,
      )
    ) {
      warnings.push({
        code:
          "UNKNOWN_PARAMETER",

        parameter,

        message:
          `El parámetro desconocido "${parameter}" será ignorado.`,
      });
    }
  }

  /**
   * Public ID tiene precedencia estructural.
   *
   * Si aparece "id", el enlace deja de pertenecer a V1/V2.
   * Cualquier mezcla con filtros o versión es rechazada.
   */
  const publicIdValues =
    params.getAll(
      "id",
    );

  if (
    publicIdValues.length >
    0
  ) {
    const publicId =
      cleanPublicId(
        publicIdValues[0] ??
          "",
      );

    if (
      publicIdValues.length !==
      1
    ) {
      errors.push({
        code:
          "CONFLICTING_PARAMETER",

        parameter:
          "id",

        message:
          "El enlace contiene más de un Public ID.",
      });
    }

    const publicIdIssue =
      validatedPublicId(
        publicId,
      );

    if (
      publicIdIssue
    ) {
      errors.push(
        publicIdIssue,
      );
    }

    [
      "v",
      ...V1_PARAMETERS,
      ...V2_PARAMETERS,
    ].forEach(
      (parameter) => {
        if (
          params.has(
            parameter,
          )
        ) {
          addPublicIdParameterConflict(
            errors,
            parameter,
          );
        }
      },
    );

    if (
      errors.length >
      0
    ) {
      return {
        ok:
          false,

        errors,
      };
    }

    return {
      ok:
        true,

      contract: {
        publicId,
      },

      warnings,
    };
  }

  const requestedVersion =
    clean(
      params.get(
        "v",
      ),
    );

  if (
    requestedVersion &&
    requestedVersion !==
      CATALOG_PDF_LINK_VERSION_V1 &&
    requestedVersion !==
      CATALOG_PDF_LINK_VERSION_V2
  ) {
    return {
      ok:
        false,

      errors: [
        {
          code:
            "UNSUPPORTED_VERSION",

          parameter:
            "v",

          message:
            "La versión del enlace PDF no es compatible.",
        },
      ],
    };
  }

  const version =
    requestedVersion ===
    CATALOG_PDF_LINK_VERSION_V2
      ? CATALOG_PDF_LINK_VERSION_V2
      : CATALOG_PDF_LINK_VERSION_V1;

  if (
    version ===
    CATALOG_PDF_LINK_VERSION_V2
  ) {
    V1_PARAMETERS.forEach(
      (parameter) => {
        if (
          params.has(
            parameter,
          )
        ) {
          addParameterConflict(
            errors,
            parameter,
            "2",
          );
        }
      },
    );

    const categoryIds =
      parseIdList(
        params,
        "cats",
        "category",
        errors,
      );

    const campaignIds =
      parseIdList(
        params,
        "cpgs",
        "campaign",
        errors,
      );

    if (
      errors.length >
      0
    ) {
      return {
        ok:
          false,

        errors,
      };
    }

    return {
      ok:
        true,

      contract: {
        version:
          CATALOG_PDF_LINK_VERSION_V2,

        categoryIds,

        campaignIds,
      },

      warnings,
    };
  }

  V2_PARAMETERS.forEach(
    (parameter) => {
      if (
        params.has(
          parameter,
        )
      ) {
        addParameterConflict(
          errors,
          parameter,
          "1",
        );
      }
    },
  );

  const categoryId =
    resolveParameter(
      params,
      "cat",
      [
        "categoria",
        "category",
      ],
      warnings,
      errors,
    );

  const campaignId =
    resolveParameter(
      params,
      "cpg",
      [
        "campania",
        "campaign",
      ],
      warnings,
      errors,
    );

  if (
    categoryId &&
    categoryId !==
      "todas"
  ) {
    const categoryIssue =
      validatedId(
        categoryId,
        "category",
        "cat",
      );

    if (
      categoryIssue
    ) {
      errors.push(
        categoryIssue,
      );
    }
  }

  if (
    campaignId
  ) {
    const campaignIssue =
      validatedId(
        campaignId,
        "campaign",
        "cpg",
      );

    if (
      campaignIssue
    ) {
      errors.push(
        campaignIssue,
      );
    }
  }

  if (
    errors.length >
    0
  ) {
    return {
      ok:
        false,

      errors,
    };
  }

  return {
    ok:
      true,

    contract: {
      version:
        CATALOG_PDF_LINK_VERSION_V1,

      ...(categoryId &&
      categoryId !==
        "todas"
        ? {
            categoryId,
          }
        : {}),

      ...(campaignId
        ? {
            campaignId,
          }
        : {}),
    },

    warnings,
  };
}
