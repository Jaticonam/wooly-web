import {
  useState,
} from "react";

import {
  ImageOff,
  Layers3,
  Megaphone,
  Pencil,
  Plus,
  ShieldCheck,
  Tags,
} from "lucide-react";

import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";

import {
  useAdminAuth,
} from "@/modules/admin-auth/context/AdminAuthContext";

import type {
  AdminReferenceMediaAsset,
} from "@/modules/admin-auth/services/AdminAuthClient";

import CatalogMasterFormModal, {
  type CatalogMasterEditor,
} from "@/modules/catalog-settings/components/CatalogMasterFormModal";

import "./CatalogSettingsPage.css";

type CatalogSettingsTab =
  | "categories"
  | "campaigns"
  | "badges";

function mediaUrl(
  asset:
    AdminReferenceMediaAsset | null,
): string | null {
  if (!asset) {
    return null;
  }

  return (
    asset.thumbnailUrl ||
    asset.publicUrl ||
    null
  );
}

function statusLabel(
  value: string,
): string {
  const normalized =
    String(value ?? "")
      .trim()
      .toUpperCase();

  return (
    {
      ACTIVE:
        "Publicado",

      INACTIVE:
        "Oculto",

      ARCHIVED:
        "Archivado",

      PUBLISHED:
        "Publicado",

      DRAFT:
        "Borrador",

      HIDDEN:
        "Oculto",
    } as Record<
      string,
      string
    >
  )[normalized] ??
    normalized;
}

function statusTone(
  value: string,
): string {
  const normalized =
    String(value ?? "")
      .trim()
      .toUpperCase();

  if (
    normalized === "ACTIVE" ||
    normalized === "PUBLISHED"
  ) {
    return "is-positive";
  }

  if (
    normalized === "INACTIVE" ||
    normalized === "HIDDEN"
  ) {
    return "is-muted";
  }

  if (
    normalized === "ARCHIVED"
  ) {
    return "is-archived";
  }

  return "is-warning";
}

function formatDate(
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      timeZone:
        "UTC",
    },
  ).format(parsed);
}

function CampaignDates({
  startsAt,
  endsAt,
}: {
  readonly startsAt:
    string | null;

  readonly endsAt:
    string | null;
}) {
  const start =
    formatDate(
      startsAt,
    );

  const end =
    formatDate(
      endsAt,
    );

  if (!start && !end) {
    return (
      <span className="catalog-settings-page__secondary">
        Sin fechas
      </span>
    );
  }

  return (
    <div className="catalog-settings-page__dateRange">
      <strong>
        {start ??
          "Inicio abierto"}
      </strong>

      <span>
        {end
          ? `hasta ${end}`
          : "sin fecha de fin"}
      </span>
    </div>
  );
}

function OgPreview({
  asset,
  label,
}: {
  readonly asset:
    AdminReferenceMediaAsset | null;

  readonly label:
    string;
}) {
  const url =
    mediaUrl(
      asset,
    );

  if (!url) {
    return (
      <div
        className="catalog-settings-page__ogPlaceholder"
        title="Sin imagen OG"
      >
        <ImageOff
          size={16}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <span>
          Sin OG
        </span>
      </div>
    );
  }

  return (
    <div className="catalog-settings-page__ogPreview">
      <img
        src={url}
        alt={`OG ${label}`}
      />
    </div>
  );
}

