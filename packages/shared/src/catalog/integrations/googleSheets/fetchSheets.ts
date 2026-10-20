import {
  ExternalHttpRequestError,
  requestText,
  type ExternalRequestOptions,
} from "../../../infrastructure/http";

import {
  SheetValidationError,
  type ParsedSheetDocument,
  type ParsedSheetRow,
  type SheetHeaderSchema,
  type SheetValidationIssue,
  type SheetValidationResult,
  type SuccessfulSheetValidation,
} from "@wooly/contracts/catalog/integrations/googleSheets/contracts";

export type CsvRow = Record<string, string>;

export interface GoogleSheetSource {
  docId: string;
  gid: string;
  name?: string;
  category?: string;
}

function parseCSVLine(line: string): string[] | null {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (insideQuotes) {
    return null;
  }

  result.push(current);
  return result;
}

function sheetLabel(source: GoogleSheetSource | string): string {
  return typeof source === "string"
    ? source
    : source.category || source.name || "Google Sheet";
}

export function parseSheetCSV(
  text: string,
  source: string,
): SheetValidationResult<ParsedSheetDocument> {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  while (lines.length && lines.at(-1)?.trim() === "") {
    lines.pop();
  }

  if (!lines.length || lines.every((line) => line.trim() === "")) {
    return {
      ok: false,
      errors: [{
        code: "MISSING_HEADER",
        source,
        row: 1,
        message: "El documento CSV no contiene header.",
      }],
      warnings: [],
    };
  }

  const parsedHeader = parseCSVLine(lines[0]);
  if (!parsedHeader) {
    return {
      ok: false,
      errors: [{
        code: "INVALID_ROW",
        source,
        row: 1,
        message: "El header CSV contiene comillas sin cerrar.",
      }],
      warnings: [],
    };
  }

  const headers = parsedHeader.map((header) => header.trim().toLowerCase());
  const duplicates = headers.filter(
    (header, index) => header && headers.indexOf(header) !== index,
  );
  if (duplicates.length) {
    return {
      ok: false,
      errors: [...new Set(duplicates)].map((column) => ({
        code: "DUPLICATE_HEADER" as const,
        source,
        row: 1,
        column,
        value: column,
        message: `El header "${column}" está duplicado.`,
      })),
      warnings: [],
    };
  }

  const rows: ParsedSheetRow[] = [];
  const rejected: SheetValidationIssue[] = [];
  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    if (line.trim() === "") {
      return;
    }
    const values = parseCSVLine(line);
    if (!values) {
      rejected.push({
        code: "INVALID_ROW",
        source,
        row: rowNumber,
        message: `La fila ${rowNumber} contiene comillas sin cerrar.`,
      });
      return;
    }
    if (values.length !== headers.length) {
      rejected.push({
        code: "ROW_LENGTH_MISMATCH",
        source,
        row: rowNumber,
        value: values.length,
        message:
          `La fila ${rowNumber} tiene ${values.length} columnas; se esperaban ${headers.length}.`,
      });
      return;
    }
    const data = Object.fromEntries(
      headers.map((header, valueIndex) => [
        header,
        values[valueIndex].trim(),
      ]),
    );
    rows.push({ row: rowNumber, values, data });
  });

  const warnings: SheetValidationIssue[] =
    rows.length === 0 && rejected.length === 0
      ? [{
          code: "INVALID_ROW",
          source,
          row: 2,
          message: "El documento CSV contiene header pero no filas de datos.",
        }]
      : [];

  return {
    ok: true,
    data: { headers, rows },
    warnings,
    rejected,
  };
}

export function parseCSV(text: string): { headers: string[]; rows: CsvRow[] } {
  const result = parseSheetCSV(text, "Google Sheet");
  if (!result.ok) {
    return { headers: [], rows: [] };
  }
  return {
    headers: [...result.data.headers],
    rows: result.data.rows.map((row) => row.data),
  };
}

export function validateSheetHeaders(
  headers: string[],
  requiredHeaders: readonly string[],
  source: GoogleSheetSource,
) {
  const normalizedHeaders = headers.map((header) =>
    header.trim().toLowerCase(),
  );

  const missing = requiredHeaders.filter(
    (required) => !normalizedHeaders.includes(required.toLowerCase()),
  );

  if (!missing.length) return;

  const label = sheetLabel(source);

  throw new Error(
    `La hoja "${label}" no cumple el schema. Faltan columnas: ${missing.join(", ")}`,
  );
}

export function validateSheetDocument(
  document: ParsedSheetDocument,
  schema: SheetHeaderSchema,
  source: string,
): SheetValidationResult<ParsedSheetDocument> {
  const normalized = document.headers.map((header) => header.toLowerCase());
  const errors = schema.required
    .filter((required) => !normalized.includes(required.toLowerCase()))
    .map((column) => ({
      code: "MISSING_HEADER" as const,
      source,
      row: 1,
      column,
      value: column,
      message: `Falta el header obligatorio "${column}".`,
    }));
  const known = new Set(
    [...schema.required, ...schema.optional].map((header) => header.toLowerCase()),
  );
  const warnings = schema.allowUnknown
    ? normalized
        .filter((header) => header && !known.has(header))
        .map((column) => ({
          code: "UNKNOWN_HEADER" as const,
          source,
          row: 1,
          column,
          value: column,
          message: `El header desconocido "${column}" será ignorado.`,
        }))
    : [];

  return errors.length
    ? { ok: false, errors, warnings }
    : { ok: true, data: document, warnings, rejected: [] };
}

export async function fetchSheetDocument(
  source: GoogleSheetSource,
  schema: SheetHeaderSchema,
  requestOptions: Pick<ExternalRequestOptions, "signal" | "timeoutMs"> = {},
): Promise<SuccessfulSheetValidation<ParsedSheetDocument>> {
  const url = `https://docs.google.com/spreadsheets/d/${source.docId}/export?format=csv&gid=${source.gid}`;
  const label = sheetLabel(source);
  const result = await requestText(url, {
    source: `Google Sheets: ${label}`,
    expectedContentTypes: ["text/csv", "text/plain", "application/csv"],
    ...requestOptions,
  });

  if (result.ok === false) {
    throw new ExternalHttpRequestError(result.error);
  }

  const parsed = parseSheetCSV(result.data, label);
  if (parsed.ok === false) {
    throw new SheetValidationError(parsed.errors, parsed.warnings);
  }
  const headers = validateSheetDocument(parsed.data, schema, label);
  if (headers.ok === false) {
    throw new SheetValidationError(headers.errors, headers.warnings);
  }

  return {
    ok: true,
    data: parsed.data,
    warnings: [...parsed.warnings, ...headers.warnings],
    rejected: parsed.rejected,
  };
}

export async function fetchSheetRows(
  source: GoogleSheetSource,
  requiredHeaders: readonly string[],
  requestOptions: Pick<
    ExternalRequestOptions,
    "signal" | "timeoutMs"
  > = {},
): Promise<CsvRow[]> {
  const result = await fetchSheetDocument(
    source,
    { required: requiredHeaders, optional: [], allowUnknown: true },
    requestOptions,
  );
  return result.data.rows.map((row) => row.data).filter((row) =>
    Object.values(row).some((value) => (value ?? "").trim() !== ""),
  );
}
