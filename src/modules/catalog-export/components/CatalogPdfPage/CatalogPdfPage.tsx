import {
  useEffect,
  useRef,
} from "react";

import {
  getApplicationConfig,
} from "@/shared/config/application";
import {
  formatWhatsAppPhone,
} from "@/modules/product-detail/utils/WhatsAppLink";
import {
  catalogPublicationProvider,
} from "@/modules/catalog/providers/DefaultCatalogPublicationProvider";
import { useCatalogPdfPageModel } from "../../hooks/useCatalogPdfPageModel";

import CatalogPdfHeader from "../CatalogPdfHeader/CatalogPdfHeader";
import CatalogPdfGrid from "../CatalogPdfGrid/CatalogPdfGrid";
import CatalogPdfCategorySection from "../CatalogPdfCategorySection/CatalogPdfCategorySection";

import "./CatalogPdfPage.css";

const applicationConfig =
  getApplicationConfig();

const PUBLIC_PUBLICATION_STATE_COPY = {
  unavailable: {
    title:
      "Catálogo personalizado no disponible",

    description:
      "Este enlace personalizado todavía no puede abrirse desde este entorno.",
  },

  loading: {
    title:
      "Cargando catálogo personalizado...",

    description:
      "Estamos verificando la publicación asociada a este enlace.",
  },

  "not-found": {
    title:
      "Catálogo no encontrado",

    description:
      "El enlace no corresponde a una publicación disponible.",
  },

  expired: {
    title:
      "Este catálogo ha vencido",

    description:
      "Solicita un enlace actualizado para consultar la selección vigente.",
  },

  error: {
    title:
      "No pudimos abrir este catálogo",

    description:
      "Ocurrió un problema al verificar la publicación. Intenta nuevamente.",
  },


} as const;

export default function CatalogPdfPage() {
  const autoPrintStarted = useRef(false);

  const {
    generatedAt,
    validUntil,
    copy,
    products,
    categorySections,
    selectionIsReady,
    hasProducts,
    showCategorySections,
    showLoadingState,
    showEmptyState,
    isPublicId,
    publicPublicationStatus,
  } = useCatalogPdfPageModel(
    applicationConfig.commerce.pdfValidityDays,
    catalogPublicationProvider,
  );

  const publicPublicationState =
    publicPublicationStatus ===
      "idle" ||
    publicPublicationStatus ===
      "ready"
      ? null
      : PUBLIC_PUBLICATION_STATE_COPY[
          publicPublicationStatus
        ];
  const handlePrint = () => {
    window.print();
  };

  const autoPrintRequested =
    new URLSearchParams(
      window.location.search,
    ).get("print") === "1";

  useEffect(() => {
    if (
      !autoPrintRequested ||
      autoPrintStarted.current ||
      !selectionIsReady ||
      !hasProducts
    ) {
      return;
    }

    autoPrintStarted.current = true;

    let cancelled = false;
    let printTimer = 0;

    const waitForAssetsAndPrint = async () => {
      await document.fonts?.ready;

      await Promise.all(
        Array.from(document.images).map(
          (image) =>
            image.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  image.addEventListener("load", () => resolve(), {
                    once: true,
                  });

                  image.addEventListener("error", () => resolve(), {
                    once: true,
                  });
                }),
        ),
      );

      if (cancelled) {
        return;
      }

      printTimer = window.setTimeout(
        () => window.print(),
        250,
      );
    };

    void waitForAssetsAndPrint();

    return () => {
      cancelled = true;
      window.clearTimeout(printTimer);
    };
  }, [
    autoPrintRequested,
    hasProducts,
    selectionIsReady,
  ]);

  return (
    <main className="catalog-pdf-page">
      <section className="catalog-pdf-toolbar no-print">
        <div>
          <p className="catalog-pdf-toolbar__eyebrow">
            Catálogo PDF
          </p>

          <h1 className="catalog-pdf-toolbar__title">
            Catálogo mayorista imprimible
          </h1>

          <p className="catalog-pdf-toolbar__description">
            Vista optimizada para descargar o imprimir
            el catálogo como PDF.
          </p>

          {!isPublicId && !selectionIsReady ? (
            <p className="catalog-pdf-toolbar__warning">
              El catálogo o el registro de campañas
              todavía está cargando. Espera unos
              segundos antes de exportar para evitar
              un PDF incompleto.
            </p>
          ) : null}
        </div>

        <div className="catalog-pdf-toolbar__actions">
          <button
            className="catalog-pdf-toolbar__button"
            type="button"
            onClick={handlePrint}
            disabled={!hasProducts || !selectionIsReady}
          >
            Descargar / imprimir PDF
          </button>
        </div>
      </section>

      <article className="catalog-pdf-sheet">
        <CatalogPdfHeader
          logoSrc={applicationConfig.assets.pdfLogoUrl}
          title={copy.title}
          subtitle={copy.subtitle}
          segmentLabel={copy.segmentLabel}
          segmentType={copy.segmentType}
          generatedAt={generatedAt}
          validUntil={validUntil}
          productCount={products.length}
          contactNumber={formatWhatsAppPhone(
            applicationConfig.contact.whatsappNumber,
          )}
          isComplete={selectionIsReady}
        />

        {publicPublicationState ? (
          <section
            className="catalog-pdf-state no-print"
            aria-live="polite"
          >
            <h2>
              {publicPublicationState.title}
            </h2>

            <p>
              {publicPublicationState.description}
            </p>
          </section>
        ) : null}

        {showLoadingState ? (
          <section className="catalog-pdf-state">
            <h2>Cargando catálogo...</h2>

            <p>
              Estamos preparando la selección completa
              para el PDF.
            </p>
          </section>
        ) : null}

        {showEmptyState ? (
          <section className="catalog-pdf-state">
            <h2>No hay productos disponibles</h2>

            <p>
              Revisa la categoría, la campaña o sus
              estados de publicación.
            </p>
          </section>
        ) : null}

        {hasProducts ? (
          showCategorySections ? (
            <div className="catalog-pdf-categorySections">
              {categorySections.map(
                (section) => (
                  <CatalogPdfCategorySection
                    key={section.id}
                    section={section}
                  />
                ),
              )}
            </div>
          ) : (
            <CatalogPdfGrid
              products={products}
            />
          )
        ) : null}

        <footer className="catalog-pdf-footer">
          <p>
            Precios, productos y stock sujetos a
            confirmación por asesora comercial.
          </p>

          <p>
            {applicationConfig.app.name} · Catálogo
            mayorista para emprendedores
          </p>
        </footer>
      </article>
    </main>
  );
}
