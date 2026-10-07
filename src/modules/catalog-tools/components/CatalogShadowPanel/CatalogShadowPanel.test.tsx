import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  CatalogShadowDifference,
} from "@/modules/catalog/shadow/CatalogShadowComparison";

import type {
  CatalogShadowRunResult,
} from "@/modules/catalog/shadow/CatalogShadowRunner";

import CatalogShadowPanel from "./CatalogShadowPanel";

function readyResult(
  differences:
    readonly CatalogShadowDifference[] =
      [],
): CatalogShadowRunResult {
  const productDifferences =
    differences.filter(
      (difference) =>
        difference.path
          .startsWith(
            "products",
          ),
    ).length;

  const campaignDifferences =
    differences.filter(
      (difference) =>
        difference.path
          .startsWith(
            "campaigns",
          ),
    ).length;

  const categoryDifferences =
    differences.filter(
      (difference) =>
        difference.path
          .startsWith(
            "categories",
          ),
    ).length;

  return {
    status:
      "ready",

    startedAt:
      "2026-10-06T20:00:00.000Z",

    completedAt:
      "2026-10-06T20:00:00.100Z",

    durationMs:
      100,

    comparison: {
      equivalent:
        differences.length ===
        0,

      left: {
        source:
          "google-sheets",

        categories: [
          "flores",
        ],

        campaigns:
          [],

        products:
          [],
      },

      right: {
        source:
          "jung-core",

        categories: [
          "flores",
        ],

        campaigns:
          [],

        products:
          [],
      },

      differences,
    },

    summary: {
      leftSource:
        "google-sheets",

      rightSource:
        "jung-core",

      leftCategoryCount:
        1,

      rightCategoryCount:
        1,

      leftCampaignCount:
        2,

      rightCampaignCount:
        2,

      leftProductCount:
        100,

      rightProductCount:
        100,

      differenceCount:
        differences.length,

      equivalent:
        differences.length ===
        0,

      categories:
        categoryDifferences,

      campaigns:
        campaignDifferences,

      products:
        productDifferences,

      other:
        differences.length -
        productDifferences -
        campaignDifferences -
        categoryDifferences,

      missingLeft:
        differences.filter(
          (difference) =>
            difference.kind ===
            "missing-left",
        ).length,

      missingRight:
        differences.filter(
          (difference) =>
            difference.kind ===
            "missing-right",
        ).length,

      valueMismatch:
        differences.filter(
          (difference) =>
            difference.kind ===
            "value-mismatch",
        ).length,
    },
  };
}

