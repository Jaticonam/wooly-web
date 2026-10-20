import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createCatalogPublicationSnapshot,
  isCatalogPublicationExpired,
  resolveCatalogPublicationStrategy,
} from "./CatalogPublication";

describe(
  "CatalogPublication",
  () => {
    it(
      "automatic publica como dinámica",
      () => {
        expect(
          resolveCatalogPublicationStrategy(
            "automatic",
          ),
        ).toBe(
          "dynamic",
        );
      },
    );

    it.each([
      "hybrid",
      "manual",
    ] as const)(
      "%s publica como fija",
      (mode) => {
        expect(
          resolveCatalogPublicationStrategy(
            mode,
          ),
        ).toBe(
          "fixed",
        );
      },
    );

    it(
      "una publicación fija conserva exactamente los IDs resueltos",
      () => {
        const snapshot =
          createCatalogPublicationSnapshot({
            mode:
              "manual",

            resolvedProductIds: [
              "P-1",
              "P-2",
              "P-1",
            ],

            publishedAt:
              new Date(
                "2026-08-07T20:00:00.000Z",
              ),

            validityDays:
              7,
          });

        expect(
          snapshot,
        ).toMatchObject({
          strategy:
            "fixed",

          productIds: [
            "P-1",
            "P-2",
          ],

          publishedAt:
            "2026-08-07T20:00:00.000Z",

          validUntil:
            "2026-08-14T20:00:00.000Z",

          version:
            1,
        });
      },
    );

    it(
      "una publicación dinámica no congela IDs",
      () => {
        const snapshot =
          createCatalogPublicationSnapshot({
            mode:
              "automatic",

            resolvedProductIds: [
              "P-1",
              "P-2",
            ],

            publishedAt:
              new Date(
                "2026-08-07T20:00:00.000Z",
              ),
          });

        expect(
          snapshot.strategy,
        ).toBe(
          "dynamic",
        );

        expect(
          snapshot.productIds,
        ).toEqual(
          [],
        );
      },
    );

    it(
      "rechaza publicación vacía",
      () => {
        expect(
          () =>
            createCatalogPublicationSnapshot({
              mode:
                "manual",

              resolvedProductIds:
                [],
            }),
        ).toThrow(
          "sin productos",
        );
      },
    );

    it(
      "detecta expiración por vigencia",
      () => {
        const snapshot =
          createCatalogPublicationSnapshot({
            mode:
              "hybrid",

            resolvedProductIds: [
              "P-1",
            ],

            publishedAt:
              new Date(
                "2026-08-07T20:00:00.000Z",
              ),

            validityDays:
              7,
          });

        expect(
          isCatalogPublicationExpired(
            snapshot,

            new Date(
              "2026-08-10T20:00:00.000Z",
            ),
          ),
        ).toBe(
          false,
        );

        expect(
          isCatalogPublicationExpired(
            snapshot,

            new Date(
              "2026-08-15T20:00:00.000Z",
            ),
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);