import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import CreateProductPanel from "./CreateProductPanel";
import type {
  CreatedCanonicalProduct,
  ProductCreationProvider,
} from "../../integrations/jungCore/JungCoreProductCreation";

const options = {
  id: "brand-1",
  name: "Wooly",
  categories: [{ id: "category-1", name: "Flores" }],
  priceLists: [{ id: "list-1", name: "Público", currency: "PEN" }],
};
const product: CreatedCanonicalProduct = {
  id: "core-id",
  sku: "CORE-SKU-123",
  name: "Ramo nuevo",
  status: "DRAFT",
  categoryId: "category-1",
  brandId: "brand-1",
};
function provider() {
  return {
    loadOptions: vi.fn().mockResolvedValue(options),
    create: vi.fn().mockResolvedValue(product),
  };
}
async function fill() {
  fireEvent.click(screen.getByRole("button", { name: "+ Crear producto" }));
  await waitFor(() => expect(screen.getByLabelText("Categoría")).toBeEnabled());
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Ramo nuevo" },
  });
  fireEvent.change(screen.getByLabelText("Descripción"), {
    target: { value: "Descripción nueva" },
  });
  fireEvent.change(screen.getByLabelText("Categoría"), {
    target: { value: "category-1" },
  });
}
afterEach(cleanup);
describe("CreateProductPanel", () => {
  it("opens the existing admin modal, submits canonical fields and displays returned SKU", async () => {
    const core = provider();
    render(<CreateProductPanel provider={core} />);
    await fill();
    expect(
      screen.getByRole("dialog", { name: "Crear producto" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SKU: Se generará automáticamente por JUNG CORE"),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("1 unidad"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));
    await screen.findByText("Producto creado correctamente");
    expect(core.create).toHaveBeenCalledWith({
      name: "Ramo nuevo",
      description: "Descripción nueva",
      brandId: "brand-1",
      categoryId: "category-1",
      tiers: [{ minimumQuantity: 1, unitPrice: 10 }],
    });
    expect(screen.getByText("CORE-SKU-123")).toBeInTheDocument();
    expect(screen.getByText("Estado: DRAFT")).toBeInTheDocument();
  });
  it("blocks submission while options load and supports retry after load failure", async () => {
    const core = provider();
    core.loadOptions.mockRejectedValueOnce(new Error("CORE no disponible"));
    render(<CreateProductPanel provider={core} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Crear producto" }));
    expect(screen.getByText(/Cargando categorías/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear producto" }),
    ).toBeDisabled();
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar carga" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Categoría")).toBeEnabled(),
    );
    expect(core.loadOptions).toHaveBeenCalledTimes(2);
  });
  it("blocks duplicate submit and closing while creation is pending", async () => {
    let resolve!: (value: CreatedCanonicalProduct) => void;
    const core = provider();
    core.create.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    render(<CreateProductPanel provider={core} />);
    await fill();
    const submit = screen.getByRole("button", { name: "Crear producto" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(
      screen.getByRole("button", { name: "Creando producto..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(core.create).toHaveBeenCalledTimes(1);
    resolve(product);
    await screen.findByText("CORE-SKU-123");
  });
  it("shows persistence error and retains input for correction", async () => {
    const core = provider();
    core.create.mockRejectedValue(new Error("Categoría inválida"));
    render(<CreateProductPanel provider={core} />);
    await fill();
    fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Categoría inválida",
    );
    expect(screen.getByLabelText("Nombre")).toHaveValue("Ramo nuevo");
    expect(
      screen.getByRole("button", { name: "Crear producto" }),
    ).toBeEnabled();
  });
  it("can create a draft without prices when there is no configured default price list", async () => {
    const core = provider();
    core.loadOptions.mockResolvedValue({ ...options, priceLists: [] });
    render(<CreateProductPanel provider={core as ProductCreationProvider} />);
    await fill();
    expect(screen.queryByLabelText("1 unidad")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));
    await screen.findByText("CORE-SKU-123");
    expect(core.create.mock.calls[0][0]).not.toHaveProperty("tiers");
  });
  it("requires a base tier before sending quantity prices", async () => {
    const core = provider();
    render(<CreateProductPanel provider={core} />);
    await fill();
    fireEvent.change(screen.getByLabelText("3 unidades"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "incluir el precio por 1 unidad",
    );
    expect(core.create).not.toHaveBeenCalled();
  });
});
