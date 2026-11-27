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
  loadBrandAdminConfiguration,
  updateAdminProductInventoryPolicy,
  updateAdminProductInventoryBalance,
} from "@/modules/admin-auth/services/AdminAuthClient";

vi.mock("@/modules/admin-auth/services/AdminAuthClient", () => ({
  loadAdminProductDetail: vi.fn(),
  loadBrandAdminConfiguration: vi.fn(),
  updateAdminProductInventoryPolicy: vi.fn(),
  updateAdminProductInventoryBalance: vi.fn(),
}));

const detail = vi.mocked(loadAdminProductDetail);
const config = vi.mocked(loadBrandAdminConfiguration);
const policy = vi.mocked(updateAdminProductInventoryPolicy);
const stock = vi.mocked(updateAdminProductInventoryBalance);

const location = {
  id: "location-test",
  code: "MAIN",
  name: "Almacen principal",
  status: "ACTIVE",
  countsForPublicCatalog: true,
};

function balance(onHand = 10, reserved = 2) {
  return {
    locationId: location.id,
    locationCode: location.code,
    locationName: location.name,
    locationStatus: location.status,
    countsForPublicCatalog: true,
    onHand,
    reserved,
    available: onHand - reserved,
    updatedAt: "2026-11-27T00:00:00.000Z",
  };
}

function response(
  tracked: boolean | null = null,
  availabilityOverride: string | null = null,
  balances: ReturnType<typeof balance>[] = [],
) {
  return {
    success: true,
    data: {
      id: "product-test",
      inventory: {
        tracked,
        availabilityOverride,
        balances,
      },
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();

  detail.mockResolvedValue(response());

  config.mockResolvedValue({
    success: true,
    data: {
      brandId: "brand-test",
      inventoryLocations: [location],
    },
  } as unknown as Awaited<
    ReturnType<typeof loadBrandAdminConfiguration>
  >);
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

  await screen.findByRole("button", {
    name: "Guardar inventario",
  });

  return onSaved;
}

function save() {
  fireEvent.click(screen.getByRole("button", {
    name: "Guardar inventario",
  }));
}

function changeOverride(value: string) {
  fireEvent.change(screen.getByLabelText(
    "Disponibilidad comercial",
  ), { target: { value } });
}

function changeStock(value: string) {
  fireEvent.change(screen.getByLabelText(
    "Existencias fisicas",
  ), { target: { value } });
}

describe("ProductInventoryEditor", () => {
  it("carga directamente sin inventar politica ni stock", async () => {
    await openEditor();

    expect(screen.getByLabelText(
      "Existencias fisicas",
    )).toHaveValue(null);

    expect(screen.getByRole("button", {
      name: "Guardar inventario",
    })).toBeDisabled();

    expect(policy).not.toHaveBeenCalled();
    expect(stock).not.toHaveBeenCalled();
  });

  it("normaliza AUTO y null como la misma disponibilidad", async () => {
    detail.mockResolvedValue(response(true, "AUTO"));

    await openEditor();

    expect(screen.getByLabelText(
      "Disponibilidad comercial",
    )).toHaveValue("AUTO");

    expect(screen.getByRole("button", {
      name: "Guardar inventario",
    })).toBeDisabled();

    expect(policy).not.toHaveBeenCalled();
  });

  it("envia null y confirma mediante una lectura independiente", async () => {
    detail.mockResolvedValue(response(true, "PREORDER"));

    const onSaved = await openEditor();

    detail
      .mockResolvedValueOnce(response(true, "PREORDER"))
      .mockResolvedValueOnce(response(true, null));

    policy.mockResolvedValue(response(true, "PREORDER"));

    changeOverride("AUTO");
    save();

    await screen.findByText("Inventario confirmado por CORE TEST.");

    expect(policy).toHaveBeenCalledExactlyOnceWith(
      "brand-test",
      "product-test",
      {
        tracked: true,
        availabilityOverride: null,
      },
    );

    expect(detail).toHaveBeenCalledTimes(3);
    expect(stock).not.toHaveBeenCalled();

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });

  it("actualiza existencias preservando las reservas", async () => {
    detail.mockResolvedValue(response(true, null, [balance()]));

    const onSaved = await openEditor();

    detail
      .mockResolvedValueOnce(response(true, null, [balance()]))
      .mockResolvedValueOnce(response(true, null, [balance(15)]));

    stock.mockResolvedValue(response(true, null, [balance()]));

    changeStock("15");
    save();

    await screen.findByText("Inventario confirmado por CORE TEST.");

    expect(stock).toHaveBeenCalledExactlyOnceWith(
      "brand-test",
      "product-test",
      "MAIN",
      {
        onHand: 15,
        expected: {
          onHand: 10,
          reserved: 2,
          updatedAt: "2026-11-27T00:00:00.000Z",
        },
      },
    );

    expect(policy).not.toHaveBeenCalled();

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });

  it("bloquea cantidades inferiores a las reservas", async () => {
    detail.mockResolvedValue(response(true, null, [balance()]));

    await openEditor();

    changeStock("1");
    save();

    expect(stock).not.toHaveBeenCalled();
    expect(policy).not.toHaveBeenCalled();
  });

  it("bloquea una politica desactualizada antes de escribir", async () => {
    await openEditor();

    detail.mockResolvedValue(response(false));

    changeOverride("PREORDER");
    save();

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("La politica cambio");

    expect(policy).not.toHaveBeenCalled();
    expect(stock).not.toHaveBeenCalled();
  });

  it("no declara exito si la relectura no confirma la politica", async () => {
    detail.mockResolvedValue(response(true, null));

    const onSaved = await openEditor();

    policy.mockResolvedValue(response(true, "PREORDER"));

    changeOverride("PREORDER");
    save();

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Resultado no confirmado");

    expect(onSaved).not.toHaveBeenCalled();
  });

  it("informa resultados parciales sin reintentar automaticamente", async () => {
    detail.mockResolvedValue(response(true, null, [balance()]));

    const onSaved = await openEditor();

    detail
      .mockResolvedValueOnce(response(true, null, [balance()]))
      .mockResolvedValueOnce(response(true, "PREORDER", [balance()]));

    policy.mockResolvedValue(response(true, "PREORDER"));
    stock.mockRejectedValue(new Error("HTTP 409"));

    changeOverride("PREORDER");
    changeStock("15");
    save();

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Resultado parcial. Confirmado: politica");

    expect(policy).toHaveBeenCalledOnce();
    expect(stock).toHaveBeenCalledOnce();
    expect(onSaved).not.toHaveBeenCalled();

    expect(screen.getByRole("button", {
      name: "Guardar inventario",
    })).toBeDisabled();

    expect(screen.getByRole("button", {
      name: "Recargar inventario",
    })).toBeInTheDocument();
  });

  it("permite registrar un primer saldo sin inventar reservas", async () => {
    await openEditor();

    detail
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(response(true))
      .mockResolvedValueOnce(response(true, null, [balance(8, 0)]));

    policy.mockResolvedValue(response(true));
    stock.mockResolvedValue(response(true));

    changeStock("8");
    save();

    await screen.findByText("Inventario confirmado por CORE TEST.");

    expect(policy).toHaveBeenCalledExactlyOnceWith(
      "brand-test",
      "product-test",
      {
        tracked: true,
        availabilityOverride: null,
      },
    );

    expect(stock).toHaveBeenCalledExactlyOnceWith(
      "brand-test",
      "product-test",
      "MAIN",
      {
        onHand: 8,
        expected: null,
      },
    );
  });
});