import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jungCoreAdminProducts } from "../../integrations/JungCoreAdminProducts";
import SheetsMasterPanel from "./SheetsMasterPanel";

vi.mock("../../integrations/JungCoreAdminProducts", () => ({
  jungCoreAdminProducts: {
    options: vi.fn(),
    request: vi.fn(),
  },
}));

const safePreview = {
  changeSetId: "reserved-change",
  fingerprint: "current-fingerprint",
  mode: "WOOLY_INCREMENTAL_SYNC",
  destructive: false,
  deletions: [],
  requiresPreparation: false,
  summary: {
    created: 1,
    updated: 0,
    unchanged: 0,
    errors: 0,
    pending: 0,
    deleted: 0,
  },
  rows: [],
};

function openPanel() {
  render(<SheetsMasterPanel onSynced={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Workbook operativo"), {
    target: { value: "spreadsheet-fixture" },
  });
}

async function review() {
  fireEvent.click(screen.getByText("Revisar cambios"));
  await screen.findByText("Confirmar importación");
}

describe("INT-01.5 Sheets safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(jungCoreAdminProducts.options).mockResolvedValue({
      id: "brand",
      name: "Wooly",
      categories: [],
    });
  });

  it("blocks an incomplete CORE response", async () => {
    vi.mocked(jungCoreAdminProducts.request).mockResolvedValueOnce({
      ...safePreview,
      mode: undefined,
      destructive: undefined,
      deletions: undefined,
    });

    openPanel();
    await review();

    expect(screen.getByText("Confirmar importación")).toBeDisabled();
    expect(jungCoreAdminProducts.request).toHaveBeenCalledTimes(1);
  });

  it("blocks the historical destructive contract", async () => {
    vi.mocked(jungCoreAdminProducts.request).mockResolvedValueOnce({
      ...safePreview,
      mode: "WOOLY_FULL_SNAPSHOT",
      destructive: true,
      deletions: [
        { productId: "old-1", code: "OLD", name: "Existing product" },
      ],
      summary: { ...safePreview.summary, deleted: 1 },
    });

    openPanel();
    await review();

    expect(screen.getByText("Confirmar importación")).toBeDisabled();
    expect(jungCoreAdminProducts.request).toHaveBeenCalledTimes(1);
  });

  it("blocks apply while preparation remains pending", async () => {
    vi.mocked(jungCoreAdminProducts.request).mockResolvedValueOnce({
      ...safePreview,
      requiresPreparation: true,
    });

    openPanel();
    fireEvent.click(screen.getByText("Revisar cambios"));

    await screen.findByText("Preparar edición comercial temporal");
    expect(screen.queryByText("Confirmar importación")).not.toBeInTheDocument();
    expect(jungCoreAdminProducts.request).toHaveBeenCalledTimes(1);
  });

  it("invalidates a confirmed preview when the workbook changes", async () => {
    vi.mocked(jungCoreAdminProducts.request).mockResolvedValueOnce(safePreview);

    openPanel();
    await review();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByText("Confirmar importación")).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Workbook operativo"), {
      target: { value: "another-workbook-fixture" },
    });

    expect(screen.queryByText("Confirmar importación")).not.toBeInTheDocument();
    expect(jungCoreAdminProducts.request).toHaveBeenCalledTimes(1);
  });

  it("requires a new confirmation after another preview", async () => {
    vi.mocked(jungCoreAdminProducts.request)
      .mockResolvedValueOnce(safePreview)
      .mockResolvedValueOnce({
        ...safePreview,
        changeSetId: "new-reserved-change",
      });

    openPanel();
    await review();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByText("Confirmar importación")).toBeEnabled();

    fireEvent.click(screen.getByText("Revisar cambios"));

    await waitFor(() => {
      expect(screen.getByText("Confirmar importación")).toBeDisabled();
    });

    expect(jungCoreAdminProducts.request).toHaveBeenCalledTimes(2);
  });

  it("prevents duplicate apply requests", async () => {
    let resolveApply!: (result: typeof safePreview) => void;

    vi.mocked(jungCoreAdminProducts.request)
      .mockResolvedValueOnce(safePreview)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveApply = resolve;
          }),
      );

    openPanel();
    await review();

    fireEvent.click(screen.getByRole("checkbox"));

    const confirm = screen.getByText("Confirmar importación");
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(jungCoreAdminProducts.request).toHaveBeenCalledTimes(2);
    });

    resolveApply(safePreview);

    await waitFor(() => {
      expect(screen.getByText("Reintentar confirmación de metadata")).toBeDisabled();
    });

    expect(jungCoreAdminProducts.request).toHaveBeenCalledTimes(2);
  });
});