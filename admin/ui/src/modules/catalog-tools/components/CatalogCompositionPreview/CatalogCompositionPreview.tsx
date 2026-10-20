import {
  useMemo,
  useState,
} from "react";

import {
  mapProductsToPdfProducts,
} from "@wooly/shared/catalog-export/mappers/PdfProductMapper";

import {
  buildPdfCategorySections,
} from "@wooly/shared/catalog-export/services/BuildPdfCategorySections";

import CatalogCustomerPreview from "@/modules/catalog-tools/components/CatalogCustomerPreview/CatalogCustomerPreview";

import type {
  Product,
} from "@wooly/contracts/types/product";

import "./CatalogCompositionPreview.css";

interface CatalogCompositionPreviewProps {
  products: readonly Product[];
  isReady: boolean;
}

export default function CatalogCompositionPreview({
  products,
  isReady,
}: CatalogCompositionPreviewProps) {
  const [
    isExpanded,
    setIsExpanded,
  ] = useState(
    true,
  );

  const pdfProducts =
    useMemo(
      () =>
        mapProductsToPdfProducts(
          [
            ...products,
          ],
        ),
      [products],
    );

  const sections =
    useMemo(
      () =>
        buildPdfCategorySections(
          pdfProducts,
        ),
      [pdfProducts],
    );

  return (
    <section className="catalog-composition-preview">
      <header className="catalog-composition-preview__header">
        <div>
          <span className="catalog-composition-preview__eyebrow">
            Verificación comercial
          </span>

          <h3>
            Vista del cliente
          </h3>

          <p>
            Arriba construyes el catálogo. Aquí compruebas
            en tiempo real cómo lo verá tu cliente.
          </p>
        </div>

        <div className="catalog-composition-preview__actions">
          <div className="catalog-composition-preview__summary">
            <div>
              <strong>
                {pdfProducts.length}
              </strong>

              <span>
                productos
              </span>
            </div>

            <div>
              <strong>
                {sections.length}
              </strong>

              <span>
                categorías
              </span>
            </div>
          </div>

          <button
            type="button"
            className="catalog-composition-preview__toggle"
            aria-expanded={
              isExpanded
            }
            onClick={() =>
              setIsExpanded(
                (current) =>
                  !current,
              )
            }
          >
            {isExpanded
              ? "Contraer vista"
              : "Ver vista del cliente"}
          </button>
        </div>
      </header>

      {!isReady ? (
        <div className="catalog-composition-preview__empty">
          Preparando la vista del cliente.
        </div>
      ) : sections.length === 0 ? (
        <div className="catalog-composition-preview__empty">
          Agrega o selecciona productos para comenzar.
        </div>
      ) : isExpanded ? (
        <CatalogCustomerPreview
          sections={
            sections
          }
        />
      ) : (
        <div className="catalog-composition-preview__collapsed">
          Vista contraída ·
          {" "}
          {pdfProducts.length}
          {" "}
          productos en
          {" "}
          {sections.length}
          {" "}
          categorías.
        </div>
      )}
    </section>
  );
}