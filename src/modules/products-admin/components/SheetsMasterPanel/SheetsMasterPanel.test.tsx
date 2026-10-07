import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jungCoreAdminProducts } from "../../integrations/JungCoreAdminProducts";
import SheetsMasterPanel from "./SheetsMasterPanel";
import { workbookId } from "../../integrations/WorkbookIdentity";
vi.mock("../../integrations/JungCoreAdminProducts", () => ({
  jungCoreAdminProducts: { options: vi.fn(), request: vi.fn() },
}));
const preview = {
  changeSetId: "receipt",
  fingerprint: "fingerprint",
  requiresPreparation: false,
  summary: { created: 1, updated: 1, unchanged: 0, errors: 1, pending: 1 },
  rows: [{ gid: 5, rowNumber: 4, status: "ERROR", message: "Precio inválido" }],
};
describe("Sheets master explicit CORE sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
    vi.mocked(jungCoreAdminProducts.options).mockResolvedValue({
      id: "brand",
      name: "Wooly",
      categories: [],
    });
  });
  it("previews, applies the reserved change set and refreshes admin results", async () => {
    vi.mocked(jungCoreAdminProducts.request)
      .mockResolvedValueOnce(preview)
      .mockResolvedValueOnce({ ...preview, fingerprint: undefined });
    const reload = vi.fn();
    render(<SheetsMasterPanel onSynced={reload} />);
    fireEvent.change(screen.getByLabelText("Workbook operativo"), {
      target: { value: "spreadsheet-fixture" },
    });
    fireEvent.click(screen.getByText("Revisar cambios"));
    await screen.findByText("Sincronizar desde Google Sheets");
    expect(reload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Sincronizar desde Google Sheets"));
    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(jungCoreAdminProducts.request).toHaveBeenLastCalledWith(
      "/catalog-bulk/brands/brand/google-sheets/spreadsheet-fixture/temporary-master/apply",
      { changeSetId: "receipt" },
    );
    expect(screen.getByRole("status")).toHaveTextContent("Creados: 1");
    expect(screen.getByText(/Precio inválido/)).toBeInTheDocument();
  });
  it("uses the configured official workbook ahead of an older browser selection", () => {
    vi.stubEnv(
      "VITE_JUNG_CORE_SHEETS_WORKBOOK_ID",
      "official-workbook-fixture",
    );
    localStorage.setItem("jung-core-master-workbook", "stale-workbook-fixture");
    render(<SheetsMasterPanel onSynced={() => {}} />);
    expect(screen.getByLabelText("Workbook operativo")).toHaveValue(
      "official-workbook-fixture",
    );
    expect(screen.getByText("Abrir WOOLY - Catalogo Maestro")).toHaveAttribute(
      "href",
      "https://docs.google.com/spreadsheets/d/official-workbook-fixture/edit",
    );
  });
  it("parses the existing workbook URL and rejects malformed identifiers", () => {
    expect(
      workbookId(
        "https://docs.google.com/spreadsheets/d/spreadsheet-fixture/edit#gid=5",
      ),
    ).toBe("spreadsheet-fixture");
    expect(() => workbookId("bad")).toThrow("workbook");
  });
});
