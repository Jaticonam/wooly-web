import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CATEGORY_CONFIG,
} from "@/modules/catalog";

import {
  refreshCatalogNow,
  type CatalogSyncProgress,
  type CatalogSyncResult,
} from "@/modules/catalog-tools/services/CatalogSyncService";

import CatalogShadowPanel from "@/modules/catalog-tools/components/CatalogShadowPanel/CatalogShadowPanel";

import "./CatalogSyncPanel.css";

type CatalogSyncPanelProps = {
  currentProductCount:
    number;

  campaignCount:
    number;

  isReady:
    boolean;

  initiallyExpanded?:
    boolean;
};

const RESULT_STORAGE_KEY =
  "wooly_admin_catalog_sync_result_v2";

const PANEL_VISIBILITY_STORAGE_KEY =
  "wooly_admin_catalog_sync_panel_seen_v1";

function resolveInitialExpandedState():
  boolean {
  if (
    typeof window ===
    "undefined"
  ) {
    return true;
  }

  try {
    return (
      window.localStorage.getItem(
        PANEL_VISIBILITY_STORAGE_KEY,
      ) !== "1"
    );
  } catch {
    return true;
  }
}

const categoryCount =
  CATEGORY_CONFIG.filter(
    (category) =>
      category.id !== "todas",
  ).length;

const categoryLabelById =
  new Map<string, string>(
    CATEGORY_CONFIG.map(
      (category) => [
        category.id,
        category.name,
      ],
    ),
  );

function readStoredResult():
  CatalogSyncResult | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        RESULT_STORAGE_KEY,
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw,
      ) as Partial<CatalogSyncResult>;

    if (
      typeof parsed.status !==
        "string" ||
      typeof parsed.completedAt !==
        "string" ||
      typeof parsed.campaignStatus !==
        "string" ||
      !Array.isArray(
        parsed.categories,
      )
    ) {
      return null;
    }

    return parsed as
      CatalogSyncResult;
  } catch {
    return null;
  }
}

function formatSource(
  source:
    CatalogSyncResult["source"],
): string {
  if (
    source ===
    "google-sheets"
  ) {
    return "Google Sheets";
  }

  if (
    source ===
    "jung-core"
  ) {
    return "JUNG CORE";
  }

  return source;
}

function formatCompletedAt(
  value:
    string,
): string {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Fecha no disponible";
  }

  return date.toLocaleString(
    "es-PE",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  );
}

function formatDuration(
  durationMs:
    number,
): string {
  const seconds =
    durationMs /
    1000;

  return seconds < 1
    ? `${durationMs} ms`
    : `${seconds.toFixed(1)} s`;
}

function formatDelta(
  delta:
    number,
): string {
  return delta > 0
    ? `+${delta}`
    : `${delta}`;
}

function getResultTitle(
  result:
    CatalogSyncResult,
): string {
  if (
    result.status ===
    "success"
  ) {
    return result.productDelta === 0
      ? "Catálogo verificado correctamente"
      : "Catálogo actualizado correctamente";
  }

  if (
    result.status ===
    "partial"
  ) {
    return "Actualización completada con advertencias";
  }

  return "No se pudo actualizar el catálogo";
}

