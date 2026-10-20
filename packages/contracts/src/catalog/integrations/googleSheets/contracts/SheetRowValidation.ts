import {
  getCampaignComputedStatus,
  normalizeCampaignLookupKey,
  type CampaignNameToIdMap,
} from "../../../domain/CampaignRules";

import type {
  ParsedNumericField,
  ParsedSheetRow,
  SheetCampaignTransport,
  SheetProductTransport,
  SheetValidationIssue,
  SheetValidationResult,
} from "./SheetValidationTypes";

const PRODUCT_NUMBER_COLUMNS = [
  "price_1",
  "price_3",
  "price_12",
  "price_50",
  "price_100",
  "price_offer",
  "stock",
  "priority",
] as const;

const PRODUCT_STATUSES = new Set([
  "preventa",
  "publicado",
  "agotado",
  "borrador",
  "oculto",
]);

const CAMPAIGN_STATUSES = new Set([
  "publicado",
  "publicada",
  "publicadas",
  "active",
  "published",
  "oculto",
  "oculta",
  "hidden",
  "borrador",
  "draft",
]);

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function isCompletelyEmptyRow(
  row: ParsedSheetRow,
): boolean {
  return Object.values(row.data).every(
    (value) => !clean(value),
  );
}

export function parseSheetNumber(
  row: Record<string, string>,
  column: string,
): ParsedNumericField {
  if (!Object.prototype.hasOwnProperty.call(row, column)) {
    return { raw: null, state: "missing", value: null };
  }

  const raw = row[column] ?? "";
  let cleaned = clean(raw)
    .replace(/S\/\.?/gi, "")
    .replace(/\s/g, "");

  if (!cleaned) {
    return { raw, state: "empty", value: null };
  }

  cleaned =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.replace(/,/g, "")
      : cleaned.replace(",", ".");

  const value = Number(cleaned);

  return Number.isFinite(value)
    ? { raw, state: "valid", value }
    : { raw, state: "invalid", value: null };
}

function issue(
  code: SheetValidationIssue["code"],
  source: string,
  row: number,
  column: string,
  value: unknown,
  message: string,
): SheetValidationIssue {
  return { code, source, row, column, value, message };
}

function requiredTextIssues(
  row: ParsedSheetRow,
  source: string,
  columns: readonly string[],
): SheetValidationIssue[] {
  return columns.flatMap((column) =>
    clean(row.data[column])
      ? []
      : [
          issue(
            "EMPTY_REQUIRED_FIELD",
            source,
            row.row,
            column,
            row.data[column] ?? null,
            `La fila ${row.row} tiene "${column}" vacío.`,
          ),
        ],
  );
}

function numericWarnings(
  row: ParsedSheetRow,
  source: string,
  parsed: SheetProductTransport["numeric"],
): SheetValidationIssue[] {
  return PRODUCT_NUMBER_COLUMNS.flatMap((column) => {
    const field = parsed[column];
    if (field.state === "invalid") {
      return [
        issue(
          "INVALID_NUMBER",
          source,
          row.row,
          column,
          field.raw,
          `La fila ${row.row} contiene un número inválido en "${column}".`,
        ),
      ];
    }
    if (field.state === "valid" && field.value !== null && field.value < 0) {
      return [
        issue(
          "INVALID_NUMBER",
          source,
          row.row,
          column,
          field.raw,
          `La fila ${row.row} contiene un número negativo en "${column}".`,
        ),
      ];
    }

    return [];
  });
}

function campaignReferenceWarnings(
  row: ParsedSheetRow,
  source: string,
  campaignMap: CampaignNameToIdMap,
): SheetValidationIssue[] {
  const references = clean(row.data.campaigns)
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);
  const seen = new Set<string>();

  return references.flatMap((reference) => {
    const normalized = normalizeCampaignLookupKey(reference);
    if (seen.has(normalized)) {
      return [
        issue(
          "INVALID_ROW",
          source,
          row.row,
          "campaigns",
          reference,
          `La fila ${row.row} repite una referencia de campaña; se conservará una sola.`,
        ),
      ];
    }
    seen.add(normalized);
    return campaignMap[reference] || campaignMap[normalized]
      ? []
      : [
          issue(
            "UNKNOWN_REFERENCE",
            source,
            row.row,
            "campaigns",
            reference,
            `La fila ${row.row} referencia una campaña desconocida.`,
          ),
        ];
  });
}

function updatedAtWarnings(
  row: ParsedSheetRow,
  source: string,
): SheetValidationIssue[] {
  const value = clean(row.data.updated_at);
  return value && Number.isNaN(Date.parse(value))
    ? [
        issue(
          "INVALID_DATE",
          source,
          row.row,
          "updated_at",
          value,
          `La fila ${row.row} contiene updated_at inválido.`,
        ),
      ]
    : [];
}

