import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseSheetCSV,
  validateSheetDocument,
} from "../fetchSheets";

import {
  parseSheetNumber,
  validateCampaignRows,
  validateProductRows,
} from "@wooly/contracts/catalog/integrations/googleSheets/contracts";

const SOURCE = "Productos";
const PRODUCT_SCHEMA = {
  required: ["id", "title", "description", "price_1", "stock", "status"],
  optional: ["campaigns", "price_offer", "price_3", "priority", "updated_at"],
  allowUnknown: true,
} as const;

function productDocument(body: string) {
  const parsed = parseSheetCSV(body, SOURCE);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error("CSV inválido en fixture");
  return parsed.data;
}

describe("parseSheetCSV", () => {
  it.each([
    ["LF", "id,title\n1,Producto", "Producto"],
    ["CRLF", "id,title\r\n1,Producto", "Producto"],
    ["coma entre comillas", 'id,title\n1,"Ramo, rojo"', "Ramo, rojo"],
    ["comillas escapadas", 'id,title\n1,"Ramo ""rojo"""', 'Ramo "rojo"'],
    ["línea vacía intermedia", "id,title\n\n1,Producto", "Producto"],
  ])("procesa %s", (_case, csv, title) => {
    const result = parseSheetCSV(csv, SOURCE);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.rows[0].data.title).toBe(title);
    }
  });

  it("rechaza documento vacío", () => {
    expect(parseSheetCSV("", SOURCE)).toMatchObject({
      ok: false,
      errors: [{ code: "MISSING_HEADER" }],
    });
  });

  it("acepta documento con solo header y cero filas", () => {
    const result = parseSheetCSV("id,title", SOURCE);
    expect(result).toMatchObject({
      ok: true,
      warnings: [{ code: "INVALID_ROW", row: 2 }],
    });
    if (result.ok) expect(result.data.rows).toEqual([]);
  });

  it("rechaza header duplicado", () => {
    expect(parseSheetCSV("id,ID\n1,2", SOURCE)).toMatchObject({
      ok: false,
      errors: [{ code: "DUPLICATE_HEADER", column: "id" }],
    });
  });

  it.each([
    ["menos", "id,title\n1"],
    ["más", "id,title\n1,Producto,extra"],
  ])("rechaza solo la fila con columnas de %s", (_case, csv) => {
    const result = parseSheetCSV(csv, SOURCE);
    expect(result).toMatchObject({
      ok: true,
      rejected: [{ code: "ROW_LENGTH_MISMATCH", row: 2 }],
    });
    if (result.ok) expect(result.data.rows).toEqual([]);
  });

  it("detecta header obligatorio ausente y header desconocido", () => {
    const parsed = productDocument("id,title,extra\n1,Producto,x");
    expect(validateSheetDocument(parsed, PRODUCT_SCHEMA, SOURCE)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_HEADER", column: "description" }),
      ]),
      warnings: [{ code: "UNKNOWN_HEADER", column: "extra" }],
    });
  });
});

