import {
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAdminAuth,
} from "../context/AdminAuthContext";

import {
  AdminAuthHttpError,
} from "../services/AdminAuthClient";

interface LoginLocationState {
  readonly from?: string;
}

export default function AdminLoginPage() {
  const auth =
    useAdminAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    documentNumber,
    setDocumentNumber,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState<string | null>(
    null,
  );

  const destination =
    (
      location.state as
        | LoginLocationState
        | null
    )?.from ??
    "/admin";

  if (
    auth.status ===
      "authenticated"
  ) {
    return (
      <Navigate
        to={destination}
        replace
      />
    );
  }

  const submit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setSubmitError(
        null,
      );

      if (
        documentNumber.length !==
          8
      ) {
        setSubmitError(
          "Ingresa un DNI válido de 8 dígitos.",
        );

        return;
      }

      if (
        password.length < 8
      ) {
        setSubmitError(
          "La contraseña debe tener al menos 8 caracteres.",
        );

        return;
      }

      setSubmitting(
        true,
      );

      try {
        await auth.login({
          documentType:
            "DNI",
          documentNumber,
          password,
        });

        navigate(
          destination,
          {
            replace:
              true,
          },
        );
      } catch (
        error
      ) {
        if (
          error instanceof
            AdminAuthHttpError &&
          error.status ===
            401
        ) {
          setSubmitError(
            "DNI o contraseña incorrectos.",
          );
        } else if (
          error instanceof
            AdminAuthHttpError &&
          error.status ===
            403
        ) {
          setSubmitError(
            "Tu cuenta no tiene acceso administrativo a Wooly.",
          );
        } else {
          setSubmitError(
            "No se pudo conectar con JUNG CORE. Verifica que el servicio esté disponible.",
          );
        }
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbfc] text-slate-900">
      <div
        className="absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(8,127,156,.12), transparent 30%), radial-gradient(circle at 85% 80%, rgba(236,164,194,.13), transparent 32%)",
        }}
      />

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="hidden items-center justify-center px-14 lg:flex">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-900/10 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#087f9c] shadow-sm backdrop-blur">
              <ShieldCheck
                size={15}
              />
              Acceso seguro
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-[-0.04em] text-[#16213e]">
              Wooly
              <span className="block text-[#087f9c]">
                Admin 2.0
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-500">
              Tu espacio operativo para administrar productos, catálogos y las capacidades comerciales conectadas a JUNG CORE.
            </p>

            <div className="mt-10 grid max-w-md gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/60 px-4 py-3 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Sesión persistente protegida
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/60 px-4 py-3 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#087f9c]" />
                Autorización por marca desde JUNG CORE
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center border-l border-slate-200/70 bg-white/85 px-6 py-10 backdrop-blur-xl sm:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-9 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#1a9ab3] to-[#07667d] text-base font-black text-white shadow-lg shadow-cyan-900/15">
                W
              </div>

              <div>
                <strong className="block text-sm text-[#16213e]">
                  Wooly Admin
                </strong>

                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Workspace comercial
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#087f9c]">
                Iniciar sesión
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#16213e]">
                Bienvenido
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ingresa con tu documento y contraseña administrativa.
              </p>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={
                submit
              }
            >
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">
                  DNI
                </span>

                <div className="relative">
                  <UserRound
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />

                  <input
                    autoComplete="username"
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    required
                    value={
                      documentNumber
                    }
                    onChange={(event) =>
                      setDocumentNumber(
                        event.target.value
                          .replace(
                            /\D/g,
                            "",
                          )
                          .slice(
                            0,
                            8,
                          ),
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#087f9c] focus:ring-4 focus:ring-[#087f9c]/10"
                    placeholder="8 dígitos"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">
                  Contraseña
                </span>

                <div className="relative">
                  <LockKeyhole
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={
                      password
                    }
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-12 text-sm font-semibold outline-none transition focus:border-[#087f9c] focus:ring-4 focus:ring-[#087f9c]/10"
                    placeholder="Tu contraseña"
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={17}
                      />
                    ) : (
                      <Eye
                        size={17}
                      />
                    )}
                  </button>
                </div>
              </label>

              {submitError ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {submitError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#087f9c] px-5 text-sm font-black text-white shadow-lg shadow-cyan-900/15 transition hover:bg-[#07667d] disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      className="animate-spin"
                      size={17}
                    />
                    Validando…
                  </>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight
                      size={17}
                    />
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-[11px] leading-5 text-slate-400">
              La sesión se valida directamente con JUNG CORE. La contraseña no se almacena en Wooly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
