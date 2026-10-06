import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  resolveCatalogPublicationEligibility,
} from "@/modules/catalog/domain/CatalogPublicationEligibility";

import {
  type CatalogPublicationIdentity,
} from "@/modules/catalog/domain/CatalogPublicationIdentity";

import type {
  CatalogPublicationProvider,
} from "@/modules/catalog/providers/CatalogPublicationProvider";

import {
  catalogPublicationProvider,
} from "@/modules/catalog/providers/DefaultCatalogPublicationProvider";

import {
  createWoolyCatalogCompositionId,
  createWoolyCatalogDocumentRequest,
  prepareWoolyCatalogDocument,
} from "@/modules/catalog-export/ports/WoolyCatalogDocumentPort";

import CommercialOutputsPanel from "@/modules/catalog-tools/components/CommercialOutputsPanel/CommercialOutputsPanel";

import {
  publishResolvedCatalog,
} from "@/modules/catalog-tools/services/PublishResolvedCatalog";

import {
  buildApplicationWhatsAppUrl,
} from "@/shared/config/application";

import "./CatalogPublishCheckout.css";

type PublicationEligibilityInput =
  Parameters<
    typeof resolveCatalogPublicationEligibility
  >[0];

type PublicIdPublicationStatus =
  | "idle"
  | "publishing"
  | "ready"
  | "unavailable"
  | "blocked"
  | "error";

interface CatalogPublishCheckoutProps {
  composition:
    CatalogComposition;

  resolution:
    PublicationEligibilityInput["resolution"];

  publicationIdentity:
    CatalogPublicationIdentity;

  modeLabel:
    string;

  categorySummary:
    string;

  campaignSummary:
    string;

  publicationProvider?:
    CatalogPublicationProvider | null;
}

const copyToClipboard =
  async (
    value:
      string,
  ) => {
    if (
      navigator
        .clipboard
        ?.writeText
    ) {
      await navigator
        .clipboard
        .writeText(
          value,
        );

      return;
    }

    const textarea =
      document.createElement(
        "textarea",
      );

    textarea.value =
      value;

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea,
    );

    textarea.select();

    document.execCommand(
      "copy",
    );

    document.body.removeChild(
      textarea,
    );
  };

const buildCatalogShareMessage =
  ({
    categorySummary,
    campaignSummary,
    productCount,
    publicUrl,
  }: {
    categorySummary:
      string;

    campaignSummary:
      string;

    productCount:
      number;

    publicUrl:
      string;
  }) => {
    const scope =
      [
        categorySummary,
        campaignSummary !==
        "Sin campaña específica"
          ? campaignSummary
          : "",
      ]
        .filter(
          Boolean,
        )
        .join(
          " · ",
        );

    return [
      "Hola 👋, te comparto este catálogo mayorista Wooly.",
      scope
        ? `Selección: ${scope}.`
        : "",
      `Productos disponibles: ${productCount}.`,
      "",
      `Ver catálogo: ${publicUrl}`,
    ]
      .filter(
        Boolean,
      )
      .join(
        "\n",
      );
  };

