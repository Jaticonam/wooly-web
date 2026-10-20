/*
 * W12-03B · Regresión del acceso administrativo único (/admin)
 * y de la resiliencia del login frente a JUNG CORE.
 *
 * Se ejercita la aplicación Admin real (router, AdminAuthProvider,
 * AdminProtectedRoute, AdminLoginPage y AdminAuthClient) simulando
 * únicamente las respuestas HTTP de JUNG CORE y sustituyendo las
 * páginas internas por marcadores.
 */
import type {
  ReactNode,
} from "react";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "@/pages/ProductsAdminPage",
  () => ({
    default: () => <h1>PANEL PRODUCTOS</h1>,
  }),
);

vi.mock(
  "@/pages/SalesCatalogToolsPage",
  () => ({
    default: () => <h1>PANEL CATALOGOS</h1>,
  }),
);

vi.mock(
  "@/modules/catalog-settings/pages/CatalogSettingsPage",
  () => ({
    default: () => <h1>PANEL CONFIGURACION</h1>,
  }),
);

vi.mock(
  "@/modules/integrations/pages/IntegrationsPage",
  () => ({
    default: () => <h1>PANEL INTEGRACIONES</h1>,
  }),
);

vi.mock(
  "@/modules/commercial/pages/CommercialCenter",
  () => ({
    default: () => <h1>PANEL COMERCIAL</h1>,
  }),
);

vi.mock(
  "@wooly/shared/catalog/context/CatalogCampaignRegistryContext",
  () => ({
    CatalogCampaignRegistryProvider: ({
      children,
    }: {
      children: ReactNode;
    }) => <>{children}</>,
  }),
);

import App from "@/app/App";

type CoreResponse =
  | { kind: "json"; status: number; body: unknown }
  | { kind: "network-error" }
  | { kind: "pending" };

const WOOLY_BRAND = {
  id: "brand-wooly",
  code: "WOOLY",
  name: "Wooly",
  slug: "wooly",
};

function validSession(
  accesses = [
    {
      role: "OWNER",
      brand: WOOLY_BRAND,
    },
  ],
) {
  return {
    authenticated: true,
    user: {
      id: "user-1",
      displayName: "Operador Wooly",
    },
    accesses,
    session: {
      expiresAt: "2099-01-01T00:00:00.000Z",
    },
  };
}

const ADMIN_CONFIGURATION = {
  success: true,
  message: "ok",
  data: {
    brandId: WOOLY_BRAND.id,
    publicationPolicy: {},
    publicationPolicySource: "test",
    defaultPriceList: null,
    inventoryLocations: [],
    categories: [],
    campaigns: [],
    badgeDefinitions: [],
  },
};

const core = {
  me: [] as CoreResponse[],
  login: [] as CoreResponse[],
  configuration: {
    kind: "json",
    status: 200,
    body: ADMIN_CONFIGURATION,
  } as CoreResponse,
  calls: [] as string[],
};

function json(
  status: number,
  body: unknown = {
    message: `HTTP ${status}`,
  },
): CoreResponse {
  return {
    kind: "json",
    status,
    body,
  };
}

function respond(
  response: CoreResponse,
): Promise<Response> {
  if (response.kind === "network-error") {
    return Promise.reject(
      new TypeError("Failed to fetch"),
    );
  }

  if (response.kind === "pending") {
    return new Promise<Response>(() => undefined);
  }

  return Promise.resolve(
    new Response(
      JSON.stringify(response.body),
      {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
        },
      },
    ),
  );
}

/* La última respuesta configurada se repite en las llamadas siguientes. */
function next(
  queue: CoreResponse[],
): CoreResponse {
  return queue.length > 1
    ? queue.shift()!
    : queue[0];
}

const fetchMock = vi.fn(
  (
    input: RequestInfo | URL,
    _init?: RequestInit,
  ): Promise<Response> => {
    const url = String(input);

    core.calls.push(url);

    if (url.endsWith("/jung-core/admin-auth/me")) {
      return respond(next(core.me));
    }

    if (url.endsWith("/jung-core/admin-auth/login")) {
      return respond(next(core.login));
    }

    if (url.endsWith("/jung-core/admin-auth/logout")) {
      return respond(json(200, { loggedOut: true }));
    }

    if (url.includes("/admin-configuration")) {
      return respond(core.configuration);
    }

    return respond(json(404));
  },
);

function renderAt(
  path: string,
) {
  window.history.replaceState(
    {},
    "",
    path,
  );

  return render(<App />);
}

