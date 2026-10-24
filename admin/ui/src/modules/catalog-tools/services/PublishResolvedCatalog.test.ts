import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createEmptyCatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import type {
  CatalogCompositionResolution,
} from "@wooly/contracts/catalog/domain/CatalogCompositionResolver";

import {
  createCatalogPublicationSnapshot,
} from "@wooly/contracts/catalog/domain/CatalogPublication";

import {
  CATALOG_PUBLIC_PUBLICATION_VERSION,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import {
  prepareCatalogPublicationIdentity,
  createDefaultCatalogPublicationIdentity,
} from "@wooly/contracts/catalog/domain/CatalogPublicationIdentity";

import type {
  CatalogPublicationProvider,
  PublishCatalogInput,
} from "@wooly/shared/catalog/providers/CatalogPublicationProvider";

import {
  resolveCatalogPublicPublicationSelection,
} from "@wooly/shared/catalog-export/services/CatalogPublicPublicationSelection";

import type {
  Product,
} from "@wooly/contracts/types/product";

import {
  HttpCatalogPublicationProviderError,
} from "@wooly/shared/catalog/integrations/publication/HttpCatalogPublicationProvider";

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

const BRAND_ID =
  "b-wooly";

const REQUEST_ID =
  "3f6c1e2a-9b4d-4c7e-8a1f-2d3e4f5a6b7c";

describe(
  "PublishResolvedCatalog",
  () => {
    it.each([
      [
        "",
        "Catálogo Mayorista",
      ],
      [
        "   ",
        "Catálogo Mayorista",
      ],
      [
        "  Catálogo octubre  ",
        "Catálogo octubre",
      ],
    ])(
      "envía un título válido para JUNG CORE (%p → %p)",
      async (
        title,
        expected,
      ) => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >(
            async (
              input,
            ) =>
              createPublication(
                input,
                "PUB-TITLE",
              ),
          );

        const publicationIdentity = {
          ...createDefaultCatalogPublicationIdentity(),
          title,
          description:
            "  Mayorista  ",
        };

        const result =
          await publishResolvedCatalog({
            brandId:
              BRAND_ID,
            requestId:
              REQUEST_ID,
            provider:
              createProvider(
                publish,
              ),
            composition:
              createEmptyCatalogComposition(
                "hybrid",
              ),
            publicationIdentity,
            resolution:
              createResolution({
                productIds: [
                  "P-1",
                ],
                automaticProductIds: [
                  "P-1",
                ],
              }),
          });

        expect(
          publish.mock.calls[0]?.[0]
            .publicationIdentity,
        ).toMatchObject({
          title:
            expected,
          description:
            "Mayorista",
        });

        // El estado de la UI conserva la identidad tal como la editó la persona.
        expect(
          result.publicationIdentity,
        ).toBe(
          publicationIdentity,
        );
      },
    );

    it.each([
      null,
      "",
      "   ",
    ])(
      "no publica sin marca de sesión Admin (%p)",
      async (
        brandId,
      ) => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >();

        await expect(
          publishResolvedCatalog({
            brandId,
            requestId:
              REQUEST_ID,
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
              createResolution(),
          }),
        ).resolves.toMatchObject({
          status:
            "unavailable",
        });

        expect(
          publish,
        ).not.toHaveBeenCalled();
      },
    );


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
            brandId:
              BRAND_ID,
            requestId:
              REQUEST_ID,
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
            brandId:
              BRAND_ID,
            requestId:
              REQUEST_ID,
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
            brandId:
              BRAND_ID,
            requestId:
              REQUEST_ID,
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
            brandId:
              BRAND_ID,
            requestId:
              REQUEST_ID,
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
          brandId:
            BRAND_ID,
          requestId:
            REQUEST_ID,
          composition,
          publicationIdentity:
            prepareCatalogPublicationIdentity(
              publicationIdentity,
              "Catálogo Mayorista",
            ),
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
          brandId:
            BRAND_ID,
          requestId:
            REQUEST_ID,
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
          brandId:
            BRAND_ID,
          requestId:
            REQUEST_ID,
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
            brandId:
              BRAND_ID,
            requestId:
              REQUEST_ID,
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

describe(
  "publishResolvedCatalog — HTTP 429 (P4-SEC-03)",
  () => {
    const rateLimitError = (
      retryAfterSeconds?: number,
    ) =>
      new HttpCatalogPublicationProviderError(
        "HTTP_429",
        "El servicio respondió HTTP 429.",
        {
          status: 429,
          retryable: true,
          ...(
            retryAfterSeconds !== undefined
              ? {
                  retryAfterSeconds,
                }
              : {}
          ),
        },
      );

    const publishWith = async (
      error: unknown,
    ) => {
      const publish =
        vi.fn<
          CatalogPublicationProvider["publish"]
        >(
          async () => {
            throw error;
          },
        );

      const composition =
        createEmptyCatalogComposition(
          "hybrid",
        );

      const publicationIdentity =
        createDefaultCatalogPublicationIdentity();

      const result =
        await publishResolvedCatalog({
          brandId:
            BRAND_ID,
          requestId:
            REQUEST_ID,
          provider:
            createProvider(
              publish,
            ),
          composition,
          publicationIdentity,
          resolution:
            createResolution(),
        });

      return {
        publish,
        result,
        composition,
        publicationIdentity,
      };
    };

    it(
      "identifica HTTP 429 como rate-limited con retryAfterSeconds",
      async () => {
        const error =
          rateLimitError(45);

        const {
          publish,
          result,
          composition,
          publicationIdentity,
        } =
          await publishWith(error);

        expect(result).toMatchObject({
          status: "rate-limited",
          retryAfterSeconds: 45,
          error,
          composition,
          publicationIdentity,
        });

        // Sin reintentos automáticos y con la misma clave de idempotencia.
        expect(publish).toHaveBeenCalledTimes(1);
        expect(
          publish.mock.calls[0]?.[0].requestId,
        ).toBe(REQUEST_ID);
      },
    );

    it(
      "omite retryAfterSeconds ausente o no confiable",
      async () => {
        for (const error of [
          rateLimitError(),
          {
            code: "HTTP_429",
            retryAfterSeconds: -3,
          },
          {
            code: "HTTP_429",
            retryAfterSeconds: 999_999,
          },
          {
            code: "HTTP_429",
            retryAfterSeconds: "30",
          },
        ]) {
          const {
            result,
          } =
            await publishWith(error);

          expect(result.status).toBe("rate-limited");
          expect(
            (result as { retryAfterSeconds?: number })
              .retryAfterSeconds,
          ).toBeUndefined();
        }
      },
    );

    it.each([
      ["HTTP_413", 413],
      ["HTTP_410", 410],
      ["HTTP_404", 404],
      ["HTTP_5XX", 503],
    ] as const)(
      "mantiene %s como error",
      async (
        code,
        status,
      ) => {
        const {
          result,
        } =
          await publishWith(
            new HttpCatalogPublicationProviderError(
              code,
              `HTTP ${status}`,
              {
                status,
                retryable:
                  status >= 500,
              },
            ),
          );

        expect(result.status).toBe("error");
      },
    );
  },
);