describe("validación de SheetProduct", () => {
  const header =
    "id,title,description,price_1,price_3,price_offer,stock,priority,status,updated_at,campaigns";

  it.each([
    ["ausente", {}, "missing", null],
    ["vacío", { price_1: "" }, "empty", null],
    ["inválido", { price_1: "abc" }, "invalid", null],
    ["Infinity", { price_1: "Infinity" }, "invalid", null],
    ["cero", { price_1: "0" }, "valid", 0],
    ["negativo", { price_1: "-2" }, "valid", -2],
    ["decimal", { price_1: "2,5" }, "valid", 2.5],
  ])("distingue número %s", (_case, row, state, value) => {
    expect(parseSheetNumber(row, "price_1")).toMatchObject({ state, value });
  });

  it("conserva primera ocurrencia y rechaza duplicado posterior con trim case-sensitive", () => {
    const document = productDocument(
      `${header}\nABC,A,Desc,10,,,2,0,publicado,,\n ABC ,B,Desc,10,,,2,0,publicado,,\nabc,C,Desc,10,,,2,0,publicado,,`,
    );
    const result = validateProductRows(document.rows, SOURCE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.map((item) => item.raw.id)).toEqual(["ABC", "abc"]);
      expect(result.rejected).toEqual([
        expect.objectContaining({ code: "DUPLICATE_ID", row: 3 }),
      ]);
    }
  });

  it.each([
    ["ID vacío", ",A,Desc,10,,,2,0,publicado,,", "id"],
    ["title vacío", "1,,Desc,10,,,2,0,publicado,,", "title"],
    ["description vacío", "1,A,,10,,,2,0,publicado,,", "description"],
  ])("rechaza %s", (_case, values, column) => {
    const result = validateProductRows(
      productDocument(`${header}\n${values}`).rows,
      SOURCE,
    );
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.rejected).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "EMPTY_REQUIRED_FIELD", column }),
        ]),
      );
    }
  });

  it("diagnostica pérdidas compatibles sin rechazar la fila", () => {
    const result = validateProductRows(
      productDocument(
        `${header}\n1,A,Desc,abc,-2,no-num,invalid,no-num,raro,ayer,Navidad|Navidad|Desconocida`,
      ).rows,
      SOURCE,
      { Navidad: "campaign-1" },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].numeric.price_1.state).toBe("invalid");
      expect(result.data[0].numeric.price_3.value).toBe(-2);
      expect(result.warnings.map((item) => item.code)).toEqual(
        expect.arrayContaining([
          "INVALID_NUMBER",
          "INVALID_STATUS",
          "INVALID_DATE",
          "UNKNOWN_REFERENCE",
        ]),
      );
    }
  });

  it("preserva cero real de price_1 y rechaza stock vacío", () => {
    const result = validateProductRows(
      productDocument(`${header}\n1,A,Desc,0,,,,,publicado,,`).rows,
      SOURCE,
    );
    if (!result.ok) throw new Error("Resultado inesperado");
    expect(result.data).toEqual([]);
    expect(result.rejected).toEqual([
      expect.objectContaining({
        code: "EMPTY_REQUIRED_FIELD",
        column: "stock",
      }),
    ]);
  });

  it("omite una fila de producto completamente vacía", () => {
    const result = validateProductRows(
      productDocument(`${header}\n,,,,,,,,,,`).rows,
      SOURCE,
    );
    expect(result).toMatchObject({
      ok: true,
      data: [],
      rejected: [],
    });
  });

  it("mantiene issues en una fila de producto parcialmente vacía", () => {
    const result = validateProductRows(
      productDocument(`${header}\n1,,,,,,,,,,`).rows,
      SOURCE,
    );
    expect(result).toMatchObject({
      ok: true,
      rejected: expect.arrayContaining([
        expect.objectContaining({
          code: "EMPTY_REQUIRED_FIELD",
          column: "title",
        }),
      ]),
    });
  });
});

describe("validación de SheetCampaign", () => {
  const header =
    "id,name,icon,color,startdate,enddate,priority,publicationstatus";

  it("acepta campaña válida y rechaza ID duplicado posterior", () => {
    const document = productDocument(
      `${header}\nc1,Campaña,*,rosa,2026-01-01,2026-12-31,1,publicado\nc1,Otra,*,azul,2026-01-01,2026-12-31,2,publicado`,
    );
    const result = validateCampaignRows(document.rows, "Campañas");
    expect(result).toMatchObject({
      ok: true,
      data: [expect.objectContaining({ raw: expect.objectContaining({ id: "c1" }) })],
      rejected: [{ code: "DUPLICATE_ID" }],
    });
  });

  it("diagnostica estado, prioridad, fechas y rango", () => {
    const rows = productDocument(
      `${header}\na,A,*,rosa,fecha,2026-12-31,x,raro\nb,B,*,rosa,2026-12-31,2026-01-01,1,publicado`,
    ).rows;
    const result = validateCampaignRows(rows, "Campañas");
    if (!result.ok) throw new Error("Resultado inesperado");
    expect(result.warnings.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "INVALID_NUMBER",
        "INVALID_STATUS",
        "INVALID_DATE",
      ]),
    );
  });

  it("rechaza campaña con ID vacío", () => {
    const result = validateCampaignRows(
      productDocument(
        `${header}\n,Campaña,*,rosa,2026-01-01,2026-12-31,1,publicado`,
      ).rows,
      "Campañas",
    );
    expect(result).toMatchObject({
      ok: true,
      rejected: [{ code: "EMPTY_REQUIRED_FIELD", column: "id" }],
    });
  });

  it("omite fila de campaña completamente vacía y conserva la válida", () => {
    const result = validateCampaignRows(
      productDocument(
        `${header}\n,,,,,,,\nc1,Campaña,*,rosa,2026-01-01,2026-12-31,1,publicado`,
      ).rows,
      "Campañas",
    );
    expect(result).toMatchObject({
      ok: true,
      data: [
        expect.objectContaining({
          raw: expect.objectContaining({ id: "c1" }),
        }),
      ],
      rejected: [],
    });
  });
});