async function expectLoginForm() {
  expect(
    await screen.findByPlaceholderText("8 dígitos"),
  ).toBeInTheDocument();

  expect(
    screen.getByPlaceholderText("Tu contraseña"),
  ).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: /Ingresar/ }),
  ).toBeInTheDocument();

  expect(
    screen.queryByText("No se pudo abrir Wooly Admin"),
  ).not.toBeInTheDocument();
}

function expectNoProtectedContent() {
  expect(
    screen.queryByText(/^PANEL /),
  ).not.toBeInTheDocument();
}

function serviceNotice() {
  return screen.queryByText(/JUNG CORE no está disponible/);
}

function fillCredentials() {
  fireEvent.change(
    screen.getByPlaceholderText("8 dígitos"),
    { target: { value: "12345678" } },
  );

  fireEvent.change(
    screen.getByPlaceholderText("Tu contraseña"),
    { target: { value: "contraseña-segura" } },
  );
}

function meCalls(): number {
  return core.calls.filter((url) =>
    url.endsWith("/admin-auth/me"),
  ).length;
}

beforeEach(() => {
  core.me = [json(401)];
  core.login = [json(401)];
  core.configuration = json(200, ADMIN_CONFIGURATION);
  core.calls = [];

  fetchMock.mockClear();

  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("W12-03B · /admin como entrada única", () => {
  it("1·3 · /admin sin sesión (HTTP 401) muestra el login en la misma dirección", async () => {
    renderAt("/admin");

    await expectLoginForm();

    expect(window.location.pathname).toBe("/admin");
    expect(serviceNotice()).not.toBeInTheDocument();
    expectNoProtectedContent();
  });

  it("2 · CORE apagado (error de red) conserva el login y muestra un aviso discreto", async () => {
    core.me = [{ kind: "network-error" }];

    renderAt("/admin");

    await expectLoginForm();

    expect(await screen.findByRole("status")).toHaveTextContent(
      /JUNG CORE no está disponible/,
    );

    expect(screen.queryByText(/HTTP \d{3}/)).not.toBeInTheDocument();
    expectNoProtectedContent();
  });

  it.each([500, 502, 503, 504])(
    "5 · HTTP %i de CORE conserva el login con aviso de servicio",
    async (status) => {
      core.me = [json(status, { message: `JUNG CORE respondió HTTP ${status}` })];

      renderAt("/admin");

      await expectLoginForm();

      expect(serviceNotice()).toBeInTheDocument();
      expect(screen.queryByText(new RegExp(`HTTP ${status}`))).not.toBeInTheDocument();
      expectNoProtectedContent();
    },
  );

  it("4 · HTTP 403 deniega el acceso administrativo sin mostrar el panel", async () => {
    core.me = [json(403)];

    renderAt("/admin");

    expect(
      await screen.findByText("Acceso administrativo denegado"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/no tiene acceso administrativo a Wooly/),
    ).toBeInTheDocument();

    expectNoProtectedContent();
  });

  it("4b · sesión válida sin acceso a la marca Wooly se trata como 403", async () => {
    core.me = [
      json(
        200,
        validSession([
          {
            role: "OWNER",
            brand: { ...WOOLY_BRAND, id: "brand-otra", slug: "otra" },
          },
        ]),
      ),
    ];

    renderAt("/admin");

    expect(
      await screen.findByText("Acceso administrativo denegado"),
    ).toBeInTheDocument();

    expectNoProtectedContent();
  });

  it("6 · sesión válida con acceso a Wooly muestra el panel en /admin", async () => {
    core.me = [json(200, validSession())];

    renderAt("/admin");

    expect(
      await screen.findByText("PANEL PRODUCTOS"),
    ).toBeInTheDocument();

    expect(window.location.pathname).toBe("/admin");
    expect(screen.queryByPlaceholderText("8 dígitos")).not.toBeInTheDocument();
  });

  it("6b · configuración administrativa inconsistente no abre el panel", async () => {
    core.me = [json(200, validSession())];
    core.configuration = json(200, {
      ...ADMIN_CONFIGURATION,
      data: { ...ADMIN_CONFIGURATION.data, brandId: "brand-otra" },
    });

    renderAt("/admin");

    await expectLoginForm();

    expect(serviceNotice()).toBeInTheDocument();
    expectNoProtectedContent();
  });

  it.each([
    "/admin/catalogos",
    "/admin/configuracion/catalogo",
    "/admin/commercial",
    "/admin/integrations/meta",
  ])(
    "7 · %s sin sesión vuelve a /admin y no muestra contenido protegido",
    async (path) => {
      renderAt(path);

      await expectLoginForm();

      expect(window.location.pathname).toBe("/admin");
      expectNoProtectedContent();
    },
  );

  it("7b · tras iniciar sesión se recupera la ruta interna solicitada", async () => {
    core.me = [json(401)];
    core.login = [json(200, validSession())];

    renderAt("/admin/catalogos?vista=pdf");

    await expectLoginForm();

    core.me = [json(200, validSession())];

    fillCredentials();

    fireEvent.click(
      screen.getByRole("button", { name: /Ingresar/ }),
    );

    expect(
      await screen.findByText("PANEL CATALOGOS"),
    ).toBeInTheDocument();

    expect(window.location.pathname).toBe("/admin/catalogos");
    expect(window.location.search).toBe("?vista=pdf");
  });

  it("8 · /admin/login redirige por compatibilidad a /admin", async () => {
    renderAt("/admin/login");

    await expectLoginForm();

    expect(window.location.pathname).toBe("/admin");
  });

  it("8b · /admin/login con sesión válida termina en el panel de /admin", async () => {
    core.me = [json(200, validSession())];

    renderAt("/admin/login");

    expect(
      await screen.findByText("PANEL PRODUCTOS"),
    ).toBeInTheDocument();

    expect(window.location.pathname).toBe("/admin");
  });

  it("9 · reintento controlado: conserva lo escrito y recupera el acceso cuando CORE vuelve", async () => {
    core.me = [{ kind: "network-error" }];

    renderAt("/admin");

    await expectLoginForm();

    fillCredentials();

    /* Reintento con CORE todavía apagado: el formulario sigue montado. */
    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Reintentar" }),
      ).toBeEnabled(),
    );

    expect(serviceNotice()).toBeInTheDocument();
    expect(screen.getByPlaceholderText("8 dígitos")).toHaveValue("12345678");

    /* CORE vuelve y existe una sesión válida. */
    core.me = [json(200, validSession())];

    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar" }),
    );

    expect(
      await screen.findByText("PANEL PRODUCTOS"),
    ).toBeInTheDocument();
  });

  it("9b · reintento con CORE disponible y sin sesión retira el aviso y mantiene el login", async () => {
    core.me = [json(503)];

    renderAt("/admin");

    await expectLoginForm();
    expect(serviceNotice()).toBeInTheDocument();

    core.me = [json(401)];

    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar" }),
    );

    await waitFor(() =>
      expect(serviceNotice()).not.toBeInTheDocument(),
    );

    await expectLoginForm();
  });

  it("10 · CORE sin respuesta: la espera está acotada y termina en el login con aviso", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    core.me = [{ kind: "pending" }];

    renderAt("/admin");

    expect(
      await screen.findByText("Validando sesión administrativa"),
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    await expectLoginForm();

    expect(serviceNotice()).toBeInTheDocument();
    expectNoProtectedContent();
  });

  it("10b · sin bucles: una sola comprobación de sesión y dirección estable", async () => {
    core.me = [json(401)];

    renderAt("/admin/login");

    await expectLoginForm();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(meCalls()).toBe(1);
    expect(window.location.pathname).toBe("/admin");
  });
});

