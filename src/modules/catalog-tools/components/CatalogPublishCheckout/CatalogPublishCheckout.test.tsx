import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createEmptyCatalogComposition,
  type CatalogComposition,
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

import CatalogPublishCheckout from "./CatalogPublishCheckout";

vi.mock(
  "@/modules/catalog-tools/components/CommercialOutputsPanel/CommercialOutputsPanel",
  () => ({
    default: ({
      hasPublicUrl,
      pdfUrl,
    }: {
      productCount:
        number;
      hasPublicUrl:
        boolean;
      pdfUrl:
        string;
    }) => (
      <div
        data-testid="commercial-outputs"
        data-has-public-url={
          String(
            hasPublicUrl,
          )
        }
        data-pdf-url={
          pdfUrl
        }
      />
    ),
  }),
);

const publicationIdentity =
  createDefaultCatalogPublicationIdentity();

function createComposition({
  categoryIds = [],
  campaignIds = [],
}: {
  categoryIds?:
    readonly string[];
  campaignIds?:
    readonly string[];
}): CatalogComposition {
  const composition =
    createEmptyCatalogComposition(
      "hybrid",
    );

  composition.filters = {
    ...composition.filters,
    sourceOperator:
      "union",
    categoryIds: [
      ...categoryIds,
    ],
    campaignIds: [
      ...campaignIds,
    ],
  };

  return composition;
}

function createResolution(
  productIds:
    readonly string[],

  overrides:
    Partial<CatalogCompositionResolution> =
      {},
): CatalogCompositionResolution {
  return {
    products:
      [],

    productIds: [
      ...productIds,
    ],

    automaticProductIds: [
      ...productIds,
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
  };
}

function createPublication(
  input:
    PublishCatalogInput,

  publicId:
    string,
) {
  return {
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
          7,
      }),

    version:
      CATALOG_PUBLIC_PUBLICATION_VERSION,
  };
}

function createProvider(
  publish:
    CatalogPublicationProvider["publish"],
): CatalogPublicationProvider {
  return {
    source:
      "checkout-test-provider",

    publish,

    getByPublicId:
      vi.fn(
        async () =>
          null,
      ),
  };
}

function renderCheckout({
  composition,
  resolution,
  provider,
}: {
  composition:
    CatalogComposition;
  resolution:
    CatalogCompositionResolution;
  provider:
    CatalogPublicationProvider | null;
}) {
  return render(
    <CatalogPublishCheckout
      composition={
        composition
      }
      resolution={
        resolution
      }
      publicationIdentity={
        publicationIdentity
      }
      modeLabel="Selección"
      categorySummary="Categorías"
      campaignSummary="Campañas"
      publicationProvider={
        provider
      }
    />,
  );
}

describe(
  "CatalogPublishCheckout Output Semantics V2",
  () => {
    it(
      "mantiene V1 para una categoría representable y no llama publish",
      () => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >();

        renderCheckout({
          composition:
            createComposition({
              categoryIds: [
                "flores",
              ],
            }),
          resolution:
            createResolution([
              "P-1",
            ]),
          provider:
            createProvider(
              publish,
            ),
        });

        expect(
          screen.getByText(
            /\/catalogo\/pdf\?v=1&cat=flores/,
          ),
        ).toBeInTheDocument();

        expect(
          publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "mantiene V2 para varias categorías representables y no llama publish",
      () => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >();

        renderCheckout({
          composition:
            createComposition({
              categoryIds: [
                "flores",
                "peluches",
              ],
            }),
          resolution:
            createResolution([
              "P-1",
              "P-2",
            ]),
          provider:
            createProvider(
              publish,
            ),
        });

        expect(
          screen.getByText(
            /\/catalogo\/pdf\?v=2&cats=flores%2Cpeluches|\/catalogo\/pdf\?v=2&cats=flores,peluches/,
          ),
        ).toBeInTheDocument();

        expect(
          publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "publica category UNION campaign una sola vez y usa Public ID",
      async () => {
        const composition =
          createComposition({
            categoryIds: [
              "flores",
            ],
            campaignIds: [
              "cyber-wooly",
            ],
          });

        const resolution =
          createResolution([
            "CAT-ONLY",
            "CAMPAIGN-ONLY",
          ]);

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

        renderCheckout({
          composition,
          resolution,
          provider:
            createProvider(
              publish,
            ),
        });

        const button =
          screen.getByRole(
            "button",
            {
              name:
                "Generar enlace público",
            },
          );

        fireEvent.click(
          button,
        );

        fireEvent.click(
          button,
        );

        expect(
          publish,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          publish,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            composition,
            publicationIdentity,
            resolvedProductIds: [
              "CAT-ONLY",
              "CAMPAIGN-ONLY",
            ],
          }),
        );

        await waitFor(
          () => {
            expect(
              screen.getByText(
                /\/catalogo\/pdf\?id=PUB-UNION/,
              ),
            ).toBeInTheDocument();
          },
        );
      },
    );

    it(
      "falla cerrado cuando el provider no está configurado",
      () => {
        renderCheckout({
          composition:
            createComposition({
              categoryIds: [
                "flores",
              ],
              campaignIds: [
                "cyber-wooly",
              ],
            }),
          resolution:
            createResolution([
              "P-1",
            ]),
          provider:
            null,
        });

        expect(
          screen.getByText(
            "Publicación personalizada no disponible en este entorno",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Generar enlace público",
            },
          ),
        ).not.toBeInTheDocument();
      },
    );

    it(
      "bloquea resolución incompleta sin llamar al provider",
      () => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >();

        renderCheckout({
          composition:
            createComposition({
              categoryIds: [
                "flores",
              ],
              campaignIds: [
                "cyber-wooly",
              ],
            }),
          resolution:
            createResolution(
              [
                "P-1",
              ],
              {
                missingIncludedProductIds: [
                  "P-MISSING",
                ],
                isFullyResolved:
                  false,
              },
            ),
          provider:
            createProvider(
              publish,
            ),
        });

        expect(
          screen.getByText(
            "La selección todavía no puede publicarse",
          ),
        ).toBeInTheDocument();

        expect(
          publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "conserva la composición ante error y permite reintentar",
      async () => {
        const composition =
          createComposition({
            categoryIds: [
              "flores",
            ],
            campaignIds: [
              "cyber-wooly",
            ],
          });

        const resolution =
          createResolution([
            "P-1",
          ]);

        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >()
            .mockRejectedValueOnce(
              new Error(
                "HTTP 500",
              ),
            )
            .mockImplementationOnce(
              async (
                input,
              ) =>
                createPublication(
                  input,
                  "PUB-RETRY",
                ),
            );

        renderCheckout({
          composition,
          resolution,
          provider:
            createProvider(
              publish,
            ),
        });

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Generar enlace público",
            },
          ),
        );

        await screen.findByText(
          "No se pudo generar el enlace público",
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Reintentar publicación",
            },
          ),
        );

        await waitFor(
          () => {
            expect(
              screen.getByText(
                /\/catalogo\/pdf\?id=PUB-RETRY/,
              ),
            ).toBeInTheDocument();
          },
        );

        expect(
          publish,
        ).toHaveBeenCalledTimes(
          2,
        );
      },
    );
  },
);
