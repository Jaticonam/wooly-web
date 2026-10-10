import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateCatalogProductContractV1,
} from "@/shared/contracts/catalog";
import {
  getVolumeUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";
import {
  isProductPublicationDataValid,
} from "@/modules/catalog/domain/ProductCommercialPolicy";

import {
  invalidCatalogProductFixtures,
  validCatalogProductFixtures,
} from "./CatalogProductFixtures";
import {
  ContractFixtureCatalogProvider,
} from "./ContractFixtureCatalogProvider";

describe(
  "fixtures contractuales",
  () => {
    it(
      "valida todos los fixtures válidos",
      () => {
        validCatalogProductFixtures
          .forEach(
            (fixture) => {
              expect(
                validateCatalogProductContractV1(
                  fixture,
                ).ok,
              ).toBe(true);
            },
          );
      },
    );

    it(
      "rechaza fixture inválido y versión desconocida",
      () => {
        expect(
          invalidCatalogProductFixtures
            .map(
              (fixture) =>
                validateCatalogProductContractV1(
                  fixture,
                ).ok,
            ),
        ).toEqual([
          false,
          false,
        ]);
      },
    );
  },
);

describe(
  "ContractFixtureCatalogProvider",
  () => {
    it(
      "adapta contratos válidos sin mutarlos",
      async () => {
        const fixtures =
          structuredClone(
            validCatalogProductFixtures,
          );
        const before =
          structuredClone(fixtures);
        const provider =
          new ContractFixtureCatalogProvider(
            fixtures,
          );
        const products =
          await provider
            .loadCategoryProducts(
              "flores",
              [],
            );

        expect(fixtures).toEqual(
          before,
        );
        expect(products).toHaveLength(
          fixtures.length,
        );
        expect(products[0].sku).toBe("FIX-AVAILABLE");
        expect(products[0].id).toBe(
          "canonical-available",
        );
      },
    );

    it(
      "conserva pricing, inventario, media y campañas representables",
      async () => {
        const provider =
          new ContractFixtureCatalogProvider();
        const products =
          await provider
            .loadCategoryProducts(
              "flores",
              [],
            );
        const tiers =
          products.find(
            (product) =>
              product.id ===
              "canonical-tiers",
          );
        const media =
          products.find(
            (product) =>
              product.id ===
              "canonical-media",
          );

        expect(tiers).toMatchObject({
          price_1: 10,
          price_3: 9,
          price_12: 8,
          price_50: 7,
          price_100: 6,
          campaigns: [
            "fixture-campaign",
          ],
        });
        expect(
          getVolumeUnitPrice(
            tiers!,
            3,
          ),
        ).toBe(9);
        expect(media).toMatchObject({
          img:
            "https://fixtures.example/available.jpg",
          gallery:
            "https://fixtures.example/gallery.jpg",
        });
      },
    );

    it(
      "diagnostica rechazos y tiers no soportados",
      async () => {
        const provider =
          new ContractFixtureCatalogProvider([
            ...validCatalogProductFixtures,
            ...invalidCatalogProductFixtures,
          ]);
        const result =
          await provider
            .loadCategoryProductsDetailed(
              "flores",
              [],
            );

        expect(
          result.diagnostics,
        ).toMatchObject({
          receivedCount:
            validCatalogProductFixtures
              .length +
            invalidCatalogProductFixtures
              .length,
          validCount:
            validCatalogProductFixtures
              .length,
          rejectedCount: 2,
          unsupportedTierCount: 1,
        });
        expect(
          result.issues.map(
            (issue) => issue.code,
          ),
        ).toEqual(
          expect.arrayContaining([
            "INVALID_CONTRACT_VERSION",
            "UNSUPPORTED_VOLUME_TIER",
          ]),
        );
      },
    );

    it(
      "acepta resultado vacío y todos inválidos",
      async () => {
        const empty =
          new ContractFixtureCatalogProvider(
            [],
          );
        const invalid =
          new ContractFixtureCatalogProvider(
            invalidCatalogProductFixtures,
          );

        await expect(
          empty.loadCategoryProducts(
            "flores",
            [],
          ),
        ).resolves.toEqual([]);
        expect(
          (
            await invalid
              .loadCategoryProductsDetailed(
                "flores",
                [],
              )
          ).diagnostics,
        ).toMatchObject({
          validCount: 0,
          rejectedCount: 2,
        });
      },
    );

    it(
      "mantiene compatibilidad con Commercial Policy",
      async () => {
        const products =
          await new ContractFixtureCatalogProvider()
            .loadCategoryProducts(
              "flores",
              [],
            );

        expect(
          products.find(
            (product) =>
              product.id ===
              "canonical-available",
          ),
        ).toSatisfy(
          isProductPublicationDataValid,
        );
        expect(
          isProductPublicationDataValid(
            products.find(
              (product) =>
                product.id ===
                "canonical-archived",
            )!,
          ),
        ).toBe(false);
      },
    );
  },
);
