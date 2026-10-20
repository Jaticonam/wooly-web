export type SheetValidationIssueCode =
  | "MISSING_HEADER"
  | "DUPLICATE_HEADER"
  | "ROW_LENGTH_MISMATCH"
  | "EMPTY_REQUIRED_FIELD"
  | "INVALID_NUMBER"
  | "INVALID_DATE"
  | "DUPLICATE_ID"
  | "UNKNOWN_REFERENCE"
  | "INVALID_STATUS"
  | "INVALID_ROW"
  | "UNKNOWN_HEADER";

export interface SheetValidationIssue {
  code: SheetValidationIssueCode;
  source: string;
  row?: number;
  column?: string;
  value?: unknown;
  message: string;
}

export type SheetValidationResult<T> =
  | {
      ok: true;
      data: T;
      warnings: readonly SheetValidationIssue[];
      rejected: readonly SheetValidationIssue[];
    }
  | {
      ok: false;
      errors: readonly SheetValidationIssue[];
      warnings: readonly SheetValidationIssue[];
    };

export type SuccessfulSheetValidation<T> = Extract<
  SheetValidationResult<T>,
  { ok: true }
>;

export interface SheetHeaderSchema {
  required: readonly string[];
  optional: readonly string[];
  allowUnknown: boolean;
}

export interface ParsedSheetRow {
  row: number;
  values: readonly string[];
  data: Record<string, string>;
}

export interface ParsedSheetDocument {
  headers: readonly string[];
  rows: readonly ParsedSheetRow[];
}

export interface ParsedNumericField {
  raw: string | null;
  state: "missing" | "empty" | "invalid" | "valid";
  value: number | null;
}

export interface SheetProductTransport {
  row: number;
  raw: Record<string, string>;
  numeric: Readonly<
    Record<
      | "price_1"
      | "price_3"
      | "price_12"
      | "price_50"
      | "price_100"
      | "price_offer"
      | "stock"
      | "priority",
      ParsedNumericField
    >
  >;
}

export interface SheetCampaignTransport {
  row: number;
  raw: Record<string, string>;
  priority: ParsedNumericField;
}

export class SheetValidationError extends Error {
  readonly errors: readonly SheetValidationIssue[];
  readonly warnings: readonly SheetValidationIssue[];

  constructor(
    errors: readonly SheetValidationIssue[],
    warnings: readonly SheetValidationIssue[] = [],
  ) {
    super(errors[0]?.message ?? "La hoja no cumple el contrato esperado.");
    this.name = "SheetValidationError";
    this.errors = errors;
    this.warnings = warnings;
  }
}