export default function CatalogSettingsPage() {
  const auth =
    useAdminAuth();

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<CatalogSettingsTab>(
      "categories",
    );

  const [
    editor,
    setEditor,
  ] =
    useState<CatalogMasterEditor | null>(
      null,
    );

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

  const activeKind =
    activeTab ===
    "categories"
      ? "category"
      : activeTab ===
        "campaigns"
        ? "campaign"
        : "badge";

  const createLabel =
    activeKind ===
    "category"
      ? "Nueva categoría"
      : activeKind ===
        "campaign"
        ? "Nueva campaña"
        : "Nuevo badge";

  const openCreate =
    () => {
      if (!canWrite) {
        return;
      }

      if (
        activeKind ===
        "category"
      ) {
        setEditor({
          kind:
            "category",

          entity:
            null,
        });

        return;
      }

      if (
        activeKind ===
        "campaign"
      ) {
        setEditor({
          kind:
            "campaign",

          entity:
            null,
        });

        return;
      }

      setEditor({
        kind:
          "badge",

        entity:
          null,
      });
    };

  const openEdit =
    (
      nextEditor:
        CatalogMasterEditor,
    ) => {
      if (!canWrite) {
        return;
      }

      setEditor(
        nextEditor,
      );
    };

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

        <section className="catalog-settings-page__registry">
          <header className="catalog-settings-page__registryHeader">
            <div>
              <span>
                MAESTROS CANÓNICOS
              </span>

              <strong>
                Configuración comercial
              </strong>

              <p>
                Consulta y administra la definición vigente gobernada por JUNG CORE.
              </p>
            </div>

            {canWrite ? (
              <button
                type="button"
                className="catalog-settings-page__registryAction"
                onClick={
                  openCreate
                }
              >
                <Plus
                  size={15}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />

                <span>
                  {createLabel}
                </span>
              </button>
            ) : null}
          </header>

          <div
            className="catalog-settings-page__tabs"
            role="tablist"
            aria-label="Maestros de catálogo"
          >
            <button
              type="button"
              role="tab"
              aria-selected={
                activeTab ===
                "categories"
              }
              className={
                activeTab ===
                "categories"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "categories",
                )
              }
            >
              <Layers3
                size={15}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                Categorías
              </span>

              <small>
                {categories.length}
              </small>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                activeTab ===
                "campaigns"
              }
              className={
                activeTab ===
                "campaigns"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "campaigns",
                )
              }
            >
              <Megaphone
                size={15}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                Campañas
              </span>

              <small>
                {campaigns.length}
              </small>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                activeTab ===
                "badges"
              }
              className={
                activeTab ===
                "badges"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "badges",
                )
              }
            >
              <Tags
                size={15}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                Badges
              </span>

              <small>
                {badges.length}
              </small>
            </button>
          </div>

          {activeTab ===
          "categories" ? (
            <div
              className="catalog-settings-page__tableWrap"
              role="tabpanel"
            >
              {categories.length >
              0 ? (
                <table className="catalog-settings-page__table">
                  <thead>
                    <tr>
                      <th>
                        OG
                      </th>

                      <th>
                        Categoría
                      </th>

                      <th>
                        ID categoría / slug
                      </th>

                      <th>
                        Prioridad
                      </th>

                      <th>
                        Estado
                      </th>

                      {canWrite ? (
                        <th>
                          Acciones
                        </th>
                      ) : null}
                    </tr>
                  </thead>

                  <tbody>
                    {categories.map(
                      (
                        category,
                      ) => (
                        <tr
                          key={
                            category.id
                          }
                        >
                          <td>
                            <OgPreview
                              asset={
                                category.ogMediaAsset
                              }
                              label={
                                category.name
                              }
                            />
                          </td>

                          <td>
                            <div className="catalog-settings-page__primary">
                              <strong>
                                {
                                  category.name
                                }
                              </strong>

                              <span>
                                {category.description ||
                                  "Sin descripción"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="catalog-settings-page__codes">
                              <code>
                                {
                                  category.code
                                }
                              </code>

                              <span>
                                /
                                {
                                  category.slug
                                }
                              </span>
                            </div>
                          </td>

                          <td>
                            <strong className="catalog-settings-page__priority">
                              {
                                category.priority
                              }
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`catalog-settings-page__status ${statusTone(
                                category.status,
                              )}`}
                            >
                              {
                                statusLabel(
                                  category.status,
                                )
                              }
                            </span>
                          </td>

                          {canWrite ? (
                            <td>
                              <button
                                type="button"
                                className="catalog-settings-page__rowAction"
                                aria-label={`Editar categoría ${category.name}`}
                                onClick={() =>
                                  openEdit({
                                    kind:
                                      "category",

                                    entity:
                                      category,
                                  })
                                }
                              >
                                <Pencil
                                  size={13}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />

                                <span>
                                  Editar
                                </span>
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="catalog-settings-page__empty">
                  <Layers3
                    size={26}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />

                  <strong>
                    Sin categorías
                  </strong>

                  <span>
                    JUNG CORE todavía no registra categorías para Wooly.
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {activeTab ===
          "campaigns" ? (
            <div
              className="catalog-settings-page__tableWrap"
              role="tabpanel"
            >
              {campaigns.length >
              0 ? (
                <table className="catalog-settings-page__table">
                  <thead>
                    <tr>
                      <th>
                        OG
                      </th>

                      <th>
                        Campaña
                      </th>

                      <th>
                        Fechas
                      </th>

                      <th>
                        Prioridad
                      </th>

                      <th>
                        Publicación
                      </th>

                      {canWrite ? (
                        <th>
                          Acciones
                        </th>
                      ) : null}
                    </tr>
                  </thead>

                  <tbody>
                    {campaigns.map(
                      (
                        campaign,
                      ) => (
                        <tr
                          key={
                            campaign.id
                          }
                        >
                          <td>
                            <OgPreview
                              asset={
                                campaign.ogMediaAsset
                              }
                              label={
                                campaign.name
                              }
                            />
                          </td>

                          <td>
                            <div className="catalog-settings-page__primary">
                              <strong>
                                {
                                  campaign.name
                                }
                              </strong>

                              <span>
                                {
                                  campaign.code
                                } · /
                                {
                                  campaign.slug
                                }
                              </span>
                            </div>
                          </td>

                          <td>
                            <CampaignDates
                              startsAt={
                                campaign.startsAt
                              }
                              endsAt={
                                campaign.endsAt
                              }
                            />
                          </td>

                          <td>
                            <strong className="catalog-settings-page__priority">
                              {
                                campaign.priority
                              }
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`catalog-settings-page__status ${statusTone(
                                campaign.publicationStatus,
                              )}`}
                            >
                              {
                                statusLabel(
                                  campaign.publicationStatus,
                                )
                              }
                            </span>
                          </td>

                          {canWrite ? (
                            <td>
                              <button
                                type="button"
                                className="catalog-settings-page__rowAction"
                                aria-label={`Editar campaña ${campaign.name}`}
                                onClick={() =>
                                  openEdit({
                                    kind:
                                      "campaign",

                                    entity:
                                      campaign,
                                  })
                                }
                              >
                                <Pencil
                                  size={13}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />

                                <span>
                                  Editar
                                </span>
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="catalog-settings-page__empty">
                  <Megaphone
                    size={26}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />

                  <strong>
                    Sin campañas canónicas
                  </strong>

                  <span>
                    Wooly todavía no tiene campañas registradas en JUNG CORE.
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {activeTab ===
          "badges" ? (
            <div
              className="catalog-settings-page__tableWrap"
              role="tabpanel"
            >
              {badges.length >
              0 ? (
                <table className="catalog-settings-page__table">
                  <thead>
                    <tr>
                      <th>
                        Badge
                      </th>

                      <th>
                        Código
                      </th>

                      <th>
                        Tipo
                      </th>

                      <th>
                        Theme token
                      </th>

                      <th>
                        Prioridad
                      </th>

                      <th>
                        Estado
                      </th>

                      {canWrite ? (
                        <th>
                          Acciones
                        </th>
                      ) : null}
                    </tr>
                  </thead>

                  <tbody>
                    {badges.map(
                      (
                        badge,
                      ) => (
                        <tr
                          key={
                            badge.id
                          }
                        >
                          <td>
                            <div className="catalog-settings-page__badgeIdentity">
                              <span
                                aria-hidden="true"
                              >
                                {badge.icon ||
                                  "•"}
                              </span>

                              <strong>
                                {
                                  badge.label
                                }
                              </strong>
                            </div>
                          </td>

                          <td>
                            <code>
                              {
                                badge.code
                              }
                            </code>
                          </td>

                          <td>
                            <span className="catalog-settings-page__secondary">
                              {
                                badge.kind
                              }
                            </span>
                          </td>

                          <td>
                            <code>
                              {badge.themeToken ||
                                "—"}
                            </code>
                          </td>

                          <td>
                            <strong className="catalog-settings-page__priority">
                              {
                                badge.priority
                              }
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`catalog-settings-page__status ${statusTone(
                                badge.status,
                              )}`}
                            >
                              {
                                statusLabel(
                                  badge.status,
                                )
                              }
                            </span>
                          </td>

                          {canWrite ? (
                            <td>
                              <button
                                type="button"
                                className="catalog-settings-page__rowAction"
                                aria-label={`Editar badge ${badge.label}`}
                                onClick={() =>
                                  openEdit({
                                    kind:
                                      "badge",

                                    entity:
                                      badge,
                                  })
                                }
                              >
                                <Pencil
                                  size={13}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />

                                <span>
                                  Editar
                                </span>
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="catalog-settings-page__empty">
                  <Tags
                    size={26}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />

                  <strong>
                    Sin badges canónicos
                  </strong>

                  <span>
                    Wooly todavía no tiene badges registrados en JUNG CORE.
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </section>

        <CatalogMasterFormModal
          open={
            editor !==
            null
          }
          brandId={
            configuration
              ?.brandId ??
            ""
          }
          canWrite={
            canWrite
          }
          editor={
            editor
          }
          onClose={() =>
            setEditor(
              null,
            )
          }
          onSaved={async () => {
            setEditor(
              null,
            );

            await auth.refresh();
          }}
        />
      </main>
    </AdminShell>
  );
}
