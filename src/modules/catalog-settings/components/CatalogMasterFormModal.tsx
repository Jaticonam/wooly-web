import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";

import {
  createAdminBadge,
  createAdminCampaign,
  createAdminCategory,
  updateAdminBadge,
  updateAdminCampaign,
  updateAdminCategory,
  type AdminBadgeDefinition,
  type AdminCampaignDefinition,
  type AdminCategoryDefinition,
} from "@/modules/admin-auth/services/AdminAuthClient";

import "./CatalogMasterFormModal.css";

export type CatalogMasterEditor =
  | {
      readonly kind: "category";
      readonly entity:
        AdminCategoryDefinition | null;
    }
  | {
      readonly kind: "campaign";
      readonly entity:
        AdminCampaignDefinition | null;
    }
  | {
      readonly kind: "badge";
      readonly entity:
        AdminBadgeDefinition | null;
    };

interface CatalogMasterFormModalProps {
  readonly open: boolean;
  readonly brandId: string;
  readonly canWrite: boolean;
  readonly editor:
    CatalogMasterEditor | null;
  readonly onClose: () => void;
  readonly onSaved:
    () => Promise<void> | void;
}

interface CatalogMasterFormState {
  code: string;
  name: string;
  slug: string;
  description: string;

  priority: string;

  status: string;

  ogMediaRef: string;

  icon: string;
  color: string;
  accentColor: string;
  themeToken: string;

  startsAt: string;
  endsAt: string;

  publicationStatus: string;

  label: string;
  kind: string;
}

const EMPTY_FORM:
  CatalogMasterFormState = {
    code: "",
    name: "",
    slug: "",
    description: "",

    priority: "0",

    status: "ACTIVE",

    ogMediaRef: "",

    icon: "",
    color: "",
    accentColor: "",
    themeToken: "",

    startsAt: "",
    endsAt: "",

    publicationStatus:
      "DRAFT",

    label: "",
    kind: "merchandising",
  };

function localDateTimeValue(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return "";
  }

  const offset =
    parsed.getTimezoneOffset();

  return new Date(
    parsed.getTime() -
      offset * 60_000,
  )
    .toISOString()
    .slice(
      0,
      16,
    );
}

const ACCENT_COLOR_PATTERN =
  /^#[0-9A-F]{6}$/;

function normalizeAccentColor(
  value: string,
): string | null {
  const normalized =
    value
      .trim()
      .toUpperCase();

  return normalized || null;
}