export function validateProductRows(
  rows: readonly ParsedSheetRow[],
  source: string,
  campaignMap: CampaignNameToIdMap = {},
): SheetValidationResult<readonly SheetProductTransport[]> {
  const data: SheetProductTransport[] = [];
  const warnings: SheetValidationIssue[] = [];
  const rejected: SheetValidationIssue[] = [];
  const ids = new Set<string>();

  for (const row of rows) {
    if (isCompletelyEmptyRow(row)) {
      continue;
    }

    const rowErrors = requiredTextIssues(
      row,
      source,
      ["id", "title", "description", "price_1", "stock", "status"],
    );
    const id = clean(row.data.id);

    // Los IDs actuales se comparan como strings: trim sí; cambio de case, no.
    if (id && ids.has(id)) {
      rowErrors.push(
        issue(
          "DUPLICATE_ID",
          source,
          row.row,
          "id",
          id,
          `La fila ${row.row} repite un ID de producto.`,
        ),
      );
    }

    if (rowErrors.length) {
      rejected.push(...rowErrors);
      continue;
    }

    ids.add(id);
    const numeric = Object.fromEntries(
      PRODUCT_NUMBER_COLUMNS.map((column) => [
        column,
        parseSheetNumber(row.data, column),
      ]),
    ) as unknown as SheetProductTransport["numeric"];

    warnings.push(...numericWarnings(row, source, numeric));

    const status = clean(row.data.status).toLowerCase();
    if (!status || !PRODUCT_STATUSES.has(status)) {
      warnings.push(
        issue(
          "INVALID_STATUS",
          source,
          row.row,
          "status",
          row.data.status ?? null,
          `La fila ${row.row} contiene un estado de producto desconocido.`,
        ),
      );
    }

    warnings.push(
      ...updatedAtWarnings(row, source),
      ...campaignReferenceWarnings(row, source, campaignMap),
    );
    data.push({ row: row.row, raw: row.data, numeric });
  }

  return { ok: true, data, warnings, rejected };
}

function campaignDateWarnings(
  row: ParsedSheetRow,
  source: string,
): SheetValidationIssue[] {
  const publicationStatus = "publicado";
  const probe = (startDate: string, endDate: string) =>
    getCampaignComputedStatus(
      { startDate, endDate, publicationStatus },
      new Date("2026-01-15T12:00:00"),
    );
  const start = clean(row.data.startdate);
  const end = clean(row.data.enddate);
  const warnings: SheetValidationIssue[] = [];

  if (probe(start, "2999-12-31") === "borrador") {
    warnings.push(
      issue("INVALID_DATE", source, row.row, "startdate", start,
        `La fila ${row.row} contiene startDate inválida.`),
    );
  }
  if (probe("2000-01-01", end) === "borrador") {
    warnings.push(
      issue("INVALID_DATE", source, row.row, "enddate", end,
        `La fila ${row.row} contiene endDate inválida.`),
    );
  }
  if (
    !warnings.length &&
    probe(start, end) === "borrador"
  ) {
    warnings.push(
      issue("INVALID_DATE", source, row.row, "enddate", end,
        `La fila ${row.row} contiene un rango de fechas invertido.`),
    );
  }

  return warnings;
}

export function validateCampaignRows(
  rows: readonly ParsedSheetRow[],
  source: string,
): SheetValidationResult<readonly SheetCampaignTransport[]> {
  const data: SheetCampaignTransport[] = [];
  const warnings: SheetValidationIssue[] = [];
  const rejected: SheetValidationIssue[] = [];
  const ids = new Set<string>();

  for (const row of rows) {
    if (isCompletelyEmptyRow(row)) {
      continue;
    }

    const rowErrors = requiredTextIssues(row, source, ["id"]);
    const id = clean(row.data.id);
    if (id && ids.has(id)) {
      rowErrors.push(
        issue("DUPLICATE_ID", source, row.row, "id", id,
          `La fila ${row.row} repite un ID de campaña.`),
      );
    }
    if (rowErrors.length) {
      rejected.push(...rowErrors);
      continue;
    }

    ids.add(id);
    const priority = parseSheetNumber(row.data, "priority");
    if (priority.state === "invalid") {
      warnings.push(
        issue("INVALID_NUMBER", source, row.row, "priority", priority.raw,
          `La fila ${row.row} contiene una prioridad inválida.`),
      );
    }

    const publicationStatus =
      normalizeCampaignLookupKey(row.data.publicationstatus);
    if (!CAMPAIGN_STATUSES.has(publicationStatus)) {
      warnings.push(
        issue("INVALID_STATUS", source, row.row, "publicationstatus",
          row.data.publicationstatus ?? null,
          `La fila ${row.row} contiene un estado de campaña desconocido.`),
      );
    }
    warnings.push(...campaignDateWarnings(row, source));
    data.push({ row: row.row, raw: row.data, priority });
  }

  return { ok: true, data, warnings, rejected };
}
