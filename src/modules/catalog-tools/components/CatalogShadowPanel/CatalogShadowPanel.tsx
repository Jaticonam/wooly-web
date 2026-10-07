import {
  useRef,
  useState,
} from "react";

import {
  googleSheetsCatalogProvider,
} from "@/modules/catalog/integrations/googleSheets/GoogleSheetsCatalogProvider";

import {
  createDevelopmentJungCoreShadowCatalogProvider,
} from "@/modules/catalog/integrations/jungCore/DevelopmentJungCoreShadowCatalogProvider";

import {
  runCatalogShadowComparison,
  type CatalogShadowRunResult,
} from "@/modules/catalog/shadow/CatalogShadowRunner";

import type {
  CatalogShadowDifference,
} from "@/modules/catalog/shadow/CatalogShadowComparison";

import "./CatalogShadowPanel.css";

interface CatalogShadowPanelProps {
  runComparison?:
    () => Promise<
      CatalogShadowRunResult
    >;

  detailLimit?:
    number;

  isDevelopment?:
    boolean;
}

const DEFAULT_DETAIL_LIMIT =
  50;

async function runDevelopmentShadow():
  Promise<CatalogShadowRunResult> {
  const rightProvider =
    createDevelopmentJungCoreShadowCatalogProvider();

  return runCatalogShadowComparison({
    leftProvider:
      googleSheetsCatalogProvider,

    rightProvider,
  });
}

function formatDifferenceKind(
  kind:
    CatalogShadowDifference["kind"],
): string {
  switch (kind) {
    case "missing-left":
      return "Falta en Sheets";

    case "missing-right":
      return "Falta en CORE";

    case "value-mismatch":
      return "Valor diferente";
  }
}

function formatDifferenceValue(
  value:
    unknown,
): string {
  if (
    value ===
      undefined
  ) {
    return "—";
  }

  if (
    value ===
      null
  ) {
    return "null";
  }

  if (
    typeof value ===
      "string"
  ) {
    return value ||
      '""';
  }

  const serialized =
    JSON.stringify(
      value,
    );

  if (!serialized) {
    return String(
      value,
    );
  }

  return serialized.length >
      120
    ? `${serialized.slice(
        0,
        117,
      )}...`
    : serialized;
}

function createUnexpectedFailure():
  CatalogShadowRunResult {
  const now =
    new Date()
      .toISOString();

  return {
    status:
      "error",

    errorCode:
      "SHADOW_RUNNER_FAILED",

    message:
      "No se pudo completar la comparación Shadow de JUNG CORE.",

    startedAt:
      now,

    completedAt:
      now,

    durationMs:
      0,
  };
}