export default function CatalogPublishCheckout({
  composition,
  resolution,
  publicationIdentity,
  modeLabel,
  categorySummary,
  campaignSummary,
  publicationProvider =
    catalogPublicationProvider,
}: CatalogPublishCheckoutProps) {
  const [
    copyStatus,
    setCopyStatus,
  ] =
    useState<
      "" |
      "link" |
      "message"
    >(
      "",
    );

  const [
    publicIdStatus,
    setPublicIdStatus,
  ] =
    useState<PublicIdPublicationStatus>(
      "idle",
    );

  const [
    publishedPublicId,
    setPublishedPublicId,
  ] =
    useState(
      "",
    );

  const publishInFlight =
    useRef(
      false,
    );

  const publicationKeyRef =
    useRef(
      "",
    );

  const eligibility =
    resolveCatalogPublicationEligibility({
      composition,
      resolution,
      publicationIdentity,
    });

  const automaticIds =
    new Set(
      resolution
        .automaticProductIds,
    );

  const resolvedIds =
    new Set(
      resolution.productIds,
    );

  const effectiveAddedCount =
    resolution
      .productIds
      .filter(
        (productId) =>
          !automaticIds.has(
            productId,
          ),
      )
      .length;

  const effectiveRemovedCount =
    resolution
      .automaticProductIds
      .filter(
        (productId) =>
          !resolvedIds.has(
            productId,
          ),
      )
      .length;

  const hasProducts =
    resolution
      .productIds
      .length >
    0;

  const compositionId =
    createWoolyCatalogCompositionId(
      composition,
    );

  const publicationKey =
    JSON.stringify({
      compositionId,

      productIds:
        resolution
          .productIds,

      publicationIdentity,

      providerSource:
        publicationProvider
          ?.source ??
        "",
    });

  publicationKeyRef.current =
    publicationKey;

  useEffect(
    () => {
      publishInFlight.current =
        false;

      setPublicIdStatus(
        "idle",
      );

      setPublishedPublicId(
        "",
      );
    },
    [
      publicationKey,
    ],
  );

  const hasResolutionBlockers =
    !resolution
      .isFullyResolved ||
    resolution
      .blockedIncludedProductIds
      .length > 0 ||
    resolution
      .missingIncludedProductIds
      .length > 0 ||
    resolution
      .unsupportedAttributeFilters
      .length > 0;

  const legacyDocumentParams =
    hasProducts &&
    eligibility.status ===
      "v1-publicable"
      ? ({
          origin:
            window.location.origin,

          ...eligibility.v1,
        } as const)
      : hasProducts &&
          eligibility.status ===
            "v2-publicable"
        ? ({
            origin:
              window.location.origin,

            version:
              "2",

            ...eligibility.v2,
          } as const)
        : null;

  const publicIdDocumentParams =
    hasProducts &&
    eligibility.status ===
      "requires-public-id" &&
    publicIdStatus ===
      "ready" &&
    publishedPublicId
      ? ({
          origin:
            window.location.origin,

          publicId:
            publishedPublicId,
        } as const)
      : null;

  const documentParams =
    legacyDocumentParams ??
    publicIdDocumentParams;

  const documentRequest =
    createWoolyCatalogDocumentRequest(
      compositionId,
    );

  const documentPreparation =
    documentParams
      ? prepareWoolyCatalogDocument(
          documentRequest,
          documentParams,
        )
      : null;

  const publicUrl =
    documentPreparation
      ?.previewUrl ?? "";

  const pdfExportUrl =
    publicUrl
      ? `${publicUrl}${
          publicUrl.includes("?")
            ? "&"
            : "?"
        }print=1`
      : "";

  const isDirectlyPublicable =
    Boolean(
      publicUrl,
    );

  const shareMessage =
    publicUrl
      ? buildCatalogShareMessage({
          categorySummary,
          campaignSummary,

          productCount:
            resolution
              .productIds
              .length,

          publicUrl,
        })
      : "";

  const whatsappUrl =
    shareMessage
      ? buildApplicationWhatsAppUrl(
          shareMessage,
        )
      : "";

  const handlePublishPublicId =
    async () => {
      if (
        eligibility.status !==
          "requires-public-id" ||
        publishInFlight.current
      ) {
        return;
      }

      const requestKey =
        publicationKey;

      publishInFlight.current =
        true;

      setPublicIdStatus(
        "publishing",
      );

      setPublishedPublicId(
        "",
      );

      try {
        const result =
          await publishResolvedCatalog({
            provider:
              publicationProvider,

            composition,
            publicationIdentity,
            resolution,
          });

        if (
          publicationKeyRef.current !==
          requestKey
        ) {
          return;
        }

        if (
          result.status ===
          "ready"
        ) {
          setPublishedPublicId(
            result.publicId,
          );

          setPublicIdStatus(
            "ready",
          );

          return;
        }

        setPublicIdStatus(
          result.status,
        );
      } finally {
        if (
          publicationKeyRef.current ===
          requestKey
        ) {
          publishInFlight.current =
            false;
        }
      }
    };

  const handleCopyLink =
    async () => {
      if (!publicUrl) {
        return;
      }

      await copyToClipboard(
        publicUrl,
      );

      setCopyStatus(
        "link",
      );

      window.setTimeout(
        () =>
          setCopyStatus(
            "",
          ),
        1800,
      );
    };

  const handleCopyMessage =
    async () => {
      if (!shareMessage) {
        return;
      }

      await copyToClipboard(
        shareMessage,
      );

      setCopyStatus(
        "message",
      );

      window.setTimeout(
        () =>
          setCopyStatus(
            "",
          ),
        1800,
      );
    };

  return (
    <section className="catalog-publish-checkout">
      <div className="catalog-publish-checkout__main">
        <header className="catalog-publish-checkout__intro">
          <span>
            Salida principal
          </span>

          <h3>
            Genera el PDF de Wooly
          </h3>

          <p>
            Crea el catálogo mayorista con la selección revisada. Después podrás abrirlo,
            imprimirlo o compartir su enlace con el cliente.
          </p>
        </header>

        <CommercialOutputsPanel
          productCount={
            resolution.productIds.length
          }
          hasPublicUrl={
            Boolean(publicUrl)
          }
          pdfUrl={
            pdfExportUrl
          }
        />
      </div>

      <aside
        className="catalog-publish-checkout__summary"
        aria-label="Resumen de publicación"
      >
        <div className="catalog-publish-checkout__summaryHead">
          <div>
            <span>
              Tu catálogo
            </span>

            <h3>
              {modeLabel}
            </h3>
          </div>

          <strong>
            {
              resolution
                .productIds
                .length
            }
          </strong>
        </div>

        {composition.mode ===
        "hybrid" ? (
          <div className="catalog-publish-checkout__metrics">
            <div>
              <span>
                Base
              </span>

              <strong>
                {
                  resolution
                    .automaticProductIds
                    .length
                }
              </strong>
            </div>

            <div>
              <span>
                Agregados
              </span>

              <strong>
                +{effectiveAddedCount}
              </strong>
            </div>

            <div>
              <span>
                Retirados
              </span>

              <strong>
                −{effectiveRemovedCount}
              </strong>
            </div>

            <div>
              <span>
                Resultado
              </span>

              <strong>
                {
                  resolution
                    .productIds
                    .length
                }
              </strong>
            </div>
          </div>
        ) : null}

        <div className="catalog-publish-checkout__scope">
          <div>
            <span>
              Categorías
            </span>

            <strong>
              {categorySummary}
            </strong>
          </div>

          <div>
            <span>
              Campañas
            </span>

            <strong>
              {campaignSummary}
            </strong>
          </div>
        </div>

        {!hasProducts ? (
          <div className="catalog-publish-checkout__status is-blocked">
            <strong>
              No hay productos para publicar
            </strong>

            <p>
              Agrega al menos un producto antes de
              continuar.
            </p>
          </div>
        ) : isDirectlyPublicable ? (
          <section className="catalog-publish-checkout__ready">
            <header>
              <span>
                Resultado
              </span>

              <h4>
                ✓ Catálogo listo
              </h4>

              <p>
                Este enlace público ya puede abrirse y
                compartirse con el cliente.
              </p>
            </header>

            <div className="catalog-publish-checkout__publicUrl">
              {publicUrl}
            </div>

            <div className="catalog-publish-checkout__actions">
              <a
                href={
                  publicUrl
                }
                target="_blank"
                rel="noreferrer"
              >
                Vista previa
              </a>

              <button
                type="button"
                onClick={
                  handleCopyLink
                }
              >
                {copyStatus ===
                "link"
                  ? "✓ Enlace copiado"
                  : "Copiar enlace"}
              </button>

              <button
                type="button"
                onClick={
                  handleCopyMessage
                }
              >
                {copyStatus ===
                "message"
                  ? "✓ Mensaje copiado"
                  : "Copiar mensaje"}
              </button>

              <a
                href={
                  whatsappUrl
                }
                target="_blank"
                rel="noreferrer"
                className="is-whatsapp"
              >
                WhatsApp
              </a>
            </div>
          </section>
        ) : eligibility.status ===
            "requires-public-id" &&
          !publicationProvider ? (
          <div className="catalog-publish-checkout__status is-custom">
            <strong>
              Publicación personalizada no disponible en este entorno
            </strong>

            <p>
              Esta selección necesita un enlace propio para conservar exactamente sus productos,
              pero el provider de publicación no está configurado.
            </p>
          </div>
        ) : eligibility.status ===
            "requires-public-id" &&
          (
            hasResolutionBlockers ||
            publicIdStatus ===
              "blocked"
          ) ? (
          <div className="catalog-publish-checkout__status is-blocked">
            <strong>
              La selección todavía no puede publicarse
            </strong>

            <p>
              Corrige los productos bloqueados, inexistentes o filtros pendientes antes de generar el enlace.
            </p>
          </div>
        ) : eligibility.status ===
            "requires-public-id" &&
          publicIdStatus ===
            "publishing" ? (
          <div className="catalog-publish-checkout__status is-custom">
            <strong>
              Publicando catálogo...
            </strong>

            <p>
              Estamos creando el snapshot exacto de esta selección.
            </p>

            <div className="catalog-publish-checkout__actions">
              <button
                type="button"
                className="is-primary"
                disabled
              >
                Publicando catálogo...
              </button>
            </div>
          </div>
        ) : eligibility.status ===
            "requires-public-id" &&
          publicIdStatus ===
            "error" ? (
          <div className="catalog-publish-checkout__status is-blocked">
            <strong>
              No se pudo generar el enlace público
            </strong>

            <p>
              La composición se conserva intacta. Puedes reintentar la publicación.
            </p>

            <div className="catalog-publish-checkout__actions">
              <button
                type="button"
                className="is-primary"
                onClick={
                  handlePublishPublicId
                }
              >
                Reintentar publicación
              </button>
            </div>
          </div>
        ) : eligibility.status ===
            "requires-public-id" ? (
          <div className="catalog-publish-checkout__status is-custom">
            <strong>
              Esta selección necesita un enlace propio
            </strong>

            <p>
              Se publicará un snapshot fijo para conservar exactamente sus productos.
            </p>

            <div className="catalog-publish-checkout__actions">
              <button
                type="button"
                className="is-primary"
                onClick={
                  handlePublishPublicId
                }
              >
                Generar enlace público
              </button>
            </div>
          </div>
        ) : (
          <div className="catalog-publish-checkout__status is-blocked">
            <strong>
              No se pudo preparar la salida
            </strong>

            <p>
              La selección se conserva intacta. Revisa el contrato documental antes de continuar.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}
