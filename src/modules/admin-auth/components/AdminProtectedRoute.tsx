import {
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAdminAuth,
} from "../context/AdminAuthContext";

export default function AdminProtectedRoute() {
  const auth =
    useAdminAuth();

  const location =
    useLocation();

  if (
    auth.status ===
      "checking"
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
        <div className="text-center text-slate-600">
          <LoaderCircle
            className="mx-auto mb-3 animate-spin"
            size={28}
          />

          <strong className="block text-sm">
            Validando sesión administrativa
          </strong>

          <span className="mt-1 block text-xs text-slate-400">
            JUNG CORE
          </span>
        </div>
      </main>
    );
  }

  if (
    auth.status ===
      "anonymous"
  ) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from:
            `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  if (
    auth.status ===
      "forbidden" ||
    auth.status ===
      "error"
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <ShieldAlert
              size={24}
            />
          </div>

          <h1 className="mt-5 text-xl font-black text-slate-900">
            No se pudo abrir Wooly Admin
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {auth.error ??
              "La sesión no tiene acceso administrativo a Wooly."}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
              onClick={() =>
                void auth.refresh()
              }
            >
              <RefreshCw
                size={15}
              />
              Reintentar
            </button>

            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
              onClick={() =>
                void auth.logout()
              }
            >
              Salir
            </button>
          </div>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
