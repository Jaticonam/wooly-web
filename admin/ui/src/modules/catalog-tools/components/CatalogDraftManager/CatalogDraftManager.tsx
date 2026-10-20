import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import type {
  CatalogCompositionDraft,
} from "@/modules/catalog/domain/CatalogCompositionDraft";

import {
  createDefaultCatalogPublicationIdentity,
  type CatalogPublicationIdentity,
} from "@wooly/contracts/catalog/domain/CatalogPublicationIdentity";

import {
  catalogCompositionProvider,
} from "@/modules/catalog/providers/DefaultCatalogCompositionProvider";

import "./CatalogDraftManager.css";

interface CatalogDraftManagerProps {
  composition:
    CatalogComposition;

  publicationIdentity:
    CatalogPublicationIdentity;

  onPublicationIdentityChange:
    (
      value:
        CatalogPublicationIdentity |
        ((
          current:
            CatalogPublicationIdentity,
        ) => CatalogPublicationIdentity),
    ) => void;

  onLoadComposition:
    (
      composition:
        CatalogComposition,
    ) => void;

  onNewComposition:
    () => void;
}

const compositionFingerprint = (
  composition:
    CatalogComposition,
) =>
  JSON.stringify(
    composition,
  );

const identityFingerprint = (
  identity:
    CatalogPublicationIdentity,
) =>
  JSON.stringify(
    identity,
  );

function hasMeaningfulComposition(
  composition:
    CatalogComposition,
): boolean {
  return (
    composition.mode !==
      "automatic" ||
    composition.filters
      .categoryIds.length >
      0 ||
    composition.filters
      .campaignIds.length >
      0 ||
    composition.overrides
      .includedProductIds.length >
      0 ||
    composition.overrides
      .excludedProductIds.length >
      0
  );
}

function formatDate(
  value:
    string,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    },
  ).format(
    date,
  );
}