function categoryIdentityFromName(
  value: string,
): string {
  return value
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

function colorPickerValue(
  value: string,
): string {
  const normalized =
    normalizeAccentColor(
      value,
    );

  return (
    normalized &&
    ACCENT_COLOR_PATTERN.test(
      normalized,
    )
  )
    ? normalized
    : "#1D8299";
}

interface AccentColorFieldProps {
  readonly value: string;
  readonly disabled: boolean;
  readonly wide?: boolean;
  readonly helperText?: string;
  readonly onChange:
    (value: string) => void;
}

function AccentColorField({
  value,
  disabled,
  wide = true,
  helperText =
    "Color comercial portable para web, PDF, imágenes y otros canales. Formato #RRGGBB.",
  onChange,
}: AccentColorFieldProps) {
  return (
    <fieldset
      className={
        wide
          ? "catalog-master-form__colorField is-wide"
          : "catalog-master-form__colorField"
      }
    >
      <legend>
        Color
      </legend>

      <div className="catalog-master-form__colorControl">
        <input
          className="catalog-master-form__colorPicker"
          type="color"
          aria-label="Selector de color"
          value={
            colorPickerValue(
              value,
            )
          }
          onChange={(
            event,
          ) =>
            onChange(
              event.target.value
                .toUpperCase(),
            )
          }
          disabled={
            disabled
          }
        />

        <input
          className="catalog-master-form__colorHex"
          aria-label="Color hexadecimal"
          value={
            value
          }
          onChange={(
            event,
          ) =>
            onChange(
              event.target.value
                .toUpperCase(),
            )
          }
          disabled={
            disabled
          }
          placeholder="#E94F8A"
          maxLength={
            7
          }
          spellCheck={
            false
          }
        />
      </div>

      <small>
        {helperText}
      </small>
    </fieldset>
  );
}

function resolveInitialForm(
  editor:
    CatalogMasterEditor | null,
): CatalogMasterFormState {
  if (!editor) {
    return {
      ...EMPTY_FORM,
    };
  }

  if (
    editor.kind ===
    "category"
  ) {
    const entity =
      editor.entity;

    if (!entity) {
      return {
        ...EMPTY_FORM,

        status:
          "DRAFT",
      };
    }

    return {
      ...EMPTY_FORM,

      code:
        entity.code,

      name:
        entity.name,

      slug:
        entity.slug,

      description:
        entity.description ??
        "",

      icon:
        entity.icon ??
        "",

      accentColor:
        entity.accentColor ??
        "",

      priority:
        String(
          entity.priority,
        ),

      status:
        entity.status,

      ogMediaRef:
        entity.ogMediaAsset
          ?.originalFilename ??
        entity.ogMediaAsset
          ?.mediaCode ??
        "",
    };
  }

  if (
    editor.kind ===
    "campaign"
  ) {
    const entity =
      editor.entity;

    if (!entity) {
      return {
        ...EMPTY_FORM,

        publicationStatus:
          "DRAFT",
      };
    }

    return {
      ...EMPTY_FORM,

      code:
        entity.code,

      name:
        entity.name,

      description:
        entity.description ??
        "",

      slug:
        entity.slug,

      priority:
        String(
          entity.priority,
        ),

      ogMediaRef:
        entity.ogMediaAsset
          ?.originalFilename ??
        entity.ogMediaAsset
          ?.mediaCode ??
        "",

      icon:
        entity.icon ??
        "",

      color:
        entity.color ??
        "",

      accentColor:
        entity.accentColor ??
        "",

      themeToken:
        entity.themeToken ??
        "",

      startsAt:
        localDateTimeValue(
          entity.startsAt,
        ),

      endsAt:
        localDateTimeValue(
          entity.endsAt,
        ),

      publicationStatus:
        entity.publicationStatus,
    };
  }

  const entity =
    editor.entity;

  if (!entity) {
    return {
      ...EMPTY_FORM,

      kind:
        "merchandising",

      status:
        "ACTIVE",
    };
  }

  return {
    ...EMPTY_FORM,

    code:
      entity.code,

    label:
      entity.label,

    icon:
      entity.icon ??
      "",

    accentColor:
      entity.accentColor ??
      "",

    kind:
      entity.kind,

    themeToken:
      entity.themeToken ??
      "",

    priority:
      String(
        entity.priority,
      ),

    status:
      entity.status,
  };
}

function editorTitle(
  editor:
    CatalogMasterEditor,
): string {
  const editing =
    Boolean(
      editor.entity,
    );

  if (
    editor.kind ===
    "category"
  ) {
    return editing
      ? "Editar categoría"
      : "Nueva categoría";
  }

  if (
    editor.kind ===
    "campaign"
  ) {
    return editing
      ? "Editar campaña"
      : "Nueva campaña";
  }

  return editing
    ? "Editar badge"
    : "Nuevo badge";
}

function saveLabel(
  editor:
    CatalogMasterEditor,
): string {
  if (editor.entity) {
    return "Guardar cambios";
  }

  if (
    editor.kind ===
    "category"
  ) {
    return "Crear categoría";
  }

  if (
    editor.kind ===
    "campaign"
  ) {
    return "Crear campaña";
  }

  return "Crear badge";
}

function parsePriority(
  value: string,
): number | null {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(
      parsed,
    ) ||
    parsed < 0
  ) {
    return null;
  }

  return parsed;
}

