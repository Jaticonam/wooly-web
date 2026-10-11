import { NavLink, useLocation } from "react-router-dom";
import { Database, ExternalLink, Images, Sheet, Workflow } from "lucide-react";

import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";
import SheetsMasterPanel from "@/modules/products-admin/components/SheetsMasterPanel/SheetsMasterPanel";
import { useQueryClient } from "@tanstack/react-query";

const basePath = "/admin/integrations";

const sections = [
  { slug: "google-sheets", label: "Google Sheets", icon: Sheet },
  { slug: "jung-core", label: "JUNG CORE", icon: Database },
  { slug: "cloudflare-r2", label: "Cloudflare R2", icon: Images },
] as const;

export default function IntegrationsPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const refreshProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products-admin"] });
  };

  const segment = location.pathname.replace(/\/+$/, "").slice(basePath.length);
  const section = segment.startsWith("/") ? segment.slice(1) : segment;
  const validSection = sections.some((item) => item.slug === section);

  return (
    <AdminShell title="Integraciones">
      <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-700">
            <Workflow size={16} aria-hidden="true" />
            INTEGRATIONS
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Centro de Integraciones
          </h1>
          <p className="text-sm text-slate-600">
            Conexiones, sincronización y servicios vinculados a Wooly Admin.
          </p>
        </header>

        <nav aria-label="Servicios integrados" className="flex flex-wrap gap-2">
          <NavLink
            to={basePath}
            end
            className={({ isActive }) =>
              "rounded-lg border px-4 py-2 text-sm font-semibold " +
              (isActive ? "border-cyan-400 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-600")
            }
          >
            Resumen
          </NavLink>
          {sections.map(({ slug, label, icon: Icon }) => (
            <NavLink
              key={slug}
              to={`${basePath}/${slug}`}
              className={({ isActive }) =>
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold " +
                (isActive ? "border-cyan-400 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-600")
              }
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        {!section ? (
          <div className="grid gap-4 md:grid-cols-3">
            {sections.map(({ slug, label, icon: Icon }) => (
              <NavLink
                key={slug}
                to={`${basePath}/${slug}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300"
              >
                <Icon size={23} className="text-cyan-700" aria-hidden="true" />
                <h2 className="mt-3 text-base font-semibold text-slate-900">{label}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {slug === "google-sheets"
                    ? "Validación e importación incremental de productos."
                    : slug === "jung-core"
                      ? "Consulta de productos y servicios centrales."
                      : "Gestión de recursos multimedia. Integración pendiente."}
                </p>
              </NavLink>
            ))}
          </div>
        ) : null}

        {section === "google-sheets" ? (
          <SheetsMasterPanel onSynced={refreshProducts} />
        ) : null}

        {section === "jung-core" ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">JUNG CORE</h2>
            <p className="mt-2 text-sm text-slate-600">
              Wooly Admin consume productos desde la API central.
              Las operaciones de catálogo se mantienen en sus módulos existentes.
            </p>
            <NavLink to="/admin" className="mt-4 inline-block text-sm font-semibold text-cyan-700">
              Abrir Product Explorer
            </NavLink>
          </section>
        ) : null}

        {section === "cloudflare-r2" ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Cloudflare R2</h2>
            <p className="mt-2 text-sm text-slate-600">
              Integración de imágenes pendiente. No se habilitan operaciones de carga ni sincronización.
            </p>
          </section>
        ) : null}

        {!section ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Canales comerciales</h2>
            <div className="mt-3 rounded-lg border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-800">Meta Commerce</h3>
              <p className="mt-1 text-sm text-slate-500">
                Facebook Shop · Instagram Shopping · WhatsApp Catálogo
              </p>
              <a
                href="/api/exports/meta.csv"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700"
              >
                Ver feed <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Google Merchant, Pinterest y Mercado Libre: conectores futuros.
            </p>
          </section>
        ) : null}

        {section && !validSection ? (
          <p role="alert" className="text-sm text-red-700">
            Integración no encontrada.
          </p>
        ) : null}
      </main>
    </AdminShell>
  );
}