export default function CatalogSyncPanel({
  currentProductCount,
  campaignCount,
  isReady,
  initiallyExpanded = false,
}: CatalogSyncPanelProps) {
  const [
    isExpanded,
    setIsExpanded,
  ] = useState(
    () =>
      initiallyExpanded ||
      resolveInitialExpandedState(),
  );

  const [
    isSyncing,
    setIsSyncing,
  ] = useState(
    false,
  );

  const [
    progress,
    setProgress,
  ] = useState<
    CatalogSyncProgress | null
  >(
    null,
  );

  const [
    lastResult,
    setLastResult,
  ] = useState<
    CatalogSyncResult | null
  >(
    null,
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState(
    "",
  );

  useEffect(
    () => {
      setLastResult(
        readStoredResult(),
      );

      try {
        window.localStorage.setItem(
          PANEL_VISIBILITY_STORAGE_KEY,
          "1",
        );
      } catch {
        // El panel continúa funcionando sin persistencia local.
      }
    },
    [],
  );

  const progressPercent =
    useMemo(
      () => {
        if (
          !progress ||
          progress.totalSteps === 0
        ) {
          return 0;
        }

        return Math.round(
          (
            progress.completedSteps /
            progress.totalSteps
          ) *
            100,
        );
      },
      [
        progress,
      ],
    );

  const handleRefresh =
    async () => {
      setIsSyncing(
        true,
      );

      setErrorMessage(
        "",
      );

      setProgress({
        stage:
          "campaigns",

        status:
          "running",

        completedSteps:
          0,

        totalSteps:
          categoryCount + 1,

        message:
          "Preparando actualización...",
      });

      try {
        const result =
          await refreshCatalogNow({
            onProgress:
              setProgress,
          });

        window.sessionStorage.setItem(
          RESULT_STORAGE_KEY,
          JSON.stringify(
            result,
          ),
        );

        setLastResult(
          result,
        );

        if (
          result.status !==
          "error"
        ) {
          setProgress({
            stage:
              "category",

            status:
              result.status ===
              "partial"
                ? "error"
                : "success",

            completedSteps:
              categoryCount + 1,

            totalSteps:
              categoryCount + 1,

            message:
              result.status ===
              "partial"
                ? "Actualización parcial terminada. Recargando el panel..."
                : "Actualización terminada. Recargando el panel...",
          });

          window.setTimeout(
            () => {
              window.location.reload();
            },
            900,
          );
        }
      } catch (cause: unknown) {
        setErrorMessage(
          cause instanceof Error
            ? cause.message
            : "No se pudo actualizar el catálogo.",
        );
      } finally {
        setIsSyncing(
          false,
        );
      }
    };

  const displayedProductCount =
    isReady
      ? currentProductCount
      : "—";

  const displayedCampaignCount =
    isReady
      ? campaignCount
      : "—";

  return (
    <section
      className="catalog-sync-panel"
      aria-labelledby="catalog-sync-title"
    >
      <div className="catalog-sync-panel__header">
        <div>
          <p className="catalog-sync-panel__eyebrow">
            Control operativo
          </p>

          <h2 id="catalog-sync-title">
            Estado del catálogo
          </h2>

          <p>
            Verifica la información disponible y fuerza
            una nueva lectura desde Google Sheets.
          </p>
        </div>

        <div className="catalog-sync-panel__headerActions">
          <div className="catalog-sync-panel__source">
            <span>
              Fuente actual
            </span>

            <strong>
              {lastResult
                ? formatSource(
                    lastResult.source,
                  )
                : "Google Sheets"}
            </strong>
          </div>

          <button
            type="button"
            className="catalog-sync-panel__toggle"
            aria-expanded={
              isExpanded
            }
            aria-controls="catalog-sync-details"
            onClick={() => {
              setIsExpanded(
                (current) =>
                  !current,
              );
            }}
          >
            {isExpanded
              ? "Ocultar detalles"
              : "Ver detalles"}
          </button>
        </div>
      </div>

      <div
        id="catalog-sync-details"
        className="catalog-sync-panel__details"
        hidden={
          !isExpanded
        }
      >
      <div className="catalog-sync-panel__metrics">
        <article>
          <span>
            Productos
          </span>

          <strong>
            {displayedProductCount}
          </strong>
        </article>

        <article>
          <span>
            Categorías
          </span>

          <strong>
            {isReady
              ? `${categoryCount} de ${categoryCount}`
              : "—"}
          </strong>
        </article>

        <article>
          <span>
            Campañas
          </span>

          <strong>
            {displayedCampaignCount}
          </strong>

          {lastResult ? (
            <small
              className={
                lastResult.campaignStatus ===
                "success"
                  ? "is-success"
                  : "is-error"
              }
            >
              {lastResult.campaignStatus ===
              "success"
                ? "Última consulta correcta"
                : "Última consulta fallida"}
            </small>
          ) : null}
        </article>
      </div>

      <div className="catalog-sync-panel__action">
        <button
          type="button"
          disabled={
            isSyncing ||
            !isReady
          }
          onClick={
            handleRefresh
          }
        >
          {isSyncing
            ? "Actualizando catálogo..."
            : "Actualizar catálogo ahora"}
        </button>

        <p>
          Actualiza los datos de este dispositivo y
          recarga el Explorer PDF con la información nueva.
        </p>
      </div>

      {!isReady ? (
        <div className="catalog-sync-panel__notice">
          Cargando el catálogo actual antes de habilitar
          la actualización manual.
        </div>
      ) : null}

      {progress ? (
        <div
          className="catalog-sync-panel__progress"
          aria-live="polite"
        >
          <div>
            <strong>
              {progress.message}
            </strong>

            <span>
              {progress.completedSteps} de{" "}
              {progress.totalSteps}
            </span>
          </div>

          <div className="catalog-sync-panel__progressTrack">
            <span
              style={{
                width:
                  `${progressPercent}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          className="catalog-sync-panel__error"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {lastResult ? (
        <div
          className={`catalog-sync-panel__result is-${lastResult.status}`}
        >
          <div className="catalog-sync-panel__resultHead">
            <div>
              <span>
                Último resultado
              </span>

              <h3>
                {getResultTitle(
                  lastResult,
                )}
              </h3>

              <p>
                {formatCompletedAt(
                  lastResult.completedAt,
                )}
                {" · "}
                {formatDuration(
                  lastResult.durationMs,
                )}
              </p>
            </div>

            <strong>
              {formatDelta(
                lastResult.productDelta,
              )}
            </strong>
          </div>

          {lastResult.campaignStatus ===
          "error" ? (
            <div className="catalog-sync-panel__campaignWarning">
              <strong>
                No se pudo consultar la hoja de campañas.
              </strong>

              <span>
                {lastResult.campaignPreservedPreviousData
                  ? `Se conservaron ${lastResult.campaignCount} campañas anteriores.`
                  : "No existe información anterior disponible."}
              </span>

              {lastResult.campaignError ? (
                <small>
                  {lastResult.campaignError}
                </small>
              ) : null}
            </div>
          ) : null}

          <div className="catalog-sync-panel__comparison">
            <div>
              <span>
                Antes
              </span>

              <strong>
                {lastResult.previousProductCount}
              </strong>
            </div>

            <div>
              <span>
                Ahora
              </span>

              <strong>
                {lastResult.currentProductCount}
              </strong>
            </div>

            <div>
              <span>
                Categorías correctas
              </span>

              <strong>
                {lastResult.updatedCategoryCount} de{" "}
                {lastResult.categories.length}
              </strong>
            </div>
          </div>

          <div className="catalog-sync-panel__categories">
            {lastResult.categories.map(
              (category) => (
                <article
                  key={
                    category.category
                  }
                  className={
                    category.status ===
                    "success"
                      ? "is-success"
                      : "is-error"
                  }
                >
                  <div className="catalog-sync-panel__categoryHead">
                    <span>
                      {categoryLabelById.get(
                        category.category,
                      ) ??
                        category.category}
                    </span>

                    <small>
                      {category.status ===
                      "success"
                        ? category.productDelta ===
                          0
                          ? "Sin cambios"
                          : "Actualizado"
                        : category.preservedPreviousData
                          ? "Información anterior"
                          : "Sin información"}
                    </small>
                  </div>

                  <div className="catalog-sync-panel__categoryNumbers">
                    <span>
                      Antes
                      <strong>
                        {category.previousProductCount}
                      </strong>
                    </span>

                    <span>
                      Ahora
                      <strong>
                        {category.currentProductCount}
                      </strong>
                    </span>

                    <span>
                      Variación
                      <strong>
                        {formatDelta(
                          category.productDelta,
                        )}
                      </strong>
                    </span>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      ) : null}

      {import.meta.env.DEV ? (
        <CatalogShadowPanel />
      ) : null}
      </div>
    </section>
  );
}
