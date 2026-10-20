import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

export type AdminAuthStatus =
  | "checking"
  | "anonymous"
  | "authenticated"
  | "forbidden"
  | "error";

interface AdminAuthContextValue {
  readonly status: AdminAuthStatus;
  readonly session: AdminSessionView | null;
  readonly configuration: AdminConfigurationData | null;
  readonly error: string | null;

  login(
    credentials: AdminLoginCredentials,
  ): Promise<void>;

  logout(): Promise<void>;

  refresh(): Promise<void>;
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
    | "error";
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
        "Tu sesión es válida, pero no tiene acceso administrativo a Wooly.",
    };
  }

  return {
    status:
      "error",
    message:
      error instanceof Error
        ? error.message
        : "No se pudo validar la sesión administrativa.",
  };
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

  const hydrate =
    useCallback(
      async () => {
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

        setSession(
          currentSession,
        );

        setConfiguration(
          configurationEnvelope.data,
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

  const refresh =
    useCallback(
      async () => {
        setStatus(
          "checking",
        );

        try {
          await hydrate();
        } catch (
          refreshError
        ) {
          const resolved =
            resolveErrorState(
              refreshError,
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
        }
      },
      [
        hydrate,
      ],
    );

  const login =
    useCallback(
      async (
        credentials:
          AdminLoginCredentials,
      ) => {
        setStatus(
          "checking",
        );

        setError(
          null,
        );

        try {
          await loginAdmin(
            credentials,
          );

          await hydrate();
        } catch (
          loginError
        ) {
          const resolved =
            resolveErrorState(
              loginError,
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

          throw loginError;
        }
      },
      [
        hydrate,
      ],
    );

  const logout =
    useCallback(
      async () => {
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
