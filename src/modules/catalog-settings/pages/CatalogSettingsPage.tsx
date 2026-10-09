import {
  Layers3,
  Megaphone,
  ShieldCheck,
  Tags,
} from "lucide-react";

import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";

import {
  useAdminAuth,
} from "@/modules/admin-auth/context/AdminAuthContext";

import "./CatalogSettingsPage.css";

export default function CatalogSettingsPage() {
  const auth =
    useAdminAuth();

  const configuration =
    auth.configuration;

  const woolyAccess =
    auth.session
      ?.accesses
      .find(
        (access) =>
          access.brand.slug ===
          "wooly",
      );

  const role =
    String(
      woolyAccess?.role ??
        "",
    )
      .trim()
      .toUpperCase();

  const canWrite =
    role === "OWNER" ||
    role === "ADMIN";

  const categories =
    configuration
      ?.categories ??
    [];

  const campaigns =
    configuration
      ?.campaigns ??
    [];

  const badges =
    configuration
      ?.badgeDefinitions ??
    [];

  return (
    <AdminShell
      title="Configuración"
      subtitle="Datos maestros · JUNG CORE"
    >
      <main className="catalog-settings-page">
        <header className="catalog-settings-page__header">
          <div>
            <span className="catalog-settings-page__eyebrow">
              CONFIGURACIÓN DE CATÁLOGO
            </span>

            <h1>
              Datos maestros
            </h1>

            <p>
              Categorías, campañas y badges gobernados por JUNG CORE.
            </p>
          </div>

          <div
            className={
              canWrite
                ? "catalog-settings-page__permission is-write"
                : "catalog-settings-page__permission"
            }
          >
            <ShieldCheck
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              {canWrite
                ? `${role} · edición habilitada`
                : `${role || "SIN ROL"} · solo lectura`}
            </span>
          </div>
        </header>

        <section
          className="catalog-settings-page__summary"
          aria-label="Datos maestros disponibles"
        >
          <article>
            <div className="catalog-settings-page__icon">
              <Layers3
                size={18}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </div>

            <div>
              <span>
                Categorías
              </span>

              <strong>
                {categories.length}
              </strong>

              <small>
                Clasificación del catálogo
              </small>
            </div>
          </article>

          <article>
            <div className="catalog-settings-page__icon">
              <Megaphone
                size={18}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </div>

            <div>
              <span>
                Campañas
              </span>

              <strong>
                {campaigns.length}
              </strong>

              <small>
                Ventanas comerciales
              </small>
            </div>
          </article>

          <article>
            <div className="catalog-settings-page__icon">
              <Tags
                size={18}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </div>

            <div>
              <span>
                Badges
              </span>

              <strong>
                {badges.length}
              </strong>

              <small>
                Indicadores comerciales
              </small>
            </div>
          </article>
        </section>

        <section className="catalog-settings-page__foundation">
          <strong>
            Foundation conectada
          </strong>

          <p>
            La edición detallada se habilitará en el siguiente lote. Esta superficie ya consume el read model administrativo de JUNG CORE.
          </p>
        </section>
      </main>
    </AdminShell>
  );
}