describe(
  "CatalogShadowPanel",
  () => {
    it(
      "expone Comparar ahora",
      () => {
        render(
          <CatalogShadowPanel
            runComparison={
              vi.fn()
            }
            isDevelopment
          />,
        );

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Comparar ahora",
            },
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "muestra running mientras compara",
      async () => {
        let resolve:
          (
            value:
              CatalogShadowRunResult,
          ) => void =
            () => undefined;

        const pending =
          new Promise<
            CatalogShadowRunResult
          >(
            (resolver) => {
              resolve =
                resolver;
            },
          );

        const runComparison =
          vi.fn(
            () =>
              pending,
          );

        render(
          <CatalogShadowPanel
            runComparison={
              runComparison
            }
            isDevelopment
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Comparar ahora",
            },
          ),
        );

        expect(
          screen.getByText(
            "Comparando Google Sheets ↔ JUNG CORE...",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Comparando...",
            },
          ),
        ).toBeDisabled();

        resolve(
          readyResult(),
        );

        await screen.findByText(
          "Sin diferencias comerciales",
        );
      },
    );

    it(
      "presenta estado equivalente",
      async () => {
        render(
          <CatalogShadowPanel
            runComparison={
              async () =>
                readyResult()
            }
            isDevelopment
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Comparar ahora",
            },
          ),
        );

        expect(
          await screen.findByText(
            "Sin diferencias comerciales",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "presenta diferencias sin tratarlas como error",
      async () => {
        render(
          <CatalogShadowPanel
            runComparison={
              async () =>
                readyResult([
                  {
                    kind:
                      "value-mismatch",

                    path:
                      "products[0].stock",

                    left:
                      10,

                    right:
                      8,
                  },
                ])
            }
            isDevelopment
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Comparar ahora",
            },
          ),
        );

        expect(
          await screen.findByText(
            "Diferencias detectadas",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByRole(
            "alert",
          ),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "presenta unavailable controlado",
      async () => {
        render(
          <CatalogShadowPanel
            runComparison={
              async () => ({
                status:
                  "unavailable",

                errorCode:
                  "HTTP_503",

                message:
                  "Shadow de JUNG CORE no disponible en este entorno.",

                startedAt:
                  "2026-10-06T20:00:00.000Z",

                completedAt:
                  "2026-10-06T20:00:00.100Z",

                durationMs:
                  100,
              })
            }
            isDevelopment
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Comparar ahora",
            },
          ),
        );

        expect(
          await screen.findByText(
            "Shadow no disponible",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "presenta error contractual controlado",
      async () => {
        render(
          <CatalogShadowPanel
            runComparison={
              async () => ({
                status:
                  "error",

                errorCode:
                  "JUNG_CORE_SNAPSHOT_INVALID",

                message:
                  "No se pudo completar la comparación Shadow de JUNG CORE.",

                startedAt:
                  "2026-10-06T20:00:00.000Z",

                completedAt:
                  "2026-10-06T20:00:00.100Z",

                durationMs:
                  100,
              })
            }
            isDevelopment
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Comparar ahora",
            },
          ),
        );

        expect(
          await screen.findByRole(
            "alert",
          ),
        ).toHaveTextContent(
          "No se pudo completar Shadow",
        );
      },
    );

    it(
      "limita los detalles visibles a 50",
      async () => {
        const differences:
          CatalogShadowDifference[] =
            Array.from(
              {
                length:
                  60,
              },

              (
                _,
                index,
              ) => ({
                kind:
                  "value-mismatch",

                path:
                  `products[${index}].price_1`,

                left:
                  index,

                right:
                  index +
                  1,
              }),
            );

        render(
          <CatalogShadowPanel
            runComparison={
              async () =>
                readyResult(
                  differences,
                )
            }
            isDevelopment
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Comparar ahora",
            },
          ),
        );

        expect(
          await screen.findByText(
            "Mostrando 50 de 60 diferencias",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getAllByRole(
            "listitem",
          ),
        ).toHaveLength(
          50,
        );
      },
    );

    it(
      "evita doble ejecución concurrente",
      async () => {
        let resolve:
          (
            value:
              CatalogShadowRunResult,
          ) => void =
            () => undefined;

        const pending =
          new Promise<
            CatalogShadowRunResult
          >(
            (resolver) => {
              resolve =
                resolver;
            },
          );

        const runComparison =
          vi.fn(
            () =>
              pending,
          );

        render(
          <CatalogShadowPanel
            runComparison={
              runComparison
            }
            isDevelopment
          />,
        );

        const button =
          screen.getByRole(
            "button",
            {
              name:
                "Comparar ahora",
            },
          );

        fireEvent.click(
          button,
        );

        fireEvent.click(
          button,
        );

        expect(
          runComparison,
        ).toHaveBeenCalledTimes(
          1,
        );

        resolve(
          readyResult(),
        );

        await screen.findByText(
          "Sin diferencias comerciales",
        );
      },
    );

    it(
      "no forma parte de la UI productiva",
      () => {
        const {
          container,
        } =
          render(
            <CatalogShadowPanel
              runComparison={
                vi.fn()
              }
              isDevelopment={
                false
              }
            />,
          );

        expect(
          container,
        ).toBeEmptyDOMElement();
      },
    );
  },
);