export default function CatalogDraftManager({
  composition,
  publicationIdentity,
  onPublicationIdentityChange:
    setPublicationIdentity,
  onLoadComposition,
  onNewComposition,
}: CatalogDraftManagerProps) {
  const [
    drafts,
    setDrafts,
  ] =
    useState<
      readonly CatalogCompositionDraft[]
    >(
      [],
    );

  const [
    currentDraftId,
    setCurrentDraftId,
  ] =
    useState("");

  const [
    name,
    setName,
  ] =
    useState("");


  const [
    savedFingerprint,
    setSavedFingerprint,
  ] =
    useState("");

  const [
    savedIdentityFingerprint,
    setSavedIdentityFingerprint,
  ] =
    useState("");

  const [
    savedName,
    setSavedName,
  ] =
    useState("");

  const [
    isBusy,
    setIsBusy,
  ] =
    useState(
      false,
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const editableDrafts =
    useMemo(
      () =>
        drafts.filter(
          (draft) =>
            draft.status ===
            "draft",
        ),
      [drafts],
    );

  const publishedCount =
    useMemo(
      () =>
        drafts.filter(
          (draft) =>
            draft.status ===
            "published",
        ).length,
      [drafts],
    );

  const archivedDraftCount =
    useMemo(
      () =>
        drafts.filter(
          (draft) =>
            draft.status ===
            "archived",
        ).length,
      [drafts],
    );

  const currentDraft =
    useMemo(
      () =>
        editableDrafts.find(
          (draft) =>
            draft.id ===
            currentDraftId,
        ) ??
        null,
      [
        editableDrafts,
        currentDraftId,
      ],
    );

  const currentFingerprint =
    useMemo(
      () =>
        compositionFingerprint(
          composition,
        ),
      [composition],
    );

  const currentIdentityFingerprint =
    useMemo(
      () =>
        identityFingerprint(
          publicationIdentity,
        ),
      [publicationIdentity],
    );

  const isDirty =
    currentDraftId
      ? currentFingerprint !==
          savedFingerprint ||
        currentIdentityFingerprint !==
          savedIdentityFingerprint ||
        name.trim() !==
          savedName
      : (
          name.trim().length >
            0 ||
          publicationIdentity.title
            .trim().length >
            0 ||
          publicationIdentity.description
            .trim().length >
            0 ||
          hasMeaningfulComposition(
            composition,
          )
        );

  const refreshDrafts =
    useCallback(
      async () => {
        const nextDrafts =
          await catalogCompositionProvider
            .listDrafts();

        setDrafts(
          nextDrafts,
        );
      },
      [],
    );

  useEffect(
    () => {
      void refreshDrafts()
        .catch(
          (reason) => {
            setError(
              reason instanceof
              Error
                ? reason.message
                : "No se pudieron cargar los catálogos.",
            );
          },
        );
    },
    [refreshDrafts],
  );

  const clearWorkingDraft =
    (
      nextMessage:
        string,
    ) => {
      onNewComposition();

      setCurrentDraftId("");
      setName("");

      setPublicationIdentity(
        createDefaultCatalogPublicationIdentity(),
      );

      setSavedName("");
      setSavedFingerprint("");
      setSavedIdentityFingerprint("");

      setMessage(
        nextMessage,
      );

      setError("");
    };

  const applyLoadedDraft =
    (
      draft:
        CatalogCompositionDraft,
    ) => {
      onLoadComposition(
        draft.composition,
      );

      setCurrentDraftId(
        draft.id,
      );

      setName(
        draft.name,
      );

      setPublicationIdentity(
        draft.publicationIdentity,
      );

      setSavedName(
        draft.name,
      );

      setSavedFingerprint(
        compositionFingerprint(
          draft.composition,
        ),
      );

      setSavedIdentityFingerprint(
        identityFingerprint(
          draft.publicationIdentity,
        ),
      );

    };

  const saveDraft =
    async () => {
      const normalizedName =
        name.trim();

      setMessage("");
      setError("");

      if (!normalizedName) {
        setError(
          "Escribe un nombre para guardar el catálogo.",
        );

        return;
      }

      setIsBusy(
        true,
      );

      try {
        const isUpdate =
          currentDraftId !==
          "";

        const saved =
          isUpdate
            ? await catalogCompositionProvider
                .updateDraft(
                  currentDraftId,
                  {
                    name:
                      normalizedName,

                    composition,

                    publicationIdentity:
                      publicationIdentity,
                  },
                )
            : await catalogCompositionProvider
                .createDraft({
                  name:
                    normalizedName,

                  composition,

                  publicationIdentity:
                    publicationIdentity,
                });

        applyLoadedDraft(
          saved,
        );

        setMessage(
          isUpdate
            ? "Cambios guardados."
            : "Borrador guardado.",
        );

        await refreshDrafts();
      } catch (reason) {
        setError(
          reason instanceof
          Error
            ? reason.message
            : "No se pudo guardar el borrador.",
        );
      } finally {
        setIsBusy(
          false,
        );
      }
    };

  const loadDraft =
    async (
      draftId:
        string,
    ) => {
      if (
        draftId ===
        currentDraftId
      ) {
        return;
      }

      if (
        isDirty &&
        !window.confirm(
          "Hay cambios sin guardar. ¿Deseas abrir otro borrador y descartarlos?",
        )
      ) {
        return;
      }

      if (!draftId) {
        return;
      }

      setMessage("");
      setError("");
      setIsBusy(
        true,
      );

      try {
        const draft =
          await catalogCompositionProvider
            .getDraft(
              draftId,
            );

        if (
          !draft ||
          draft.status !==
            "draft"
        ) {
          throw new Error(
            "El borrador ya no está disponible.",
          );
        }

        applyLoadedDraft(
          draft,
        );

        setMessage(
          "Borrador cargado.",
        );
      } catch (reason) {
        setError(
          reason instanceof
          Error
            ? reason.message
            : "No se pudo abrir el borrador.",
        );
      } finally {
        setIsBusy(
          false,
        );
      }
    };

  const startNew =
    () => {
      if (
        isDirty &&
        !window.confirm(
          "Hay cambios sin guardar. ¿Deseas comenzar un catálogo nuevo y descartarlos?",
        )
      ) {
        return;
      }


      clearWorkingDraft(
        "Nuevo catálogo listo.",
      );
    };

  const duplicateDraft =
    async () => {
      if (
        !currentDraft ||
        isDirty
      ) {
        return;
      }

      setMessage("");
      setError("");
      setIsBusy(
        true,
      );

      try {
        const duplicated =
          await catalogCompositionProvider
            .createDraft({
              name:
                `${currentDraft.name} - copia`,

              composition:
                currentDraft.composition,

              publicationIdentity:
                currentDraft.publicationIdentity,
            });

        applyLoadedDraft(
          duplicated,
        );

        setMessage(
          "Borrador duplicado.",
        );

        await refreshDrafts();
      } catch (reason) {
        setError(
          reason instanceof
          Error
            ? reason.message
            : "No se pudo duplicar el borrador.",
        );
      } finally {
        setIsBusy(
          false,
        );
      }
    };

  const archiveDraft =
    async () => {
      if (
        !currentDraft ||
        isDirty
      ) {
        return;
      }

      if (
        !window.confirm(
          `¿Archivar "${currentDraft.name}"?`,
        )
      ) {
        return;
      }

      setMessage("");
      setError("");
      setIsBusy(
        true,
      );

      try {
        await catalogCompositionProvider
          .archiveDraft(
            currentDraft.id,
          );

        await refreshDrafts();


        clearWorkingDraft(
          "Borrador archivado. Nuevo catálogo listo.",
        );
      } catch (reason) {
        setError(
          reason instanceof
          Error
            ? reason.message
            : "No se pudo archivar el borrador.",
        );
      } finally {
        setIsBusy(
          false,
        );
      }
    };

  return (
    <section className="catalog-draft-manager">
      <header className="catalog-draft-manager__header">
        <div>
          <span>
            Catálogos
          </span>

          <h3>
            Guarda y administra
          </h3>

          <p>
            Conserva borradores para retomarlos, duplicarlos
            o archivarlos cuando lo necesites.
          </p>
        </div>

        <div className="catalog-draft-manager__status">
          {currentDraft ? (
            <>
              <strong>
                {currentDraft.id}
              </strong>

              <small>
                Actualizado
                {" "}
                {formatDate(
                  currentDraft.updatedAt,
                )}
              </small>
            </>
          ) : (
            <>
              <strong>
                Nuevo catálogo
              </strong>

              <small>
                Aún no guardado
              </small>
            </>
          )}

          {isDirty ? (
            <span>
              Cambios sin guardar
            </span>
          ) : currentDraftId ? (
            <span className="is-saved">
              Guardado
            </span>
          ) : null}
        </div>
      </header>

      <div className="catalog-draft-manager__inventory">
        <span>
          <strong>
            {editableDrafts.length}
          </strong>
          {" "}
          borradores
        </span>

        <span>
          <strong>
            {publishedCount}
          </strong>
          {" "}
          publicados
        </span>

        <span>
          <strong>
            {archivedDraftCount}
          </strong>
          {" "}
          archivados
        </span>
      </div>

      <div className="catalog-draft-manager__controls">
        <label>
          <span>
            Nombre interno
          </span>

          <input
            type="text"
            value={
              name
            }
            maxLength={
              120
            }
            placeholder="Ej. Cliente María - Agosto"
            disabled={
              isBusy
            }
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <span>
            Abrir borrador
          </span>

          <select
            value={
              currentDraftId
            }
            disabled={
              isBusy ||
              editableDrafts.length ===
                0
            }
            onChange={(event) =>
              void loadDraft(
                event.target.value,
              )
            }
          >
            <option value="">
              {editableDrafts.length ===
              0
                ? "No hay borradores guardados"
                : "Seleccionar borrador..."}
            </option>

            {editableDrafts.map(
              (draft) => (
                <option
                  key={
                    draft.id
                  }
                  value={
                    draft.id
                  }
                >
                  {draft.name}
                  {" · "}
                  {draft.id}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <div className="catalog-draft-manager__buttons">
        <button
          type="button"
          className="is-primary"
          disabled={
            isBusy ||
            !name.trim() ||
            (
              currentDraftId !==
                "" &&
              !isDirty
            )
          }
          onClick={() =>
            void saveDraft()
          }
        >
          {isBusy
            ? "Procesando..."
            : currentDraftId
              ? "Guardar cambios"
              : "Guardar borrador"}
        </button>

        <button
          type="button"
          disabled={
            isBusy ||
            !currentDraft ||
            isDirty
          }
          onClick={() =>
            void duplicateDraft()
          }
        >
          Duplicar
        </button>

        <button
          type="button"
          className="is-danger"
          disabled={
            isBusy ||
            !currentDraft ||
            isDirty
          }
          onClick={() =>
            void archiveDraft()
          }
        >
          Archivar
        </button>

        <button
          type="button"
          disabled={
            isBusy
          }
          onClick={
            startNew
          }
        >
          Nuevo catálogo
        </button>
      </div>

      {message ? (
        <div
          className="catalog-draft-manager__message"
          role="status"
        >
          {message}
        </div>
      ) : null}

      {error ? (
        <div
          className="catalog-draft-manager__error"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </section>
  );
}