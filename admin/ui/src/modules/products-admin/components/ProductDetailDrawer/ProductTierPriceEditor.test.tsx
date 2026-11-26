import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductTierPriceEditor from "./ProductTierPriceEditor";

import {
  loadAdminProductPricing,
  updateAdminProductTierPrices,
} from "@/modules/admin-auth/services/AdminAuthClient";

vi.mock("@/modules/admin-auth/services/AdminAuthClient", () => ({
  loadAdminProductPricing: vi.fn(),
  updateAdminProductTierPrices: vi.fn(),
}));

const tiers = [
  { minimumQuantity: 1, unitPrice: 18 },
  { minimumQuantity: 3, unitPrice: 16 },
  { minimumQuantity: 12, unitPrice: 15.5 },
  { minimumQuantity: 100, unitPrice: 15 },
];

const response = (values = tiers) => ({
  success: true,
  data: {
    priceList: {
      id: "a8960b95-a2a6-4924-94d7-698059c6457e",
      code: "WOOLY-PEN-TEST",
      name: "Wooly PEN TEST",
      currency: "PEN",
    },
    tiers: values,
    offer: null,
  },
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(loadAdminProductPricing).mockResolvedValue(response());
});

async function openEditor() {
  const onSaved = vi.fn().mockResolvedValue(undefined);

  render(
    <ProductTierPriceEditor
      brandId="brand-test"
      productId="product-test"
      onSaved={onSaved}
    />,
  );

  fireEvent.click(screen.getByRole("button", {
    name: "Editar precios",
  }));

  await screen.findByRole("button", {
    name: "Guardar precios",
  });

  return onSaved;
}

describe("ProductTierPriceEditor", () => {
  it("preserva los tramos y deja vacio el tramo inexistente", async () => {
    await openEditor();

    expect(screen.getByLabelText("1 unidad")).toHaveValue(18);
    expect(screen.getByLabelText("50 unidades")).toBeDisabled();
    expect(screen.getByLabelText("50 unidades")).toHaveValue(null);
    expect(updateAdminProductTierPrices).not.toHaveBeenCalled();
  });

  it("no envia PUT cuando no existen cambios", async () => {
    await openEditor();

    fireEvent.click(screen.getByRole("button", {
      name: "Guardar precios",
    }));

    await screen.findByText("No hay cambios de precios.");
    expect(updateAdminProductTierPrices).not.toHaveBeenCalled();
  });

  it("actualiza solo importes y envia el snapshot esperado", async () => {
    const onSaved = await openEditor();

    const updated = tiers.map(tier =>
      tier.minimumQuantity === 3
        ? { ...tier, unitPrice: 17 }
        : tier,
    );

    vi.mocked(updateAdminProductTierPrices)
      .mockResolvedValue(response(updated));

    fireEvent.change(screen.getByLabelText("3 unidades"), {
      target: { value: "17" },
    });

    fireEvent.click(screen.getByRole("button", {
      name: "Guardar precios",
    }));

    await screen.findByText(
      "Precios confirmados por JUNG CORE TEST.",
    );

    expect(updateAdminProductTierPrices).toHaveBeenCalledExactlyOnceWith(
      "brand-test",
      "product-test",
      { tiers: updated, expectedTiers: tiers },
    );

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });

  it("bloquea la escritura cuando detecta cambios concurrentes", async () => {
    await openEditor();

    vi.mocked(loadAdminProductPricing).mockResolvedValue(
      response(tiers.map(tier =>
        tier.minimumQuantity === 1
          ? { ...tier, unitPrice: 19 }
          : tier,
      )),
    );

    fireEvent.change(screen.getByLabelText("3 unidades"), {
      target: { value: "17" },
    });

    fireEvent.click(screen.getByRole("button", {
      name: "Guardar precios",
    }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Los precios cambiaron",
    );

    expect(updateAdminProductTierPrices).not.toHaveBeenCalled();
  });
});