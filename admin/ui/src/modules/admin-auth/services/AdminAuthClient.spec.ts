import { afterEach, describe, expect, it, vi } from "vitest";

import {
  loadAdminSession,
  loginAdmin,
  resolveAdminCoreUrl,
  updateAdminCategory,
} from "./AdminAuthClient";

describe("AdminAuthClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("construye rutas sobre el proxy de JUNG CORE", () => {
    expect(resolveAdminCoreUrl("/admin-auth/me", "/jung-core")).toBe("/jung-core/admin-auth/me");
  });

  it("usa credentials include y no envía llaves internas al consultar sesión", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,

      json: async () => ({
        authenticated: true,

        user: {
          id: "admin-1",

          displayName: "Admin Test",
        },

        accesses: [],

        session: {
          expiresAt: new Date().toISOString(),
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await loadAdminSession();

    expect(fetchMock).toHaveBeenCalledWith(
      "/jung-core/admin-auth/me",
      expect.objectContaining({
        method: "GET",

        credentials: "include",
      }),
    );

    const request = fetchMock.mock.calls[0]?.[1];

    expect(request.headers["x-jung-core-read-key"]).toBeUndefined();

    expect(request.headers["x-jung-core-write-key"]).toBeUndefined();
  });

  it("envía DNI y password solo en el body del login", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,

      json: async () => ({
        authenticated: true,

        user: {
          id: "admin-1",

          displayName: "Admin Test",
        },

        accesses: [],

        session: {
          expiresAt: new Date().toISOString(),
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await loginAdmin({
      documentNumber: "12345678",

      password: "password-test",
    });

    const [url, request] = fetchMock.mock.calls[0];

    expect(url).toBe("/jung-core/admin-auth/login");

    expect(request.credentials).toBe("include");

    expect(JSON.parse(request.body)).toEqual({
      documentType: "DNI",

      documentNumber: "12345678",

      password: "password-test",
    });
  });

  it("usa PUT con sesión HttpOnly y sin machine keys al editar categoría", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,

      json: async () => ({
        success: true,

        message: "Category updated",

        data: {},
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await updateAdminCategory("brand wooly", "category/1", {
      name: "Peluches",

      icon: "🧸",

      accentColor: "#E94F8A",

      ogMediaRef: "flores-amarillas.jpg",
    });

    const [url, request] = fetchMock.mock.calls[0];

    expect(url).toBe("/jung-core/catalog-commercial/brands/brand%20wooly/categories/category%2F1");

    expect(request.method).toBe("PUT");

    expect(request.credentials).toBe("include");

    expect(request.headers["x-jung-core-read-key"]).toBeUndefined();

    expect(request.headers["x-jung-core-write-key"]).toBeUndefined();

    expect(JSON.parse(request.body)).toEqual({
      name: "Peluches",

      icon: "🧸",

      accentColor: "#E94F8A",

      ogMediaRef: "flores-amarillas.jpg",
    });
  });
});

import * as attributeClient from "./AdminAuthClient";
describe("Human category attribute HTTP commands", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("preserves exact routes and session, with human CREATE bodies and no machine keys or DELETE", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ success: true, data: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    const fields = {
      label: "Tamaño",
      type: "SELECT" as const,
      role: "SIZE" as const,
      required: false,
      multiple: false,
      allowCustomValue: false,
      config: {},
    };
    await attributeClient.loadAdminCategoryAttributes("b/a", "c/a");
    await attributeClient.createAdminCategoryAttribute("b/a", "c/a", fields);
    await attributeClient.updateAdminCategoryAttribute("b/a", "c/a", "d/a", {
      label: "Medida",
      status: "INACTIVE",
    });
    await attributeClient.createAdminCategoryAttributeOption("b/a", "c/a", "d/a", {
      label: "25 cm",
      amount: "25",
      unitCode: "cm",
    });
    const base = "/jung-core/catalog-commercial/brands/b%2Fa/categories/c%2Fa/attributes";
    expect(fetchMock.mock.calls.map(([url, request]) => [url, request.method])).toEqual([
      [base, "GET"],
      [base, "POST"],
      [base + "/d%2Fa", "PUT"],
      [base + "/d%2Fa/options", "POST"],
    ]);
    for (const [, request] of fetchMock.mock.calls) {
      expect(request.credentials).toBe("include");
      expect(request.cache).toBe("no-store");
      expect(Object.keys(request.headers).sort()).toEqual(
        request.body ? ["Accept", "Content-Type"] : ["Accept"],
      );
    }
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(fields);
    expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({
      label: "25 cm",
      amount: "25",
      unitCode: "cm",
    });
  });
  it("preserves the CORE error message and status with an HTTP fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: "El nombre ya está registrado." }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => {
            throw new Error("HTML");
          },
        }),
    );
    await expect(
      attributeClient.createAdminCategoryAttributeOption("b", "c", "d", { label: "Blanco" }),
    ).rejects.toMatchObject({ message: "El nombre ya está registrado.", status: 400 });
    await expect(attributeClient.loadAdminCategoryAttributes("b", "c")).rejects.toMatchObject({
      message: "JUNG CORE respondió HTTP 503",
      status: 503,
    });
  });
});

it("publishes one encoded canonical product using only the human session", async () => {
  const { publishAdminProduct } = await import("./AdminAuthClient");
  const fetchMock = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "OK",
        data: { id: "p/1", status: "PUBLISHED" },
      }),
    });
  vi.stubGlobal("fetch", fetchMock);
  try {
    await expect(publishAdminProduct("b/1", "p/1")).resolves.toMatchObject({
      success: true,
      data: { id: "p/1" },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/catalog-commercial/brands/b%2F1/products/p%2F1/publish");
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
    expect(init.body).toBeUndefined();
    expect(Object.keys(init.headers)).toEqual(["Accept"]);
  } finally {
    vi.unstubAllGlobals();
  }
});