describe("W12-03B · credenciales y sesión", () => {
  it("credenciales incorrectas muestran un error contextual sin destruir el formulario", async () => {
    core.me = [json(401)];
    core.login = [json(401)];

    renderAt("/admin");

    await expectLoginForm();

    fillCredentials();

    fireEvent.click(
      screen.getByRole("button", { name: /Ingresar/ }),
    );

    expect(
      await screen.findByText("DNI o contraseña incorrectos."),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("8 dígitos")).toHaveValue("12345678");
    expect(serviceNotice()).not.toBeInTheDocument();
    expectNoProtectedContent();
  });

  it("login con CORE apagado conserva el formulario y muestra el aviso de servicio", async () => {
    core.me = [json(401)];
    core.login = [{ kind: "network-error" }];

    renderAt("/admin");

    await expectLoginForm();

    fillCredentials();

    fireEvent.click(
      screen.getByRole("button", { name: /Ingresar/ }),
    );

    await waitFor(() =>
      expect(serviceNotice()).toBeInTheDocument(),
    );

    expect(screen.getByPlaceholderText("8 dígitos")).toHaveValue("12345678");
    expectNoProtectedContent();
  });

  it("login válido en /admin abre el panel sin cambiar de dirección", async () => {
    core.me = [json(401)];
    core.login = [json(200, validSession())];

    renderAt("/admin");

    await expectLoginForm();

    core.me = [json(200, validSession())];

    fillCredentials();

    fireEvent.click(
      screen.getByRole("button", { name: /Ingresar/ }),
    );

    expect(
      await screen.findByText("PANEL PRODUCTOS"),
    ).toBeInTheDocument();

    expect(window.location.pathname).toBe("/admin");

    const loginCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/admin-auth/login"),
    );

    expect(loginCall?.[1]).toMatchObject({
      method: "POST",
      credentials: "include",
    });
  });
});
