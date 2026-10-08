import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  loadAdminSession,
  loginAdmin,
  resolveAdminCoreUrl,
} from "./AdminAuthClient";

describe("AdminAuthClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("construye rutas sobre el proxy de JUNG CORE", () => {
    expect(
      resolveAdminCoreUrl(
        "/admin-auth/me",
        "/jung-core",
      ),
    ).toBe(
      "/jung-core/admin-auth/me",
    );
  });

  it("usa credentials include y no envía llaves internas al consultar sesión", async () => {
    const fetchMock =
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          authenticated: true,
          user: {
            id: "admin-1",
            displayName:
              "Admin Test",
          },
          accesses: [],
          session: {
            expiresAt:
              new Date().toISOString(),
          },
        }),
      });

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    await loadAdminSession();

    expect(fetchMock)
      .toHaveBeenCalledWith(
        "/jung-core/admin-auth/me",
        expect.objectContaining({
          method:
            "GET",
          credentials:
            "include",
        }),
      );

    const request =
      fetchMock.mock.calls[0]?.[1];

    expect(
      request.headers[
        "x-jung-core-read-key"
      ],
    ).toBeUndefined();

    expect(
      request.headers[
        "x-jung-core-write-key"
      ],
    ).toBeUndefined();
  });

  it("envía DNI y password solo en el body del login", async () => {
    const fetchMock =
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          authenticated: true,
          user: {
            id: "admin-1",
            displayName:
              "Admin Test",
          },
          accesses: [],
          session: {
            expiresAt:
              new Date().toISOString(),
          },
        }),
      });

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    await loginAdmin({
      documentNumber:
        "12345678",
      password:
        "password-test",
    });

    const [
      url,
      request,
    ] =
      fetchMock.mock.calls[0];

    expect(url).toBe(
      "/jung-core/admin-auth/login",
    );

    expect(
      request.credentials,
    ).toBe(
      "include",
    );

    expect(
      JSON.parse(
        request.body,
      ),
    ).toEqual({
      documentType:
        "DNI",
      documentNumber:
        "12345678",
      password:
        "password-test",
    });
  });
});
