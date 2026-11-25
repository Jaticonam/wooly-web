import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jungCoreAdminProducts } from "../../integrations/JungCoreAdminProducts";
import SheetsMasterPanel from "./SheetsMasterPanel";

vi.mock("../../integrations/JungCoreAdminProducts", () => ({
  jungCoreAdminProducts: { options: vi.fn(), request: vi.fn() },
}));
const preview = {
  mode: "COMMERCIAL_EXPORT", fingerprint: "plan", destructive: false,
  writesCoreProducts: false, applyAvailable: true,
  summary: { created: 0, updated: 1, unchanged: 193, conflicts: 0, preserved: 23, deleted: 0 },
  rows: [{ code: "A1", category: "Flores", rowNumber: 2, status: "UPDATE",
    changes: [{ field: "1u", from: 10, to: 12 }] }],
};
function openPanel() {
  render(<SheetsMasterPanel onSynced={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Workbook operativo"), { target: { value: "spreadsheet-fixture" } });
}
describe("FLOW-02B exportación desde CORE", () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.unstubAllEnvs(); localStorage.clear();
    vi.mocked(jungCoreAdminProducts.options).mockResolvedValue({ id: "brand", name: "Wooly", categories: [] });
  });
  it("revisa y confirma la exportación sobre el mismo documento", async () => {
    vi.mocked(jungCoreAdminProducts.request).mockResolvedValueOnce(preview)
      .mockResolvedValueOnce({ ...preview, verified: true, receiptId: "receipt" });
    openPanel();
    fireEvent.click(screen.getByText("Revisar exportación"));
    const apply = await screen.findByText("Confirmar exportación");
    expect(apply).toBeDisabled();
    expect(screen.getByText(/1u: 10 → 12/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(apply);
    await screen.findByText(/Exportación verificada/);
    expect(jungCoreAdminProducts.request).toHaveBeenNthCalledWith(1,
      "/catalog-bulk/brands/brand/google-sheets/spreadsheet-fixture/temporary-master/commercial-export/preview", {});
    expect(jungCoreAdminProducts.request).toHaveBeenNthCalledWith(2,
      "/catalog-bulk/brands/brand/google-sheets/spreadsheet-fixture/temporary-master/commercial-export/apply", { fingerprint: "plan" });
  });
  it("invalida la revisión al cambiar de documento", async () => {
    vi.mocked(jungCoreAdminProducts.request).mockResolvedValueOnce(preview);
    openPanel();
    fireEvent.click(screen.getByText("Revisar exportación"));
    await screen.findByText("Confirmar exportación");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText("Workbook operativo"), { target: { value: "another-workbook-fixture" } });
    expect(screen.queryByText("Confirmar exportación")).not.toBeInTheDocument();
    expect(jungCoreAdminProducts.request).toHaveBeenCalledTimes(1);
  });
  it("bloquea respuesta destructiva", async () => {
    vi.mocked(jungCoreAdminProducts.request).mockResolvedValueOnce({ ...preview, destructive: true });
    openPanel();
    fireEvent.click(screen.getByText("Revisar exportación"));
    await screen.findByRole("alert");
    expect(screen.queryByText("Confirmar exportación")).not.toBeInTheDocument();
    expect(jungCoreAdminProducts.request).toHaveBeenCalledTimes(1);
  });
  it("no permite aplicar si no hay cambios", async () => {
    vi.mocked(jungCoreAdminProducts.request).mockResolvedValueOnce({ ...preview, applyAvailable: false,
      summary: { ...preview.summary, updated: 0, unchanged: 194 }, rows: [] });
    openPanel();
    fireEvent.click(screen.getByText("Revisar exportación"));
    await screen.findByText("No hay cambios seguros para exportar.");
    expect(screen.getByText("Confirmar exportación")).toBeDisabled();
  });
});
