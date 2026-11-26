import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductInventoryEditor from "./ProductInventoryEditor";

import {
  loadAdminProductDetail,
  updateAdminProductInventoryPolicy,
} from "@/modules/admin-auth/services/AdminAuthClient";

vi.mock("@/modules/admin-auth/services/AdminAuthClient", () => ({
  loadAdminProductDetail: vi.fn(),
  updateAdminProductInventoryPolicy: vi.fn(),
}));

function response(
  tracked: boolean | null = null,
  availabilityOverride: string | null = null,
) {
  return {
    success: true,
    data: {
      id: "product-test",
      inventory: {
        tracked,
        availabilityOverride,
        balances: [],
      },
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(loadAdminProductDetail).mockResolvedValue(response());
});

async function openEditor() {
  const onSaved = vi.fn().mockResolvedValue(undefined);

  render(
    <ProductInventoryEditor
      brandId="brand-test"
      productId="product-test"
      onSaved={onSaved}
    />,
  );

  fireEvent.click(screen.getByRole("button", {
    name: "Gestionar inventario",
  }));

  await screen.findByRole("button", {
    name: "Guardar politica",
  });

  return onSaved;
}

describe("ProductInventoryEditor", () => {
  it("no inventa politica ni stock cuando CORE no los registra", async () => {
    await openEditor();

    expect(screen.getByLabelText(
      "Seguimiento de inventario",
    )).toHaveValue("");

    expect(screen.getByText(
      "Sin balances registrados en CORE.",
    )).toBeInTheDocument();

    expect(screen.getByRole("button", {
      name: "Guardar politica",
    })).toBeDisabled();

    expect(updateAdminProductInventoryPolicy).not.toHaveBeenCalled();
  });

  it("no escribe una politica sin cambios", async () => {
    vi.mocked(loadAdminProductDetail)
      .mockResolvedValue(response(false));

    await openEditor();

    fireEvent.click(screen.getByRole("button", {
      name: "Guardar politica",
    }));

    await screen.findByText("No hay cambios de inventario.");

    expect(updateAdminProductInventoryPolicy).not.toHaveBeenCalled();
  });

  it("actualiza exclusivamente la politica comercial", async () => {
    const onSaved = await openEditor();

    vi.mocked(updateAdminProductInventoryPolicy)
      .mockResolvedValue(response(true, "PREORDER"));

    fireEvent.change(screen.getByLabelText(
      "Seguimiento de inventario",
    ), { target: { value: "true" } });

    fireEvent.change(screen.getByLabelText(
      "Disponibilidad comercial",
    ), { target: { value: "PREORDER" } });

    fireEvent.click(screen.getByRole("button", {
      name: "Guardar politica",
    }));

    await screen.findByText(
      "Politica de inventario confirmada por CORE TEST.",
    );

    expect(updateAdminProductInventoryPolicy)
      .toHaveBeenCalledExactlyOnceWith(
        "brand-test",
        "product-test",
        {
          tracked: true,
          availabilityOverride: "PREORDER",
        },
      );

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });

  it("bloquea cambios ante una politica desactualizada", async () => {
    await openEditor();

    vi.mocked(loadAdminProductDetail)
      .mockResolvedValue(response(false, "AUTO"));

    fireEvent.change(screen.getByLabelText(
      "Seguimiento de inventario",
    ), { target: { value: "true" } });

    fireEvent.click(screen.getByRole("button", {
      name: "Guardar politica",
    }));

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("La politica de inventario cambio");

    expect(updateAdminProductInventoryPolicy).not.toHaveBeenCalled();
  });
});