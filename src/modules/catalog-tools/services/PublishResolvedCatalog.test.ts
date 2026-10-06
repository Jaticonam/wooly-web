import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createEmptyCatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import type {
  CatalogCompositionResolution,
} from "@/modules/catalog/domain/CatalogCompositionResolver";

import {
  createCatalogPublicationSnapshot,
} from "@/modules/catalog/domain/CatalogPublication";

import {
  CATALOG_PUBLIC_PUBLICATION_VERSION,
} from "@/modules/catalog/domain/CatalogPublicPublication";

import {
  createDefaultCatalogPublicationIdentity,
} from "@/modules/catalog/domain/CatalogPublicationIdentity";

import type {
  CatalogPublicationProvider,
  PublishCatalogInput,
} from "@/modules/catalog/providers/CatalogPublicationProvider";

import {
  resolveCatalogPublicPublicationSelection,
} from "@/modules/catalog-export/services/CatalogPublicPublicationSelection";

import type {
  Product,
} from "@/shared/types/product";

import {
  publishResolvedCatalog,
} from "./PublishResolvedCatalog";

const createResolution = (
  overrides:
    Partial<CatalogCompositionResolution> =
      {},
): CatalogCompositionResolution => ({
  products:
    [],

  productIds:
    [
      "P-1",
    ],

  automaticProductIds:
    [
      "P-1",
    ],

  manuallyIncludedProductIds:
    [],

  excludedProductIds:
    [],

  blockedIncludedProductIds:
    [],

  missingIncludedProductIds:
    [],

  unsupportedAttributeFilters:
    [],

  isFullyResolved:
    true,

  ...overrides,
});

const createProvider = (
  publish:
    CatalogPublicationProvider["publish"],
): CatalogPublicationProvider => ({
  source:
    "test-publication-provider",

  publish,

  getByPublicId:
    vi.fn(
      async () =>
        null,
    ),
});

const createPublication = (
  input:
    PublishCatalogInput,

  publicId =
    "PUB-TEST",
) => ({
  publicId,

  composition:
    input.composition,

  publicationIdentity:
    input.publicationIdentity,

  publication:
    createCatalogPublicationSnapshot({
      mode:
        input.composition.mode,

      resolvedProductIds:
        input.resolvedProductIds,

      publishedAt:
        new Date(
          "2026-10-06T16:30:00.000Z",
        ),

      validityDays:
        input.validityDays ??
        7,
    }),

  version:
    CATALOG_PUBLIC_PUBLICATION_VERSION,
});

const product = ({
  id,
  category,
  campaigns = [],
}: {
  id:
    string;

  category:
    string;

  campaigns?:
    string[];
}): Product => ({
  id,

  title:
    id,

  description:
    id,

  category,

  price_1:
    10,

  stock:
    10,

  img:
    "/placeholder.svg",

  status:
    "publicado",

  campaigns,

  priority:
    0,
});

