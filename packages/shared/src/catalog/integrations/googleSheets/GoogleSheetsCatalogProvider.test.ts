import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  SheetValidationError,
} from "@wooly/contracts/catalog/integrations/googleSheets/contracts";
import {
  googleSheetsCatalogProvider,
} from "./GoogleSheetsCatalogProvider";

function csvResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/csv" },
  });
}

describe("googleSheetsCatalogProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rechaza filas inválidas, conserva la primera ID y diagnostica", async () => {
    const csv = [
      "id,title,description,price_1,stock,status,img,campaigns",
      "p1,Ramo,Descripción,10,2,publicado,ramo.jpg,",
      ",Sin ID,Descripción,10,2,publicado,ramo.jpg,",
      "p1,Duplicado,Descripción,10,2,publicado,ramo.jpg,",
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(csvResponse(csv)));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(
      googleSheetsCatalogProvider.loadCategoryProducts("flores", []),
    ).resolves.toEqual([
      expect.objectContaining({ id: "p1", title: "Ramo", price_1: 10 }),
    ]);
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining("EMPTY_REQUIRED_FIELD"),
    );
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining("DUPLICATE_ID"),
    );
  });

  it("propaga documento inválido para activar el fallback superior", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        csvResponse("id,title\np1,Ramo"),
      ),
    );

    await expect(
      googleSheetsCatalogProvider.loadCategoryProducts("flores", []),
    ).rejects.toBeInstanceOf(SheetValidationError);
  });
});