export default function CatalogMasterFormModal({
  open,
  brandId,
  canWrite,
  editor,
  onClose,
  onSaved,
}: CatalogMasterFormModalProps) {
  const [
    form,
    setForm,
  ] =
    useState<CatalogMasterFormState>(
      EMPTY_FORM,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(
    () => {
      setForm(
        resolveInitialForm(
          editor,
        ),
      );

      setError(
        null,
      );

      setSaving(
        false,
      );
    },
    [
      editor,
      open,
    ],
  );

  if (!editor) {
    return null;
  }

  const updateField =
    (
      field:
        keyof CatalogMasterFormState,
      value:
        string,
    ) => {
      setForm(
        (
          current,
        ) => ({
          ...current,

          [field]:
            value,
        }),
      );
    };

  const submit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        !canWrite
      ) {
        setError(
          "Tu rol no permite modificar datos maestros.",
        );

        return;
      }

      const priority =
        parsePriority(
          form.priority,
        );

      if (
        priority ===
        null
      ) {
        setError(
          "La prioridad debe ser un entero igual o mayor a 0.",
        );

        return;
      }


      const ogMediaRef =
        form.ogMediaRef
          .trim() ||
        null;

      const accentColor =
        normalizeAccentColor(
          form.accentColor,
        );

      if (
        accentColor !== null &&
        !ACCENT_COLOR_PATTERN.test(
          accentColor,
        )
      ) {
        setError(
          "El color debe usar formato hexadecimal #RRGGBB. Ejemplo: #E94F8A.",
        );

        return;
      }

      setError(
        null,
      );

      setSaving(
        true,
      );

      try {
        if (
          editor.kind ===
          "category"
        ) {
          const name =
            form.name.trim();

          const generatedIdentity =
            categoryIdentityFromName(
              name,
            );

          const categoryCode =
            editor.entity
              ?.code ??
            generatedIdentity;

          const categorySlug =
            editor.entity
              ?.slug ??
            generatedIdentity;

          if (!name) {
            throw new Error(
              "El nombre de la categoría es obligatorio.",
            );
          }

          if (
            !categoryCode ||
            !categorySlug
          ) {
            throw new Error(
              "No fue posible generar la identidad interna de la categoría.",
            );
          }

          const input = {
            code:
              categoryCode,

            name,

            icon:
              form.icon.trim() ||
              null,

            slug:
              categorySlug,

            description:
              form.description.trim(),

            accentColor,

            priority,

            status:
              form.status,

            ogMediaRef,
          };

          if (
            editor.entity
          ) {
            await updateAdminCategory(
              brandId,
              editor.entity.id,
              input,
            );
          } else {
            await createAdminCategory(
              brandId,
              input,
            );
          }
        }
        if (
          editor.kind ===
          "campaign"
        ) {
          const name =
            form.name.trim();

          const generatedIdentity =
            categoryIdentityFromName(
              name,
            );

          const campaignCode =
            editor.entity
              ?.code ??
            generatedIdentity;

          const campaignSlug =
            editor.entity
              ?.slug ??
            generatedIdentity;

          if (!name) {
            throw new Error(
              "El nombre de la campaña es obligatorio.",
            );
          }

          if (
            !campaignCode ||
            !campaignSlug
          ) {
            throw new Error(
              "No fue posible generar la identidad interna de la campaña.",
            );
          }

          const startsAtDate =
            form.startsAt
              ? new Date(
                  form.startsAt,
                )
              : null;

          const endsAtDate =
            form.endsAt
              ? new Date(
                  form.endsAt,
                )
              : null;

          if (
            startsAtDate &&
            Number.isNaN(
              startsAtDate.getTime(),
            )
          ) {
            throw new Error(
              "La fecha de inicio no es válida.",
            );
          }

          if (
            endsAtDate &&
            Number.isNaN(
              endsAtDate.getTime(),
            )
          ) {
            throw new Error(
              "La fecha de fin no es válida.",
            );
          }

          if (
            startsAtDate &&
            endsAtDate &&
            endsAtDate.getTime() <
              startsAtDate.getTime()
          ) {
            throw new Error(
              "La fecha de fin no puede ser anterior al inicio.",
            );
          }

          const startsAt =
            startsAtDate
              ? startsAtDate.toISOString()
              : null;

          const endsAt =
            endsAtDate
              ? endsAtDate.toISOString()
              : null;

          const input = {
            code:
              campaignCode,

            slug:
              campaignSlug,

            name,

            description:
              form.description.trim() ||
              null,

            icon:
              form.icon.trim() ||
              undefined,

            accentColor,

            startsAt,
            endsAt,

            priority,

            publicationStatus:
              form.publicationStatus,

            ogMediaRef,
          };

          if (
            editor.entity
          ) {
            await updateAdminCampaign(
              brandId,
              editor.entity.id,
              input,
            );
          } else {
            await createAdminCampaign(
              brandId,
              input,
            );
          }
        }
        if (
          editor.kind ===
          "badge"
        ) {
          const label =
            form.label.trim();

          if (!label) {
            throw new Error(
              "El nombre del badge es obligatorio.",
            );
          }

          const generatedSegment =
            categoryIdentityFromName(
              label,
            );

          if (!generatedSegment) {
            throw new Error(
              "No fue posible generar la identidad interna del badge.",
            );
          }

          const badgeCode =
            editor.entity
              ?.code ??
            `merchandising.${generatedSegment}`;

          const badgeKind =
            editor.entity
              ?.kind ??
            "merchandising";

          const badgePriority =
            editor.entity
              ?.priority ??
            50;

          const input = {
            code:
              badgeCode,

            label,

            icon:
              form.icon.trim() ||
              null,

            accentColor,

            kind:
              badgeKind,

            priority:
              badgePriority,

            status:
              form.status,
          };

          if (
            editor.entity
          ) {
            await updateAdminBadge(
              brandId,
              editor.entity.id,
              input,
            );
          } else {
            await createAdminBadge(
              brandId,
              input,
            );
          }
        }
        await onSaved();
      } catch (
        saveError
      ) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "No se pudo guardar el dato maestro.",
        );

        setSaving(
          false,
        );
      }
    };

  return (
    <AdminModal
      open={
        open
      }
      title={
        editorTitle(
          editor,
        )
      }
      description="El cambio se guardará directamente en JUNG CORE."
      onClose={
        saving
          ? () => undefined
          : onClose
      }
      size="compact"
    >
      <form
        className={
          editor.kind ===
          "category"
            ? "catalog-master-form catalog-master-form--category"
            : editor.kind ===
                "campaign"
              ? "catalog-master-form catalog-master-form--campaign"
              : "catalog-master-form catalog-master-form--badge"
        }
        onSubmit={
          submit
        }
      >
        {editor.kind ===
        "category" ? (
          <div className="catalog-master-form__grid catalog-master-form__grid--category">
            <label className="is-wide">
              <span>
                Nombre
              </span>

              <input
                aria-label="Nombre"
                value={
                  form.name
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "name",
                    event.target.value,
                  )
                }
                disabled={
                  saving
                }
                autoFocus
                required
              />

              <small>
                Nombre visible de la categoría.
              </small>
            </label>

            <div className="catalog-master-form__pair">
              <label>
                <span>
                  Icono
                </span>

                <input
                  aria-label="Icono"
                  value={
                    form.icon
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "icon",
                      event.target.value,
                    )
                  }
                  disabled={
                    saving
                  }
                  placeholder="🧸"
                />

                <small>
                  Emoji o símbolo.
                </small>
              </label>

              <AccentColorField
                value={
                  form.accentColor
                }
                disabled={
                  saving
                }
                wide={
                  false
                }
                helperText="Identidad visual de la categoría."
                onChange={(
                  value,
                ) =>
                  updateField(
                    "accentColor",
                    value,
                  )
                }
              />
            </div>

            <label className="is-wide">
              <span>
                Descripción
              </span>

              <textarea
                aria-label="Descripción"
                rows={
                  3
                }
                value={
                  form.description
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                disabled={
                  saving
                }
                placeholder="Breve descripción de la categoría."
              />

              <small>
                Opcional.
              </small>
            </label>

            <label className="is-wide">
              <span>
                Imagen social
              </span>

              <input
                aria-label="Imagen social"
                value={
                  form.ogMediaRef
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "ogMediaRef",
                    event.target.value,
                  )
                }
                disabled={
                  saving
                }
                placeholder="flores-amarillas.jpg"
              />

              <small>
                Archivo existente en JUNG Media.
              </small>
            </label>

            <div className="catalog-master-form__pair">
              <label>
                <span>
                  Prioridad
                </span>

                <input
                  aria-label="Prioridad"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.priority
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "priority",
                      event.target.value,
                    )
                  }
                  disabled={
                    saving
                  }
                  required
                />

                <small>
                  Mayor = primero.
                </small>
              </label>

              <label>
                <span>
                  Estado
                </span>

                <select
                  aria-label="Estado"
                  value={
                    form.status
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "status",
                      event.target.value,
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <option value="DRAFT">
                    Borrador
                  </option>

                  <option value="ACTIVE">
                    Publicado
                  </option>

                  <option value="INACTIVE">
                    Oculto
                  </option>
                </select>

                <small>
                  Visibilidad.
                </small>
              </label>
            </div>
          </div>
        ) : null}
        {editor.kind ===
        "campaign" ? (
          <div className="catalog-master-form__grid catalog-master-form__grid--campaign">
            <label className="is-wide">
              <span>
                Nombre
              </span>

              <input
                aria-label="Nombre de campaña"
                value={
                  form.name
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "name",
                    event.target.value,
                  )
                }
                disabled={
                  saving
                }
                autoFocus
                required
              />

              <small>
                Nombre visible de la campaña.
              </small>
            </label>

            <div className="catalog-master-form__pair">
              <label>
                <span>
                  Icono
                </span>

                <input
                  aria-label="Icono de campaña"
                  value={
                    form.icon
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "icon",
                      event.target.value,
                    )
                  }
                  disabled={
                    saving
                  }
                  placeholder="⚡"
                />

                <small>
                  Emoji o símbolo.
                </small>
              </label>

              <AccentColorField
                value={
                  form.accentColor
                }
                disabled={
                  saving
                }
                wide={
                  false
                }
                helperText="Identidad visual de la campaña."
                onChange={(
                  value,
                ) =>
                  updateField(
                    "accentColor",
                    value,
                  )
                }
              />
            </div>

            <label className="is-wide">
              <span>
                Descripción
              </span>

              <textarea
                aria-label="Descripción de campaña"
                rows={
                  3
                }
                value={
                  form.description
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                disabled={
                  saving
                }
                placeholder="Describe brevemente el propósito de la campaña."
              />

              <small>
                Opcional.
              </small>
            </label>

            <div className="catalog-master-form__pair">
              <label>
                <span>
                  Inicio
                </span>

                <input
                  aria-label="Inicio de campaña"
                  type="datetime-local"
                  value={
                    form.startsAt
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "startsAt",
                      event.target.value,
                    )
                  }
                  disabled={
                    saving
                  }
                />

                <small>
                  Opcional.
                </small>
              </label>

              <label>
                <span>
                  Fin
                </span>

                <input
                  aria-label="Fin de campaña"
                  type="datetime-local"
                  value={
                    form.endsAt
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "endsAt",
                      event.target.value,
                    )
                  }
                  disabled={
                    saving
                  }
                />

                <small>
                  Opcional.
                </small>
              </label>
            </div>

            <label className="is-wide">
              <span>
                Imagen social
              </span>

              <input
                aria-label="Imagen social de campaña"
                value={
                  form.ogMediaRef
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "ogMediaRef",
                    event.target.value,
                  )
                }
                disabled={
                  saving
                }
                placeholder="cyber-wooly.jpg"
              />

              <small>
                Archivo existente en JUNG Media.
              </small>
            </label>

            <div className="catalog-master-form__pair">
              <label>
                <span>
                  Prioridad
                </span>

                <input
                  aria-label="Prioridad de campaña"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.priority
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "priority",
                      event.target.value,
                    )
                  }
                  disabled={
                    saving
                  }
                  required
                />

                <small>
                  Mayor = primero.
                </small>
              </label>

              <label>
                <span>
                  Estado
                </span>

                <select
                  aria-label="Estado de campaña"
                  value={
                    form.publicationStatus
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "publicationStatus",
                      event.target.value,
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <option value="DRAFT">
                    Borrador
                  </option>

                  <option value="PUBLISHED">
                    Publicado
                  </option>

                  <option value="HIDDEN">
                    Oculto
                  </option>

                  <option value="ARCHIVED">
                    Archivado
                  </option>
                </select>

                <small>
                  Visibilidad.
                </small>
              </label>
            </div>
          </div>
        ) : null}
        {editor.kind ===
        "badge" ? (
          <div className="catalog-master-form__grid catalog-master-form__grid--badge">
            <label className="is-wide">
              <span>
                Nombre
              </span>

              <input
                aria-label="Nombre de badge"
                value={
                  form.label
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "label",
                    event.target.value,
                  )
                }
                disabled={
                  saving
                }
                placeholder="Recién llegado"
                autoFocus
                required
              />

              <small>
                Texto que verá el cliente.
              </small>
            </label>

            <div className="catalog-master-form__pair">
              <label>
                <span>
                  Icono
                </span>

                <input
                  aria-label="Icono de badge"
                  value={
                    form.icon
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "icon",
                      event.target.value,
                    )
                  }
                  disabled={
                    saving
                  }
                  placeholder="✨"
                />

                <small>
                  Emoji o símbolo.
                </small>
              </label>

              <AccentColorField
                value={
                  form.accentColor
                }
                disabled={
                  saving
                }
                wide={
                  false
                }
                helperText="Identidad visual del badge."
                onChange={(
                  value,
                ) =>
                  updateField(
                    "accentColor",
                    value,
                  )
                }
              />
            </div>

            <label className="is-wide">
              <span>
                Estado
              </span>

              <select
                aria-label="Estado de badge"
                value={
                  form.status
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "status",
                    event.target.value,
                  )
                }
                disabled={
                  saving
                }
              >
                <option value="ACTIVE">
                  Activo
                </option>

                <option value="INACTIVE">
                  Inactivo
                </option>

                <option value="ARCHIVED">
                  Archivado
                </option>
              </select>

              <small>
                Controla si el badge puede utilizarse.
              </small>
            </label>
          </div>
        ) : null}
        {error ? (
          <div
            className="catalog-master-form__error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <footer className="catalog-master-form__footer">
          <button
            type="button"
            className="catalog-master-form__cancel"
            onClick={
              onClose
            }
            disabled={
              saving
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="catalog-master-form__save"
            disabled={
              saving ||
              !canWrite
            }
          >
            {saving
              ? "Guardando…"
              : saveLabel(
                  editor,
                )}
          </button>
        </footer>
      </form>
    </AdminModal>
  );
}