describe(
  "PublishResolvedCatalog",
  () => {
    it(
      "falla cerrado cuando no existe provider",
      async () => {
        const composition =
          createEmptyCatalogComposition(
            "hybrid",
          );

        const publicationIdentity =
          createDefaultCatalogPublicationIdentity();

        await expect(
          publishResolvedCatalog({
            provider:
              null,
            composition,
            publicationIdentity,
            resolution:
              createResolution(),
          }),
        ).resolves.toMatchObject({
          status:
            "unavailable",
          composition,
          publicationIdentity,
        });
      },
    );

    it(
      "no publica una resolución vacía",
      async () => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >();

        const result =
          await publishResolvedCatalog({
            provider:
              createProvider(
                publish,
              ),
            composition:
              createEmptyCatalogComposition(
                "hybrid",
              ),
            publicationIdentity:
              createDefaultCatalogPublicationIdentity(),
            resolution:
              createResolution({
                productIds:
                  [],
                automaticProductIds:
                  [],
              }),
          });

        expect(
          result,
        ).toMatchObject({
          status:
            "blocked",
          reason:
            "EMPTY_RESOLUTION",
        });

        expect(
          publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "bloquea cualquier resolución incompleta sin llamar al provider",
      async () => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >();

        const result =
          await publishResolvedCatalog({
            provider:
              createProvider(
                publish,
              ),
            composition:
              createEmptyCatalogComposition(
                "hybrid",
              ),
            publicationIdentity:
              createDefaultCatalogPublicationIdentity(),
            resolution:
              createResolution({
                missingIncludedProductIds: [
                  "P-MISSING",
                ],
                isFullyResolved:
                  false,
              }),
          });

        expect(
          result,
        ).toMatchObject({
          status:
            "blocked",
          reason:
            "INCOMPLETE_RESOLUTION",
        });

        expect(
          publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "envía exactamente resolution.productIds y conserva snapshot fixed para Content Sources V2",
      async () => {
        const composition =
          createEmptyCatalogComposition(
            "hybrid",
          );

        composition.filters = {
          ...composition.filters,
          sourceOperator:
            "union",
          categoryIds: [
            "flores",
          ],
          campaignIds: [
            "cyber-wooly",
          ],
        };

        const publicationIdentity =
          createDefaultCatalogPublicationIdentity();

        const resolution =
          createResolution({
            productIds: [
              "CAT-ONLY",
              "CAMPAIGN-ONLY",
            ],
            automaticProductIds: [
              "CAT-ONLY",
              "CAMPAIGN-ONLY",
            ],
          });

        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >(
            async (
              input,
            ) =>
              createPublication(
                input,
                "PUB-UNION",
              ),
          );

        const result =
          await publishResolvedCatalog({
            provider:
              createProvider(
                publish,
              ),
            composition,
            publicationIdentity,
            resolution,
            validityDays:
              7,
          });

        expect(
          publish,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          publish,
        ).toHaveBeenCalledWith({
          composition,
          publicationIdentity,
          resolvedProductIds: [
            "CAT-ONLY",
            "CAMPAIGN-ONLY",
          ],
          validityDays:
            7,
        });

        expect(
          result.status,
        ).toBe(
          "ready",
        );

        if (
          result.status !==
          "ready"
        ) {
          throw new Error(
            "Se esperaba publicación lista.",
          );
        }

        expect(
          result.publicId,
        ).toBe(
          "PUB-UNION",
        );

        expect(
          result.publication
            .publication,
        ).toMatchObject({
          strategy:
            "fixed",
          productIds: [
            "CAT-ONLY",
            "CAMPAIGN-ONLY",
          ],
        });

        const publicSelection =
          resolveCatalogPublicPublicationSelection({
            publication:
              result.publication,
            products: [
              product({
                id:
                  "CAT-ONLY",
                category:
                  "flores",
              }),
              product({
                id:
                  "CAMPAIGN-ONLY",
                category:
                  "cajas",
                campaigns: [
                  "cyber-wooly",
                ],
              }),
            ],
            campaigns:
              [],
          });

        expect(
          publicSelection
            .products
            .map(
              (currentProduct) =>
                currentProduct.id,
            ),
        ).toEqual([
          "CAT-ONLY",
          "CAMPAIGN-ONLY",
        ]);
      },
    );

    it(
      "congela el producto explícito añadido dentro del resultado final",
      async () => {
        const composition =
          createEmptyCatalogComposition(
            "hybrid",
          );

        composition.filters.categoryIds = [
          "flores",
        ];

        composition.overrides.includedProductIds = [
          "MANUAL-1",
        ];

        const publicationIdentity =
          createDefaultCatalogPublicationIdentity();

        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >(
            async (
              input,
            ) =>
              createPublication(
                input,
                "PUB-ADDED",
              ),
          );

        await publishResolvedCatalog({
          provider:
            createProvider(
              publish,
            ),
          composition,
          publicationIdentity,
          resolution:
            createResolution({
              automaticProductIds: [
                "BASE-1",
              ],
              manuallyIncludedProductIds: [
                "MANUAL-1",
              ],
              productIds: [
                "BASE-1",
                "MANUAL-1",
              ],
            }),
        });

        expect(
          publish,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            resolvedProductIds: [
              "BASE-1",
              "MANUAL-1",
            ],
          }),
        );
      },
    );

    it(
      "congela solamente los IDs finales cuando se retira un producto",
      async () => {
        const composition =
          createEmptyCatalogComposition(
            "hybrid",
          );

        composition.filters.categoryIds = [
          "flores",
        ];

        composition.overrides.excludedProductIds = [
          "REMOVED-1",
        ];

        const publicationIdentity =
          createDefaultCatalogPublicationIdentity();

        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >(
            async (
              input,
            ) =>
              createPublication(
                input,
                "PUB-REMOVED",
              ),
          );

        await publishResolvedCatalog({
          provider:
            createProvider(
              publish,
            ),
          composition,
          publicationIdentity,
          resolution:
            createResolution({
              automaticProductIds: [
                "KEEP-1",
                "REMOVED-1",
              ],
              excludedProductIds: [
                "REMOVED-1",
              ],
              productIds: [
                "KEEP-1",
              ],
            }),
        });

        expect(
          publish,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            resolvedProductIds: [
              "KEEP-1",
            ],
          }),
        );
      },
    );

    it(
      "convierte el error del provider en estado controlado y preserva la composición",
      async () => {
        const composition =
          createEmptyCatalogComposition(
            "hybrid",
          );

        const publicationIdentity =
          createDefaultCatalogPublicationIdentity();

        const error =
          new Error(
            "provider fuera de línea",
          );

        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >(
            async () => {
              throw error;
            },
          );

        const result =
          await publishResolvedCatalog({
            provider:
              createProvider(
                publish,
              ),
            composition,
            publicationIdentity,
            resolution:
              createResolution(),
          });

        expect(
          result,
        ).toMatchObject({
          status:
            "error",
          composition,
          publicationIdentity,
          error,
        });
      },
    );
  },
);
