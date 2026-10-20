import type {
  PdfCategorySection,
} from "@wooly/shared/catalog-export/services/BuildPdfCategorySections";

import CatalogPdfGrid from "../CatalogPdfGrid/CatalogPdfGrid";

import "./CatalogPdfCategorySection.css";

interface CatalogPdfCategorySectionProps {
  section: PdfCategorySection;
}

export default function CatalogPdfCategorySection({
  section,
}: CatalogPdfCategorySectionProps) {
  return (
    <section
      className="catalog-pdf-categorySection"
      data-category={section.id}
    >
      <header className="catalog-pdf-categorySection__header">
        <div className="catalog-pdf-categorySection__identity">
          <span className="catalog-pdf-categorySection__icon">
            {section.icon}
          </span>

          <div>
            <p>Categoría</p>

            <h2>{section.label}</h2>
          </div>
        </div>

        <strong className="catalog-pdf-categorySection__count">
          {section.products.length} productos
        </strong>
      </header>

      <CatalogPdfGrid products={section.products} />
    </section>
  );
}