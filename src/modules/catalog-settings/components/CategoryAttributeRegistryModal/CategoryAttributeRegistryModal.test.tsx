import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as client from "@/modules/admin-auth/services/AdminAuthClient";
import type { AdminCategoryAttributeDefinition } from "@/modules/admin-auth/services/AdminAuthClient";
import Registry from "./CategoryAttributeRegistryModal";
vi.mock("@/modules/admin-auth/services/AdminAuthClient", () => ({
  loadAdminCategoryAttributes: vi.fn(),
  createAdminCategoryAttribute: vi.fn(),
  updateAdminCategoryAttribute: vi.fn(),
  createAdminCategoryAttributeOption: vi.fn(),
  updateAdminCategoryAttributeOption: vi.fn(),
}));
const option = {
  id: "o",
  code: "value_25_cm",
  label: "25 cm",
  position: 42,
  status: "ARCHIVED" as const,
  value: { kind: "MEASUREMENT" as const, amount: "25", unitCode: "cm" },
};
const definition: AdminCategoryAttributeDefinition = {
  id: "d",
  code: "tamano",
  label: "Tamaño",
  type: "MEASUREMENT",
  role: "SIZE",
  required: true,
  multiple: false,
  allowCustomValue: true,
  position: 47,
  status: "ACTIVE",
  config: { allowedUnitCodes: ["cm", "m"], defaultUnitCode: "cm" },
  options: [option],
};
const envelope = (data: AdminCategoryAttributeDefinition[]) => ({
  success: true,
  message: "ok",
  data,
});
const mutation = { success: true, message: "ok", data: {} };
function open(canWrite = true, onClose = vi.fn()) {
  render(
    <Registry
      brandId="b"
      category={{ id: "c", name: "Peluches" }}
      canWrite={canWrite}
      onClose={onClose}
    />,
  );
  return onClose;
}
const detail = async () => {
  await screen.findByText("Tamaño");
  fireEvent.click(screen.getByRole("button", { name: "Configurar Tamaño" }));
};
function noTechnicalUI() {
  expect(
    screen.queryByText(
      /Definiciones|Posición|ATTRIBUTE|SIZE|SELECT|MEASUREMENT|payload|value_25_cm|tamano/,
    ),
  ).not.toBeInTheDocument();
  for (const name of ["Posición", "Estado", "Rol", "Código"])
    expect(screen.queryByLabelText(name)).not.toBeInTheDocument();
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(client.loadAdminCategoryAttributes).mockResolvedValue(envelope([definition]));
  for (const fn of [
    client.createAdminCategoryAttribute,
    client.updateAdminCategoryAttribute,
    client.createAdminCategoryAttributeOption,
  ])
    vi.mocked(fn).mockResolvedValue(mutation);
});
describe("Human category attribute workspace", () => {
  it("loads lazily and allows read-only list/detail/back navigation without editable controls", async () => {
    open(false);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    await screen.findByText("Atributos (1)");
    expect(client.loadAdminCategoryAttributes).toHaveBeenCalledWith("b", "c");
    noTechnicalUI();
    expect(
      screen.getByText("Características disponibles para los productos de esta categoría"),
    ).toBeInTheDocument();
    await detail();
    expect(screen.getByText("Valores disponibles (1)")).toBeInTheDocument();
    expect(screen.getByText("25 cm")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Agregar atributo|Guardar|Seleccionar valores|Editar/ }),
    ).not.toBeInTheDocument();
    noTechnicalUI();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Volver a atributos/ }));
    expect(screen.getByText("Atributos (1)")).toBeInTheDocument();
  });
  it("retries load errors and renders an empty registry", async () => {
    vi.mocked(client.loadAdminCategoryAttributes)
      .mockRejectedValueOnce(new Error("Carga fallida"))
      .mockResolvedValueOnce(envelope([]));
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent("Carga fallida");
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(
      await screen.findByText("Esta categoría todavía no tiene atributos."),
    ).toBeInTheDocument();
  });
  it("sorts compact cards and options without exposing option status or position", async () => {
    vi.mocked(client.loadAdminCategoryAttributes).mockResolvedValue(
      envelope([
        { ...definition, id: "late", label: "Último", position: 99, options: [] },
        {
          ...definition,
          options: [
            { ...option, id: "z", code: "z", label: "Zeta" },
            { ...option, id: "a", code: "a", label: "Alfa" },
          ],
        },
      ]),
    );
    open();
    await screen.findByText("Último");
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Tamaño",
      "Último",
    ]);
    expect(screen.getByText("2 opciones · Alfa, Zeta")).toBeInTheDocument();
    await detail();
    expect(screen.getAllByRole("listitem").map((x) => x.textContent)).toEqual(["Alfa", "Zeta"]);
    expect(screen.queryByText("Archivado")).not.toBeInTheDocument();
    noTechnicalUI();
  });
  it("offers only an informative attribute selection surface without writes", async () => {
    open();
    await screen.findByText("Atributos (1)");
    fireEvent.click(screen.getByRole("button", { name: "Agregar atributo" }));
    expect(
      screen.getByText(
        "Los atributos estandarizados se seleccionarán desde Valores maestros de JUNG CORE.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Próximamente por JUNG CORE")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByText("Nuevo atributo")).not.toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Volver a atributos/ }));
    expect(screen.getByText("Atributos (1)")).toBeInTheDocument();
    expect(client.createAdminCategoryAttribute).not.toHaveBeenCalled();
    expect(client.createAdminCategoryAttributeOption).not.toHaveBeenCalled();
    expect(client.updateAdminCategoryAttribute).not.toHaveBeenCalled();
  });
  it("shows canonical context as information and saves only category configuration", async () => {
    open();
    await detail();
    for (const text of ["Nombre", "Tipo", "Uso", "Tamaño"])
      expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
    expect(screen.queryByText(/Permitir un valor distinto/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    fireEvent.click(screen.getByLabelText("Este dato es obligatorio"));
    fireEvent.click(screen.getByLabelText("Puede tener varios valores"));
    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() =>
      expect(client.updateAdminCategoryAttribute).toHaveBeenCalledWith("b", "c", "d", {
        required: false,
        multiple: true,
      }),
    );
    await waitFor(() => expect(client.loadAdminCategoryAttributes).toHaveBeenCalledTimes(2));
  });
  it.each(["ACTIVE", "INACTIVE"] as const)(
    "edits availability %s using the human checkbox",
    async (status) => {
      vi.mocked(client.loadAdminCategoryAttributes).mockResolvedValue(
        envelope([{ ...definition, status }]),
      );
      open();
      await detail();
      expect(screen.queryByLabelText("¿Cómo se registrará?")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Uso")).not.toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("Disponible para productos"));
      fireEvent.submit(screen.getByRole("form", { name: "Configuración del atributo" }));
      await waitFor(() =>
        expect(client.updateAdminCategoryAttribute).toHaveBeenCalledWith(
          "b",
          "c",
          "d",
          expect.objectContaining({ status: status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
        ),
      );
      const body = vi.mocked(client.updateAdminCategoryAttribute).mock.calls[0][3];
      for (const key of [
        "code",
        "position",
        "type",
        "role",
        "includeInCommercialName",
        "commercialOrder",
        "commercialPrefix",
      ])
        expect(body).not.toHaveProperty(key);
    },
  );
  it("preserves ARCHIVED on ordinary edits and only activates through an explicit action", async () => {
    vi.mocked(client.loadAdminCategoryAttributes).mockResolvedValue(
      envelope([{ ...definition, status: "ARCHIVED" }]),
    );
    open();
    await detail();
    expect(screen.getByText(/Archivado. Puedes/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Este dato es obligatorio"));
    fireEvent.submit(screen.getByRole("form", { name: "Configuración del atributo" }));
    await waitFor(() => expect(client.updateAdminCategoryAttribute).toHaveBeenCalledTimes(1));
    expect(vi.mocked(client.updateAdminCategoryAttribute).mock.calls[0][3]).not.toHaveProperty(
      "status",
    );
    await waitFor(() => expect(client.loadAdminCategoryAttributes).toHaveBeenCalledTimes(2));
    await screen.findByLabelText("Disponible para productos");
    fireEvent.click(screen.getByLabelText("Disponible para productos"));
    fireEvent.submit(screen.getByRole("form", { name: "Configuración del atributo" }));
    await waitFor(() =>
      expect(client.updateAdminCategoryAttribute).toHaveBeenLastCalledWith(
        "b",
        "c",
        "d",
        expect.objectContaining({ status: "ACTIVE" }),
      ),
    );
  });
  it("offers informative value selection, retains existing values and returns to detail without writes", async () => {
    open();
    await detail();
    expect(screen.getByText("Valores disponibles (1)")).toBeInTheDocument();
    expect(screen.getByText("25 cm")).toBeInTheDocument();
    expect(screen.queryByText("Agregar opción")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar valores" }));
    expect(
      screen.getByText(
        "Los valores estandarizados se seleccionarán desde Valores maestros de JUNG CORE.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Próximamente por JUNG CORE")).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Volver al detalle" }));
    expect(screen.queryByText("Próximamente por JUNG CORE")).not.toBeInTheDocument();
    expect(screen.getByText("25 cm")).toBeInTheDocument();
    expect(client.createAdminCategoryAttributeOption).not.toHaveBeenCalled();
    expect(client.createAdminCategoryAttribute).not.toHaveBeenCalled();
    expect(client.updateAdminCategoryAttributeOption).not.toHaveBeenCalled();
    expect(client.updateAdminCategoryAttribute).not.toHaveBeenCalled();
  });
  it("blocks duplicate submit, navigation and close during a mutation", async () => {
    let resolve!: (value: typeof mutation) => void;
    vi.mocked(client.updateAdminCategoryAttribute).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const close = open();
    await detail();
    const form = screen.getByRole("form");
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(client.updateAdminCategoryAttribute).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Volver a atributos/ })).toBeDisabled();
    expect(screen.getByLabelText("Este dato es obligatorio")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar modal" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(close).not.toHaveBeenCalled();
    await act(async () => resolve(mutation));
    await waitFor(() => expect(client.loadAdminCategoryAttributes).toHaveBeenCalledTimes(2));
  });
  it("has no option edit or deletion actions", async () => {
    open();
    await detail();
    expect(
      screen.queryByRole("button", { name: /Editar|Eliminar|Borrar/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
});
