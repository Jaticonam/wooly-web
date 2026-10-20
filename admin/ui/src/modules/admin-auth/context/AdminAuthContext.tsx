import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AdminAuthHttpError,
  loadAdminSession,
  loadBrandAdminConfiguration,
  loginAdmin,
  logoutAdmin,
  type AdminConfigurationData,
  type AdminLoginCredentials,
  type AdminSessionView,
} from "../services/AdminAuthClient";

/*
 * W12-03B · Estados de acceso administrativo.
 *
 * - checking:      comprobación inicial de sesión (acotada por tiempo).
 * - anonymous:     sin sesión (HTTP 401) → se muestra el login.
 * - authenticated: sesión válida con acceso a Wooly validado por CORE.
 * - forbidden:     sesión válida sin acceso administrativo a Wooly (HTTP 403).
 * - unavailable:   JUNG CORE inaccesible, sin respuesta a tiempo o con error
 *                  de servidor (5xx u otra respuesta no válida). Se muestra el
 *                  login con un aviso de servicio; nunca contenido protegido.
 */
export type AdminAuthStatus =
  | "checking"
  | "anonymous"
  | "authenticated"
  | "forbidden"
  | "unavailable";

/* Espera máxima de la comprobación de sesión antes de declarar CORE no disponible. */
const ADMIN_SESSION_CHECK_TIMEOUT_MS = 8000;

const ADMIN_SERVICE_UNAVAILABLE_MESSAGE =
  "JUNG CORE no está disponible en este momento. Puedes ingresar tus datos y reintentar la conexión.";

const ADMIN_FORBIDDEN_MESSAGE =
  "Tu sesión es válida, pero no tiene acceso administrativo a Wooly.";

class AdminSessionCheckTimeoutError extends Error {
  constructor() {
    super("JUNG CORE no respondió a tiempo.");

    this.name = "AdminSessionCheckTimeoutError";
  }
}

interface AdminAuthRefreshOptions {
  /*
   * background: comprueba sin pasar por "checking", de modo que la
   * pantalla actual (por ejemplo, el formulario de login) se mantiene
   * montada durante el reintento.
   */
  readonly background?: boolean;
}

interface AdminAuthContextValue {
  readonly status: AdminAuthStatus;
  readonly session: AdminSessionView | null;
  readonly configuration: AdminConfigurationData | null;
  readonly error: string | null;

  /*
   * true mientras se ejecuta una comprobación en segundo plano (reintento).
   * Opcional para mantener compatibles los dobles de prueba existentes.
   */
  readonly refreshing?: boolean;

  login(
    credentials: AdminLoginCredentials,
  ): Promise<void>;

  logout(): Promise<void>;

  refresh(
    options?: AdminAuthRefreshOptions,
  ): Promise<void>;
}

const AdminAuthContext =
  createContext<AdminAuthContextValue | undefined>(
    undefined,
  );

function resolveErrorState(
  error: unknown,
): {
  status:
    | "anonymous"
    | "forbidden"
    | "unavailable";
  message: string | null;
} {
  if (
    error instanceof
      AdminAuthHttpError &&
    error.status === 401
  ) {
    return {
      status:
        "anonymous",
      message:
        null,
    };
  }

  if (
    error instanceof
      AdminAuthHttpError &&
    error.status === 403
  ) {
    return {
      status:
        "forbidden",
      message:
        ADMIN_FORBIDDEN_MESSAGE,
    };
  }

  /*
   * Política conservadora: cualquier otra falla (red, tiempo agotado,
   * HTTP 5xx, respuesta inconsistente) impide validar la autorización
   * actual. Se invalida la sesión local y se vuelve al login con aviso.
   */
  return {
    status:
      "unavailable",
    message:
      ADMIN_SERVICE_UNAVAILABLE_MESSAGE,
  };
}

function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new AdminSessionCheckTimeoutError(),
        ),
      timeoutMs,
    );

    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (reason: unknown) => {
        clearTimeout(timer);
        reject(reason);
      },
    );
  });
}

