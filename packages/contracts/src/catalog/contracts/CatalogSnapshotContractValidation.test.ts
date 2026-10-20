import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
} from "./ProductContract";

import {
  CATALOG_SNAPSHOT_CONTRACT_VERSION,
  type CatalogSnapshotContract,
} from "./CatalogSnapshotContract";

import {
  validateCatalogSnapshotContractV1,
} from "./CatalogSnapshotContractValidation";

function validSnapshot():
  CatalogSnapshotContract {
  return {
    contractVersion:
      CATALOG_SNAPSHOT_CONTRACT_VERSION,

    brandId: "wooly",
    revision: "revision-001",
    generatedAt:
      "2026-08-03T07:00:00.000Z",

    categories: [{
      id: "flores",
      slug: "flores",
      name: "Flores",
      icon: "flower",
      priority: 100,
      publicationStatus:
        "published",
    }],

    campaigns: [{
      id: "dia-madre",
      slug: "dia-de-la-madre",
      name: "Día de la Madre",
      icon: "flower",
      color: "lavanda",
      themeToken:
        "campaign.lavanda",
      startsAt: null,
      endsAt: null,
      priority: 100,
      publicationStatus:
        "published",
    }],

    products: [{
      contractVersion:
        CATALOG_PRODUCT_CONTRACT_VERSION,

      id: "core-product-1",
      sku: "WLY-001",
      slug: "producto-prueba",

      brandId: "wooly",
      categoryId: "flores",

      title:
        "Producto de prueba",
      description:
        "Descripción de prueba",

      campaignIds: [
        "dia-madre",
      ],

      manualBadgeCodes: [
        "mas-vendido",
      ],

      priority: 80,

      publicationStatus:
        "published",

      pricing: {
        currency: "PEN",

        volumePrices: [{
          id: "price-1",
          minimumQuantity: 1,
          unitPrice: 10,
        }],

        offer: null,
      },

      inventory: {
        tracked: true,
        availableQuantity: 25,
        status: "available",
        updatedAt: null,
      },

      mediaAssets: [{
        id: "cover",
        kind: "image",
        url:
          "https://example.com/cover.jpg",
        thumbnailUrl: null,
        altText:
          "Producto de prueba",
        position: 0,
        isPrimary: true,
      }],

      updatedAt: null,
    }],
  };
}

describe(
  "CatalogSnapshotContractValidation",
  () => {
    it(
      "acepta un snapshot coherente",
      () => {
        const snapshot =
          validSnapshot();

        expect(
          validateCatalogSnapshotContractV1(
            snapshot,
          ),
        ).toEqual({
          ok: true,
          data: snapshot,
        });
      },
    );

    it(
      "rechaza versiones desconocidas",
      () => {
        const result =
          validateCatalogSnapshotContractV1({
            ...validSnapshot(),
            contractVersion:
              "catalog-snapshot.v2",
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "UNSUPPORTED_CONTRACT_VERSION",
                path:
                  "contractVersion",
              }),
            ]),
          );
        }
      },
    );

    it(
      "prefija los errores de contratos anidados",
      () => {
        const result =
          validateCatalogSnapshotContractV1({
            ...validSnapshot(),
            categories: [{}],
            campaigns: [{}],
            products: [{}],
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors.some(
              (issue) =>
                issue.path.startsWith(
                  "categories[0]",
                ),
            ),
          ).toBe(true);

          expect(
            result.errors.some(
              (issue) =>
                issue.path.startsWith(
                  "campaigns[0]",
                ),
            ),
          ).toBe(true);

          expect(
            result.errors.some(
              (issue) =>
                issue.path.startsWith(
                  "products[0]",
                ),
            ),
          ).toBe(true);
        }
      },
    );

    it(
      "rechaza identificadores duplicados",
      () => {
        const snapshot =
          validSnapshot();

        const category =
          snapshot.categories[0];

        const result =
          validateCatalogSnapshotContractV1({
            ...snapshot,
            categories: [
              category,
              {
                ...category,
                slug:
                  "otra-categoria",
              },
            ],
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "DUPLICATE_IDENTIFIER",
                path:
                  "categories[1].id",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza categorías inexistentes",
      () => {
        const snapshot =
          validSnapshot();

        const result =
          validateCatalogSnapshotContractV1({
            ...snapshot,
            products: [{
              ...snapshot.products[0],
              categoryId:
                "categoria-inexistente",
            }],
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "UNKNOWN_CATEGORY",
                path:
                  "products[0].categoryId",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza campañas inexistentes",
      () => {
        const snapshot =
          validSnapshot();

        const result =
          validateCatalogSnapshotContractV1({
            ...snapshot,
            products: [{
              ...snapshot.products[0],
              campaignIds: [
                "campaña-inexistente",
              ],
            }],
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "UNKNOWN_CAMPAIGN",
                path:
                  "products[0].campaignIds[0]",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza productos de otra marca",
      () => {
        const snapshot =
          validSnapshot();

        const result =
          validateCatalogSnapshotContractV1({
            ...snapshot,
            products: [{
              ...snapshot.products[0],
              brandId: "otra-marca",
            }],
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "BRAND_MISMATCH",
                path:
                  "products[0].brandId",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza generatedAt inválido",
      () => {
        const result =
          validateCatalogSnapshotContractV1({
            ...validSnapshot(),
            generatedAt:
              "fecha-inválida",
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code: "INVALID_DATE",
                path: "generatedAt",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza colecciones que no son arrays",
      () => {
        const result =
          validateCatalogSnapshotContractV1({
            ...validSnapshot(),
            categories: "flores",
            campaigns: null,
            products: {},
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors.filter(
              (issue) =>
                issue.code ===
                "INVALID_FIELD_TYPE",
            ),
          ).toHaveLength(3);
        }
      },
    );
  },
);