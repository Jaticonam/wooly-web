import type { PdfProduct } from "@wooly/contracts/catalog-export/types/PdfProduct";
import CatalogPdfCard from "../CatalogPdfCard/CatalogPdfCard";

import "./CatalogPdfGrid.css";

interface CatalogPdfGridProps {
  products: PdfProduct[];
}

export default function CatalogPdfGrid({ products }: CatalogPdfGridProps) {
  return (
    <section className="catalog-pdf-grid" aria-label="Productos del catálogo">
      {products.map((product) => (
        <CatalogPdfCard key={product.id} product={product} />
      ))}
    </section>
  );
}
