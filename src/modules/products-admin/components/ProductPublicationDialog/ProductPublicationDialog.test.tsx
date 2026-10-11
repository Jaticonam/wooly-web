import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPublicationDialog from "./ProductPublicationDialog";

const base = {
  productId: "p",
  ready: false,
  reasons: [],
  warnings: [],
  blockers: [],
  requiredConfirmations: [],
} as const;

describe("PUB-01.9C publication dialog", () => {
  it("shows blockers and never authorizes publishing", () => {
    const onConfirm = vi.fn();
    render(
      <ProductPublicationDialog
        open
        productName="Producto"
        readiness={{ ...base, blockers: ["PRICING_INVALID"] }}
        submitting={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText(/precio unitario debe ser mayor/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar publicación" })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("requires independent image and stock acknowledgements", () => {
    const onConfirm = vi.fn();
    render(
      <ProductPublicationDialog
        open
        productName="Producto"
        readiness={{
          ...base,
          warnings: ["PUBLIC_MEDIA_MISSING", "INVENTORY_OUT_OF_STOCK"],
          requiredConfirmations: ["useDefaultImage", "publishWithoutStock"],
        }}
        submitting={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const confirm = screen.getByRole("button", { name: "Confirmar publicación" });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Publicar con imagen predeterminada"));
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Publicar aunque no exista stock/));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({
      useDefaultImage: true,
      publishWithoutStock: true,
    });
  });

  it("permits explicit publication without warnings", () => {
    const onConfirm = vi.fn();
    render(
      <ProductPublicationDialog
        open
        productName="Producto"
        readiness={base}
        submitting={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar publicación" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
