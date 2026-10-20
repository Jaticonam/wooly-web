import type {
  CatalogCategoryContract,
} from "./CategoryContract";

export type CatalogCategoryContractIssueCode =
  | "INVALID_OBJECT"
  | "EMPTY_FIELD"
  | "INVALID_FIELD_TYPE"
  | "INVALID_PRIORITY"
  | "INVALID_PUBLICATION_STATUS";

export interface CatalogCategoryContractIssue {
  code: CatalogCategoryContractIssueCode;
  path: string;
  message: string;
  value?: unknown;
}

export type CatalogCategoryContractValidationResult =
  | {
      ok: true;
      data: CatalogCategoryContract;
    }
  | {
      ok: false;
      errors:
        readonly CatalogCategoryContractIssue[];
    };

const CATEGORY_PUBLICATION_STATUSES =
  new Set<
    CatalogCategoryContract[
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
    CatalogCategoryContractIssue[],
  code:
    CatalogCategoryContractIssueCode,
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
    CatalogCategoryContractIssue[],
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
    CatalogCategoryContractIssue[],
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

export function validateCatalogCategoryContractV1(
  value: unknown,
): CatalogCategoryContractValidationResult {
  const errors:
    CatalogCategoryContractIssue[] = [];

  if (!isRecord(value)) {
    return {
      ok: false,
      errors: [{
        code: "INVALID_OBJECT",
        path: "",
        message:
          "La categoría debe ser un objeto.",
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
    !CATEGORY_PUBLICATION_STATUSES.has(
      value.publicationStatus as
        CatalogCategoryContract[
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
      priority:
        value.priority as number,
      publicationStatus:
        value.publicationStatus as
          CatalogCategoryContract[
            "publicationStatus"
          ],
    },
  };
}