export function AdminAuthProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [
    status,
    setStatus,
  ] = useState<AdminAuthStatus>(
    "checking",
  );

  const [
    session,
    setSession,
  ] = useState<AdminSessionView | null>(
    null,
  );

  const [
    configuration,
    setConfiguration,
  ] = useState<AdminConfigurationData | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  /*
   * Secuencia de comprobaciones: solo la más reciente puede modificar
   * el estado. Evita que una respuesta tardía (por ejemplo, tras un
   * tiempo agotado) sobrescriba un resultado posterior.
   */
  const requestSequence =
    useRef(0);

  const hydrate =
    useCallback(
      async (): Promise<{
        session: AdminSessionView;
        configuration: AdminConfigurationData;
      }> => {
        const currentSession =
          await loadAdminSession();

        const woolyAccess =
          currentSession.accesses.find(
            (access) =>
              access.brand.slug ===
              "wooly",
          );

        if (!woolyAccess) {
          throw new AdminAuthHttpError(
            403,
            "Wooly access required",
          );
        }

        const configurationEnvelope =
          await loadBrandAdminConfiguration(
            woolyAccess.brand.id,
          );

        if (
          !configurationEnvelope.success ||
          configurationEnvelope.data.brandId !==
            woolyAccess.brand.id
        ) {
          throw new Error(
            "JUNG CORE devolvió una configuración administrativa inconsistente.",
          );
        }

        return {
          session:
            currentSession,
          configuration:
            configurationEnvelope.data,
        };
      },
      [],
    );

  const applyAuthenticated =
    useCallback(
      (
        result: {
          session: AdminSessionView;
          configuration: AdminConfigurationData;
        },
      ) => {
        setSession(
          result.session,
        );

        setConfiguration(
          result.configuration,
        );

        setError(
          null,
        );

        setStatus(
          "authenticated",
        );
      },
      [],
    );

  const applyFailure =
    useCallback(
      (
        failure: unknown,
      ) => {
        const resolved =
          resolveErrorState(
            failure,
          );

        setSession(
          null,
        );

        setConfiguration(
          null,
        );

        setError(
          resolved.message,
        );

        setStatus(
          resolved.status,
        );
      },
      [],
    );

  const refresh =
    useCallback(
      async (
        options?: AdminAuthRefreshOptions,
      ) => {
        const sequence =
          ++requestSequence.current;

        if (options?.background) {
          setRefreshing(
            true,
          );
        } else {
          setStatus(
            "checking",
          );
        }

        try {
          const result =
            await withTimeout(
              hydrate(),
              ADMIN_SESSION_CHECK_TIMEOUT_MS,
            );

          if (
            sequence ===
              requestSequence.current
          ) {
            applyAuthenticated(
              result,
            );
          }
        } catch (
          refreshError
        ) {
          if (
            sequence ===
              requestSequence.current
          ) {
            applyFailure(
              refreshError,
            );
          }
        } finally {
          if (
            sequence ===
              requestSequence.current
          ) {
            setRefreshing(
              false,
            );
          }
        }
      },
      [
        applyAuthenticated,
        applyFailure,
        hydrate,
      ],
    );

  /*
   * El login no pasa por "checking": el formulario permanece montado
   * (y conserva lo escrito) mientras se validan las credenciales.
   */
  const login =
    useCallback(
      async (
        credentials:
          AdminLoginCredentials,
      ) => {
        const sequence =
          ++requestSequence.current;

        setRefreshing(
          false,
        );

        try {
          await withTimeout(
            loginAdmin(
              credentials,
            ),
            ADMIN_SESSION_CHECK_TIMEOUT_MS,
          );

          const result =
            await withTimeout(
              hydrate(),
              ADMIN_SESSION_CHECK_TIMEOUT_MS,
            );

          if (
            sequence ===
              requestSequence.current
          ) {
            applyAuthenticated(
              result,
            );
          }
        } catch (
          loginError
        ) {
          if (
            sequence ===
              requestSequence.current
          ) {
            applyFailure(
              loginError,
            );
          }

          throw loginError;
        }
      },
      [
        applyAuthenticated,
        applyFailure,
        hydrate,
      ],
    );

  const logout =
    useCallback(
      async () => {
        ++requestSequence.current;

        setRefreshing(
          false,
        );

        try {
          await logoutAdmin();
        } catch {
          // El estado local se invalida igualmente.
        } finally {
          setSession(
            null,
          );

          setConfiguration(
            null,
          );

          setError(
            null,
          );

          setStatus(
            "anonymous",
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      void refresh();
    },
    [
      refresh,
    ],
  );

  return (
    <AdminAuthContext.Provider
      value={{
        status,
        session,
        configuration,
        error,
        refreshing,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth():
  AdminAuthContextValue {
  const context =
    useContext(
      AdminAuthContext,
    );

  if (!context) {
    throw new Error(
      "useAdminAuth requiere AdminAuthProvider.",
    );
  }

  return context;
}

export function useOptionalAdminAuth():
  AdminAuthContextValue | undefined {
  return useContext(
    AdminAuthContext,
  );
}
