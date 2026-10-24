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
  HttpCatalogPublicationProviderError,
} from "@wooly/shared/catalog/integrations/publication/HttpCatalogPublicationProvider";

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

let requestSequence =
  0;

const nextRequestId =
  (): string => {
    requestSequence += 1;

    return `checkout-request-${String(
      requestSequence,
    ).padStart(
      4,
      "0",
    )}`;
  };

function renderCheckout({
  composition,
  resolution,
  provider,
  brandId =
    "b-wooly",
}: {
  composition:
    CatalogComposition;
  resolution:
    CatalogCompositionResolution;
  provider:
    CatalogPublicationProvider | null;
  brandId?:
    string | null;
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
      brandId={
        brandId
      }
      createRequestId={
        nextRequestId
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
            brandId:
              "b-wooly",
            requestId:
              expect.stringMatching(
                /^checkout-request-\d{4}$/,
              ),
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

        // El reintento reutiliza la misma clave de idempotencia.
        expect(
          publish.mock.calls[1]?.[0]
            .requestId,
        ).toBe(
          publish.mock.calls[0]?.[0]
            .requestId,
        );
      },
    );

    it(
      "usa otra clave de idempotencia cuando cambia el contenido",
      async () => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >(
            async (
              input,
            ) =>
              createPublication(
                input,
                `PUB-${input.resolvedProductIds.join("-")}`,
              ),
          );

        const provider =
          createProvider(
            publish,
          );

        const composition =
          createComposition({
            categoryIds: [
              "flores",
            ],
            campaignIds: [
              "cyber-wooly",
            ],
          });

        const view =
          renderCheckout({
            composition,
            resolution:
              createResolution([
                "P-1",
              ]),
            provider,
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
          /\/catalogo\/pdf\?id=PUB-P-1/,
        );

        view.rerender(
          <CatalogPublishCheckout
            composition={
              composition
            }
            resolution={
              createResolution([
                "P-1",
                "P-2",
              ])
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
            brandId="b-wooly"
            createRequestId={
              nextRequestId
            }
          />,
        );

        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name:
                "Generar enlace público",
            },
          ),
        );

        await waitFor(
          () => {
            expect(
              publish,
            ).toHaveBeenCalledTimes(
              2,
            );
          },
        );

        expect(
          publish.mock.calls[1]?.[0]
            .requestId,
        ).not.toBe(
          publish.mock.calls[0]?.[0]
            .requestId,
        );
      },
    );

    it(
      "no llama al provider sin marca de sesión Admin",
      async () => {
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
            createResolution([
              "P-1",
            ]),
          provider:
            createProvider(
              publish,
            ),
          brandId:
            null,
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

        await waitFor(
          () => {
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

        expect(
          publish,
        ).not.toHaveBeenCalled();
      },
    );
  },
);

describe(
  "CatalogPublishCheckout — HTTP 429 (P4-SEC-03)",
  () => {
    const rateLimited = (
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

    const composition =
      createComposition({
        categoryIds: [
          "flores",
        ],
        campaignIds: [
          "cyber-wooly",
        ],
      });

    it(
      "muestra la espera, bloquea el reintento y lo habilita sin solicitudes automáticas",
      async () => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >()
            .mockRejectedValueOnce(
              rateLimited(1),
            )
            .mockImplementationOnce(
              async (
                input,
              ) =>
                createPublication(
                  input,
                  "PUB-AFTER-429",
                ),
            );

        renderCheckout({
          composition,
          resolution:
            createResolution([
              "P-1",
            ]),
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
          "JUNG CORE recibió demasiadas solicitudes",
        );

        expect(
          screen.getByText(
            "Espera 1 segundo antes de reintentar.",
          ),
        ).toBeInTheDocument();

        const retry =
          screen.getByRole(
            "button",
            {
              name:
                "Reintentar publicación",
            },
          );

        expect(retry).toBeDisabled();

        // Un clic durante la espera no envía nada.
        fireEvent.click(retry);

        expect(publish).toHaveBeenCalledTimes(1);

        await waitFor(
          () =>
            expect(
              screen.getByRole(
                "button",
                {
                  name:
                    "Reintentar publicación",
                },
              ),
            ).toBeEnabled(),
          {
            timeout: 3000,
          },
        );

        expect(
          screen.getByText(
            "Ya puedes reintentar la publicación.",
          ),
        ).toBeInTheDocument();

        // Vencida la espera, sigue sin reintento automático.
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              300,
            ),
        );

        expect(publish).toHaveBeenCalledTimes(1);

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Reintentar publicación",
            },
          ),
        );

        await screen.findByText(
          /\/catalogo\/pdf\?id=PUB-AFTER-429/,
        );

        expect(publish).toHaveBeenCalledTimes(2);

        // HTTP 429 no genera un requestId nuevo.
        expect(
          publish.mock.calls[1]?.[0].requestId,
        ).toBe(
          publish.mock.calls[0]?.[0].requestId,
        );

        // Composición, identidad y selección comercial intactas.
        expect(
          publish.mock.calls[1]?.[0].composition,
        ).toEqual(
          publish.mock.calls[0]?.[0].composition,
        );

        expect(
          publish.mock.calls[1]?.[0].publicationIdentity,
        ).toEqual(
          publish.mock.calls[0]?.[0].publicationIdentity,
        );

        expect(
          publish.mock.calls[1]?.[0].resolvedProductIds,
        ).toEqual([
          "P-1",
        ]);
      },
    );

    it(
      "sin Retry-After permite reintento manual inmediato y evita duplicados en curso",
      async () => {
        let resolveRetry:
          (() => void) | undefined;

        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >()
            .mockRejectedValueOnce(
              rateLimited(),
            )
            .mockImplementationOnce(
              (input) =>
                new Promise(
                  (resolve) => {
                    resolveRetry =
                      () =>
                        resolve(
                          createPublication(
                            input,
                            "PUB-MANUAL",
                          ),
                        );
                  },
                ),
            );

        renderCheckout({
          composition,
          resolution:
            createResolution([
              "P-1",
            ]),
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
          "Espera unos instantes antes de reintentar.",
        );

        const retry =
          screen.getByRole(
            "button",
            {
              name:
                "Reintentar publicación",
            },
          );

        expect(retry).toBeEnabled();

        fireEvent.click(retry);
        fireEvent.click(retry);

        await screen.findAllByText(
          "Publicando catálogo...",
        );

        expect(publish).toHaveBeenCalledTimes(2);

        resolveRetry?.();

        await screen.findByText(
          /\/catalogo\/pdf\?id=PUB-MANUAL/,
        );

        expect(publish).toHaveBeenCalledTimes(2);

        expect(
          publish.mock.calls[1]?.[0].requestId,
        ).toBe(
          publish.mock.calls[0]?.[0].requestId,
        );
      },
    );

    it(
      "otros errores mantienen el mensaje genérico existente",
      async () => {
        const publish =
          vi.fn<
            CatalogPublicationProvider["publish"]
          >()
            .mockRejectedValueOnce(
              new HttpCatalogPublicationProviderError(
                "HTTP_5XX",
                "HTTP 503",
                {
                  status: 503,
                  retryable: true,
                },
              ),
            );

        renderCheckout({
          composition,
          resolution:
            createResolution([
              "P-1",
            ]),
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

        expect(
          screen.queryByText(
            "JUNG CORE recibió demasiadas solicitudes",
          ),
        ).not.toBeInTheDocument();
      },
    );
  },
);