export default function CatalogShadowPanel({
  runComparison =
    runDevelopmentShadow,

  detailLimit =
    DEFAULT_DETAIL_LIMIT,

  isDevelopment =
    import.meta.env.DEV,
}: CatalogShadowPanelProps) {
  const [
    isRunning,
    setIsRunning,
  ] =
    useState(
      false,
    );

  const [
    result,
    setResult,
  ] =
    useState<
      CatalogShadowRunResult | null
    >(
      null,
    );

  const runningRef =
    useRef(
      false,
    );

  if (!isDevelopment) {
    return null;
  }

  const visibleDetailLimit =
    Math.min(
      50,
      Math.max(
        1,
        Math.trunc(
          detailLimit,
        ) ||
          DEFAULT_DETAIL_LIMIT,
      ),
    );

  const handleCompare =
    async () => {
      if (
        runningRef.current
      ) {
        return;
      }

      runningRef.current =
        true;

      setIsRunning(
        true,
      );

      setResult(
        null,
      );

      try {
        setResult(
          await runComparison(),
        );
      } catch {
        setResult(
          createUnexpectedFailure(),
        );
      } finally {
        runningRef.current =
          false;

        setIsRunning(
          false,
        );
      }
    };

  const readyResult =
    result?.status ===
      "ready"
      ? result
      : null;

  const visibleDifferences =
    readyResult
      ? readyResult
          .comparison
          .differences
          .slice(
            0,
            visibleDetailLimit,
          )
      : [];

  return (
    <section
      className="catalog-shadow-panel"
      aria-label="JUNG CORE Shadow"
    >
      <header className="catalog-shadow-panel__header">
        <div>
          <span>
            JUNG CORE · Shadow
          </span>

          <h3>
            Comparación canónica
          </h3>

          <p>
            Compara la fuente operativa actual con el
            catálogo canónico de JUNG CORE sin cambiar
            lo que ve el cliente.
          </p>
        </div>

        <button
          type="button"
          disabled={
            isRunning
          }
          onClick={
            handleCompare
          }
        >
          {isRunning
            ? "Comparando..."
            : "Comparar ahora"}
        </button>
      </header>

      <div className="catalog-shadow-panel__activeSource">
        Google Sheets sigue siendo la fuente activa.
      </div>

      {isRunning ? (
        <div
          className="catalog-shadow-panel__running"
          aria-live="polite"
        >
          Comparando Google Sheets ↔ JUNG CORE...
        </div>
      ) : null}

      {readyResult ? (
        <section
          className={
            readyResult.summary
              .equivalent
              ? "catalog-shadow-panel__result is-equivalent"
              : "catalog-shadow-panel__result is-different"
          }
          aria-live="polite"
        >
          <header>
            <span>
              Estado
            </span>

            <h4>
              {readyResult.summary
                .equivalent
                ? "Sin diferencias comerciales"
                : "Diferencias detectadas"}
            </h4>

            <p>
              {readyResult.durationMs} ms
            </p>
          </header>

          <div className="catalog-shadow-panel__sourceGrid">
            <article>
              <span>
                Google Sheets
              </span>

              <strong>
                {readyResult.summary
                  .leftProductCount}{" "}
                productos
              </strong>

              <small>
                {readyResult.summary
                  .leftCampaignCount}{" "}
                campañas ·{" "}
                {readyResult.summary
                  .leftCategoryCount}{" "}
                categorías
              </small>
            </article>

            <article>
              <span>
                JUNG CORE
              </span>

              <strong>
                {readyResult.summary
                  .rightProductCount}{" "}
                productos
              </strong>

              <small>
                {readyResult.summary
                  .rightCampaignCount}{" "}
                campañas ·{" "}
                {readyResult.summary
                  .rightCategoryCount}{" "}
                categorías
              </small>
            </article>

            <article>
              <span>
                Diferencias
              </span>

              <strong>
                {readyResult.summary
                  .differenceCount}
              </strong>

              <small>
                Productos{" "}
                {readyResult.summary.products}
                {" · "}
                Campañas{" "}
                {readyResult.summary.campaigns}
                {" · "}
                Categorías{" "}
                {readyResult.summary.categories}
              </small>
            </article>
          </div>

          {readyResult.summary
            .differenceCount >
          0 ? (
            <div className="catalog-shadow-panel__differences">
              <div className="catalog-shadow-panel__differenceSummary">
                Mostrando{" "}
                {visibleDifferences.length} de{" "}
                {readyResult.summary
                  .differenceCount}{" "}
                diferencias
              </div>

              <ul>
                {visibleDifferences.map(
                  (
                    difference,
                    index,
                  ) => (
                    <li
                      key={`${difference.path}-${index}`}
                    >
                      <div>
                        <strong>
                          {difference.path}
                        </strong>

                        <span>
                          {formatDifferenceKind(
                            difference.kind,
                          )}
                        </span>
                      </div>

                      <small>
                        Sheets:{" "}
                        {formatDifferenceValue(
                          difference.left,
                        )}
                      </small>

                      <small>
                        CORE:{" "}
                        {formatDifferenceValue(
                          difference.right,
                        )}
                      </small>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {result?.status ===
      "unavailable" ? (
        <div
          className="catalog-shadow-panel__failure is-unavailable"
          role="status"
        >
          <strong>
            Shadow no disponible
          </strong>

          <p>
            {result.message}
          </p>

          {result.errorCode ? (
            <small>
              {result.errorCode}
            </small>
          ) : null}
        </div>
      ) : null}

      {result?.status ===
      "error" ? (
        <div
          className="catalog-shadow-panel__failure is-error"
          role="alert"
        >
          <strong>
            No se pudo completar Shadow
          </strong>

          <p>
            {result.message}
          </p>

          {result.errorCode ? (
            <small>
              {result.errorCode}
            </small>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}