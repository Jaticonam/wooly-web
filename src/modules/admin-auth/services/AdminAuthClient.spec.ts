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
  updateAdminCategory,
} from "./AdminAuthClient";

describe(
  "AdminAuthClient",
  () => {
    afterEach(
      () => {
        vi.unstubAllGlobals();
      },
    );

    it(
      "construye rutas sobre el proxy de JUNG CORE",
      () => {
        expect(
          resolveAdminCoreUrl(
            "/admin-auth/me",
            "/jung-core",
          ),
        ).toBe(
          "/jung-core/admin-auth/me",
        );
      },
    );

    it(
      "usa credentials include y no envía llaves internas al consultar sesión",
      async () => {
        const fetchMock =
          vi.fn()
            .mockResolvedValue({
              ok: true,
              status: 200,

              json:
                async () => ({
                  authenticated:
                    true,

                  user: {
                    id:
                      "admin-1",

                    displayName:
                      "Admin Test",
                  },

                  accesses:
                    [],

                  session: {
                    expiresAt:
                      new Date()
                        .toISOString(),
                  },
                }),
            });

        vi.stubGlobal(
          "fetch",
          fetchMock,
        );

        await loadAdminSession();

        expect(
          fetchMock,
        ).toHaveBeenCalledWith(
          "/jung-core/admin-auth/me",
          expect.objectContaining({
            method:
              "GET",

            credentials:
              "include",
          }),
        );

        const request =
          fetchMock
            .mock
            .calls[0]?.[1];

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
      },
    );

    it(
      "envía DNI y password solo en el body del login",
      async () => {
        const fetchMock =
          vi.fn()
            .mockResolvedValue({
              ok: true,
              status: 200,

              json:
                async () => ({
                  authenticated:
                    true,

                  user: {
                    id:
                      "admin-1",

                    displayName:
                      "Admin Test",
                  },

                  accesses:
                    [],

                  session: {
                    expiresAt:
                      new Date()
                        .toISOString(),
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
          fetchMock
            .mock
            .calls[0];

        expect(
          url,
        ).toBe(
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
      },
    );

    it(
      "usa PUT con sesión HttpOnly y sin machine keys al editar categoría",
      async () => {
        const fetchMock =
          vi.fn()
            .mockResolvedValue({
              ok: true,
              status: 200,

              json:
                async () => ({
                  success:
                    true,

                  message:
                    "Category updated",

                  data: {},
                }),
            });

        vi.stubGlobal(
          "fetch",
          fetchMock,
        );

        await updateAdminCategory(
          "brand wooly",
          "category/1",
          {
            name:
              "Peluches",

            icon:
              "🧸",

            accentColor:
              "#E94F8A",

            ogMediaRef:
              "flores-amarillas.jpg",
          },
        );

        const [
          url,
          request,
        ] =
          fetchMock
            .mock
            .calls[0];

        expect(
          url,
        ).toBe(
          "/jung-core/catalog-commercial/brands/brand%20wooly/categories/category%2F1",
        );

        expect(
          request.method,
        ).toBe(
          "PUT",
        );

        expect(
          request.credentials,
        ).toBe(
          "include",
        );

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

        expect(
          JSON.parse(
            request.body,
          ),
        ).toEqual({
          name:
            "Peluches",

          icon:
            "🧸",

          accentColor:
            "#E94F8A",

          ogMediaRef:
            "flores-amarillas.jpg",
        });
      },
    );
  },
);
