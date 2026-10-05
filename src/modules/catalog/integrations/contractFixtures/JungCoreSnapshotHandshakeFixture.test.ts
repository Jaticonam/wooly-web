import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  validateCatalogSnapshotContractV1,
} from "@/shared/contracts/catalog";

import {
  validateAndAdaptCatalogSnapshotToLegacy,
} from "@/modules/catalog/adapters/LegacySnapshotAdapter";

import {
  JungCoreCatalogProvider,
} from "@/modules/catalog/integrations/jungCore/JungCoreCatalogProvider";

import {
  createJungCoreSnapshotHandshakeFixture,
} from "./JungCoreSnapshotHandshakeFixture";

describe(
  "JUNG CORE -> Wooly catalog snapshot handshake",
  () => {
    it(
      "acepta sin cambios el fixture canónico de CORE",
      () => {
        const fixture =
          createJungCoreSnapshotHandshakeFixture();

        expect(
          validateCatalogSnapshotContractV1(
            fixture,
          ),
        ).toEqual({
          ok:
            true,

          data:
            fixture,
        });
      },
    );

    it(
      "adapta identidad, campaña, precio, stock y media al modelo operativo",
      () => {
        const result =
          validateAndAdaptCatalogSnapshotToLegacy(
            createJungCoreSnapshotHandshakeFixture(),

            {
              resolveColorClass:
                (color) =>
                  `campaign-${color}`,
            },
          );

        expect(
          result.ok,
        ).toBe(
          true,
        );

        if (
          result.ok ===
            false
        ) {
          return;
        }

        expect(
          result.data.brandId,
        ).toBe(
          "wooly",
        );

        expect(
          result.data.categories,
        ).toEqual([
          "flores",
        ]);

        expect(
          result.data.campaigns
            .map(
              (
                campaign,
              ) =>
                campaign.id,
            ),
        ).toEqual([
          "cyber-wooly",
        ]);

        expect(
          result.data
            .productsByCategory
            .get(
              "flores",
            )?.[0],
        ).toMatchObject({
          id:
            "WLY001",

          title:
            "Producto contractual",

          category:
            "flores",

          price_1:
            10,

          stock:
            25,

          img:
            "https://media.jungnegocios.com/wooly/products/WLY001_01.jpg",

          priority:
            80,

          campaigns: [
            "cyber-wooly",
          ],
        });
      },
    );

    it(
      "es consumible por JungCoreCatalogProvider con brandId público wooly",
      async () => {
        const fixture =
          createJungCoreSnapshotHandshakeFixture();

        const loader = {
          loadSnapshot:
            vi.fn(
              async () =>
                fixture,
            ),
        };

        const provider =
          new JungCoreCatalogProvider({
            loader,

            expectedBrandId:
              "wooly",

            bootstrapCategories: [
              "flores",
            ],

            resolveColorClass:
              (color) =>
                `campaign-${color}`,

            now:
              () =>
                123456,
          });

        await expect(
          provider.loadCampaigns(),
        ).resolves.toHaveLength(
          1,
        );

        await expect(
          provider.loadCategoryProducts(
            "flores",
            [],
          ),
        ).resolves.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id:
                "WLY001",

              price_1:
                10,

              stock:
                25,
            }),
          ]),
        );

        expect(
          provider.getState(),
        ).toEqual(
          expect.objectContaining({
            status:
              "ready",

            revision:
              "fixture-revision-001",

            generatedAt:
              "2026-10-04T00:00:00.000Z",

            loadedAt:
              123456,

            lastErrorCode:
              null,
          }),
        );

        expect(
          loader.loadSnapshot,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "mantiene el contrato libre de rutas y credenciales de transporte",
      () => {
        const serialized =
          JSON.stringify(
            createJungCoreSnapshotHandshakeFixture(),
          );

        expect(
          serialized,
        ).not.toContain(
          "/catalogo",
        );

        expect(
          serialized,
        ).not.toContain(
          "x-jung-core-read-key",
        );

        expect(
          serialized,
        ).not.toContain(
          "google-sheets",
        );
      },
    );
  },
);
