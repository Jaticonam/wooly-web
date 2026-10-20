import "./CatalogPdfHeader.css";
import { getApplicationConfig } from "@wooly/shared/config/application";

const applicationConfig = getApplicationConfig();

type CatalogPdfSegmentType =
  | "general"
  | "category"
  | "campaign"
  | "combination";

interface CatalogPdfHeaderProps {
  logoSrc?: string;
  title: string;
  subtitle: string;
  segmentLabel: string;
  segmentType: CatalogPdfSegmentType;
  generatedAt: string;
  validUntil: string;
  productCount: number;
  contactNumber: string;
  isComplete?: boolean;
  brandFootnote?: string;
}

const getSegmentLabel = (
  segmentType: CatalogPdfSegmentType,
) => {
  if (segmentType === "combination") {
    return "Selección";
  }

  if (segmentType === "campaign") {
    return "Campaña";
  }

  if (segmentType === "category") {
    return "Categoría";
  }

  return "Catálogo";
};

export default function CatalogPdfHeader({
  logoSrc,
  title,
  subtitle,
  segmentLabel,
  segmentType,
  generatedAt,
  validUntil,
  productCount,
  contactNumber,
  brandFootnote = "Una marca de JUNG INVERSIONES SAC RUC 20616037120",
}: CatalogPdfHeaderProps) {
  return (
    <header className="catalog-pdf-header">
      <section className="catalog-pdf-header__cover">
        <div className="catalog-pdf-header__logoWrap">
          {logoSrc ? (
            <img
              className="catalog-pdf-header__logoImage"
              src={logoSrc}
              alt={applicationConfig.app.name}
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <span className="catalog-pdf-header__logoFallback">
              {applicationConfig.app.name}
            </span>
          )}

          <p className="catalog-pdf-header__brandFootnote">
            {brandFootnote}
          </p>
        </div>

        <div className="catalog-pdf-header__copy">
          <span className="catalog-pdf-header__segment">
            {getSegmentLabel(segmentType)} ·{" "}
            {segmentLabel}
          </span>

          <h1 className="catalog-pdf-header__title">
            {title}
          </h1>

          <p className="catalog-pdf-header__subtitle">
            {subtitle}
          </p>
        </div>

        <div className="catalog-pdf-header__metaGrid">
          <div className="catalog-pdf-header__metaCard catalog-pdf-header__metaCard--products">
            <span>Total productos</span>
            <strong>{productCount}</strong>
          </div>

          <div className="catalog-pdf-header__metaCard catalog-pdf-header__metaCard--contact">
            <span>Pedidos y stock</span>
            <strong>{contactNumber}</strong>
          </div>

          <div className="catalog-pdf-header__metaCard catalog-pdf-header__metaCard--validity">
            <span>Válido hasta</span>
            <strong>{validUntil}</strong>
          </div>
        </div>

        <div className="catalog-pdf-header__statusRow">
          <span>Generado: {generatedAt}</span>
        </div>
      </section>
    </header>
  );
}
