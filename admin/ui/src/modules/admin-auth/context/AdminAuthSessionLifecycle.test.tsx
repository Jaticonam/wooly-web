/*
 * W12-03B · Ciclo de vida de la sesión administrativa:
 * vencimiento de sesión y pérdida de conexión durante una sesión activa.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AdminProtectedRoute from "../components/AdminProtectedRoute";

import {
  AdminAuthProvider,
  useAdminAuth,
} from "./AdminAuthContext";

const loadAdminSession = vi.hoisted(() => vi.fn());
const loadBrandAdminConfiguration = vi.hoisted(() => vi.fn());

vi.mock(
  "../services/AdminAuthClient",
  async () => {
    const actual =
      await vi.importActual<typeof import("../services/AdminAuthClient")>(
        "../services/AdminAuthClient",
      );

    return {
      ...actual,
      loadAdminSession,
      loadBrandAdminConfiguration,
      loginAdmin: vi.fn(),
      logoutAdmin: vi.fn().mockResolvedValue(undefined),
    };
  },
);

import {
  AdminAuthHttpError,
} from "../services/AdminAuthClient";

const SESSION = {
  authenticated: true,
  user: { id: "u1", displayName: "Operador" },
  accesses: [
    {
      role: "OWNER",
      brand: { id: "b-wooly", code: "WOOLY", name: "Wooly", slug: "wooly" },
    },
  ],
  session: { expiresAt: "2099-01-01T00:00:00.000Z" },
};

const CONFIGURATION = {
  success: true,
  message: "ok",
  data: {
    brandId: "b-wooly",
    publicationPolicy: {},
    publicationPolicySource: "test",
    defaultPriceList: null,
    inventoryLocations: [],
    categories: [],
    campaigns: [],
    badgeDefinitions: [],
  },
};

function ProtectedPanel() {
  const auth = useAdminAuth();

  return (
    <div>
      <h1>CONTENIDO PROTEGIDO</h1>

      <button
        type="button"
        onClick={() => void auth.refresh({ background: true })}
      >
        Revalidar
      </button>
    </div>
  );
}

function ExternalRevalidate() {
  const auth = useAdminAuth();

  return (
    <button
      type="button"
      onClick={() => void auth.refresh({ background: true })}
    >
      Revalidar externo
    </button>
  );
}

function LocationProbe() {
  const location = useLocation();

  return <output data-testid="location">{location.pathname}</output>;
}

function renderAdmin(
  path: string,
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AdminAuthProvider>
        <LocationProbe />
        <ExternalRevalidate />

        <Routes>
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<ProtectedPanel />} />
            <Route path="/admin/catalogos" element={<ProtectedPanel />} />
          </Route>
        </Routes>
      </AdminAuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  loadAdminSession.mockReset();
  loadBrandAdminConfiguration.mockReset();
  loadBrandAdminConfiguration.mockResolvedValue(CONFIGURATION);
});

afterEach(() => {
  cleanup();
});

describe("W12-03B · sesión administrativa en curso", () => {
  it("sesión vencida (HTTP 401 al revalidar) retorna al login de /admin", async () => {
    loadAdminSession.mockResolvedValueOnce(SESSION);

    renderAdmin("/admin/catalogos");

    expect(
      await screen.findByText("CONTENIDO PROTEGIDO"),
    ).toBeInTheDocument();

    loadAdminSession.mockRejectedValueOnce(
      new AdminAuthHttpError(401, "Unauthorized"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Revalidar" }));

    expect(
      await screen.findByPlaceholderText("8 dígitos"),
    ).toBeInTheDocument();

    expect(screen.getByTestId("location")).toHaveTextContent(/^\/admin$/);
    expect(screen.queryByText("CONTENIDO PROTEGIDO")).not.toBeInTheDocument();
  });

  it("pérdida de conexión durante la sesión oculta el contenido protegido (política conservadora)", async () => {
    loadAdminSession.mockResolvedValueOnce(SESSION);

    renderAdmin("/admin");

    expect(
      await screen.findByText("CONTENIDO PROTEGIDO"),
    ).toBeInTheDocument();

    loadAdminSession.mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Revalidar" }));

    expect(
      await screen.findByText(/JUNG CORE no está disponible/),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("8 dígitos")).toBeInTheDocument();
    expect(screen.queryByText("CONTENIDO PROTEGIDO")).not.toBeInTheDocument();
  });

  it("una respuesta tardía de una comprobación anterior no reemplaza el estado más reciente", async () => {
    let resolveLate: (value: unknown) => void = () => undefined;

    loadAdminSession
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveLate = resolve;
          }),
      )
      .mockRejectedValueOnce(new AdminAuthHttpError(401, "Unauthorized"));

    renderAdmin("/admin");

    expect(
      await screen.findByText("Validando sesión administrativa"),
    ).toBeInTheDocument();

    /* Comprobación más reciente: sin sesión → login. */
    fireEvent.click(screen.getByRole("button", { name: "Revalidar externo" }));

    expect(
      await screen.findByPlaceholderText("8 dígitos"),
    ).toBeInTheDocument();

    /* Llega tarde la respuesta (válida) de la comprobación anterior. */
    resolveLate(SESSION);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(screen.queryByText("CONTENIDO PROTEGIDO")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("8 dígitos")).toBeInTheDocument();
  });
});
