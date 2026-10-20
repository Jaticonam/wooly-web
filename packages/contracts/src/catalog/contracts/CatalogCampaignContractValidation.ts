import type {
  CatalogCampaignContract,
} from "./CampaignContract";

export type CatalogCampaignContractIssueCode =
  | "INVALID_OBJECT"
  | "EMPTY_FIELD"
  | "INVALID_FIELD_TYPE"
  | "INVALID_DATE"
  | "INVALID_DATE_RANGE"
  | "INVALID_PRIORITY"
  | "INVALID_PUBLICATION_STATUS";

export interface CatalogCampaignContractIssue {
  code: CatalogCampaignContractIssueCode;
  path: string;
  message: string;
  value?: unknown;
}

export type CatalogCampaignContractValidationResult =
  | {
      ok: true;
      data: CatalogCampaignContract;
    }
  | {
      ok: false;
      errors:
        readonly CatalogCampaignContractIssue[];
    };

const CAMPAIGN_PUBLICATION_STATUSES =
  new Set<
    CatalogCampaignContract[
      "publicationStatus"
    ]
  >([
    "draft",
    "published",
    "hidden",
    "archived",
  ]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function pushIssue(
  errors:
    CatalogCampaignContractIssue[],
  code:
    CatalogCampaignContractIssueCode,
  path: string,
  message: string,
  value?: unknown,
): void {
  errors.push({
    code,
    path,
    message,
    value,
  });
}

function validateRequiredText(
  value: unknown,
  path: string,
  errors:
    CatalogCampaignContractIssue[],
): void {
  if (typeof value !== "string") {
    pushIssue(
      errors,
      "INVALID_FIELD_TYPE",
      path,
      `${path} debe ser texto.`,
      value,
    );
    return;
  }

  if (!value.trim()) {
    pushIssue(
      errors,
      "EMPTY_FIELD",
      path,
      `${path} no puede estar vacío.`,
      value,
    );
  }
}

function validateNullableText(
  value: unknown,
  path: string,
  errors:
    CatalogCampaignContractIssue[],
): void {
  if (value === null) {
    return;
  }

  if (typeof value !== "string") {
    pushIssue(
      errors,
      "INVALID_FIELD_TYPE",
      path,
      `${path} debe ser texto o null.`,
      value,
    );
    return;
  }

  if (!value.trim()) {
    pushIssue(
      errors,
      "EMPTY_FIELD",
      path,
      `${path} debe utilizar null en lugar de texto vacío.`,
      value,
    );
  }
}

function validateNullableDate(
  value: unknown,
  path: string,
  errors:
    CatalogCampaignContractIssue[],
): boolean {
  if (value === null) {
    return true;
  }

  if (
    typeof value !== "string" ||
    !value.trim() ||
    Number.isNaN(
      Date.parse(value),
    )
  ) {
    pushIssue(
      errors,
      "INVALID_DATE",
      path,
      `${path} debe ser una fecha válida o null.`,
      value,
    );
    return false;
  }

  return true;
}

export function validateCatalogCampaignContractV1(
  value: unknown,
): CatalogCampaignContractValidationResult {
  const errors:
    CatalogCampaignContractIssue[] = [];

  if (!isRecord(value)) {
    return {
      ok: false,
      errors: [{
        code: "INVALID_OBJECT",
        path: "",
        message:
          "La campaña debe ser un objeto.",
        value,
      }],
    };
  }

  validateRequiredText(
    value.id,
    "id",
    errors,
  );

  validateRequiredText(
    value.slug,
    "slug",
    errors,
  );

  validateRequiredText(
    value.name,
    "name",
    errors,
  );

  validateNullableText(
    value.icon,
    "icon",
    errors,
  );

  validateNullableText(
    value.color,
    "color",
    errors,
  );

  validateNullableText(
    value.themeToken,
    "themeToken",
    errors,
  );

  const startsAtValid =
    validateNullableDate(
      value.startsAt,
      "startsAt",
      errors,
    );

  const endsAtValid =
    validateNullableDate(
      value.endsAt,
      "endsAt",
      errors,
    );

  if (
    startsAtValid &&
    endsAtValid &&
    typeof value.startsAt === "string" &&
    typeof value.endsAt === "string" &&
    Date.parse(value.startsAt) >
      Date.parse(value.endsAt)
  ) {
    pushIssue(
      errors,
      "INVALID_DATE_RANGE",
      "endsAt",
      "endsAt no puede ser anterior a startsAt.",
      value.endsAt,
    );
  }

  if (
    typeof value.priority !== "number" ||
    !Number.isFinite(value.priority) ||
    !Number.isInteger(value.priority) ||
    value.priority < 0
  ) {
    pushIssue(
      errors,
      "INVALID_PRIORITY",
      "priority",
      "priority debe ser un entero mayor o igual a cero.",
      value.priority,
    );
  }

  if (
    typeof value.publicationStatus !==
      "string" ||
    !CAMPAIGN_PUBLICATION_STATUSES.has(
      value.publicationStatus as
        CatalogCampaignContract[
          "publicationStatus"
        ],
    )
  ) {
    pushIssue(
      errors,
      "INVALID_PUBLICATION_STATUS",
      "publicationStatus",
      "publicationStatus no es válido.",
      value.publicationStatus,
    );
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      id:
        value.id as string,
      slug:
        value.slug as string,
      name:
        value.name as string,
      icon:
        value.icon as string | null,
      color:
        value.color as string | null,
      themeToken:
        value.themeToken as
          string | null,
      startsAt:
        value.startsAt as
          string | null,
      endsAt:
        value.endsAt as
          string | null,
      priority:
        value.priority as number,
      publicationStatus:
        value.publicationStatus as
          CatalogCampaignContract[
            "publicationStatus"
          ],
    },
  };
}