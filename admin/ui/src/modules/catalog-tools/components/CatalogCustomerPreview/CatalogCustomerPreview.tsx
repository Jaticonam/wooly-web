import type {
  PdfCategorySection,
} from "@wooly/shared/catalog-export/services/BuildPdfCategorySections";

import "./CatalogCustomerPreview.css";

interface CatalogCustomerPreviewProps {
  sections: readonly PdfCategorySection[];
}

const MAX_VISIBLE_PRODUCTS_PER_SECTION =
  24;

const currencyFormatter =
  new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    },
  );

const formatPrice = (
  value: number,
) =>
  currencyFormatter.format(
    value,
  );

export default function CatalogCustomerPreview({
  sections,
}: CatalogCustomerPreviewProps) {
  const productCount =
    sections.reduce(
      (
        total,
        section,
      ) =>
        total +
        section.products.length,
      0,
    );

  return (
    <section className="catalog-customer-preview">
      <header className="catalog-customer-preview__hero">
        <div>
          <span className="catalog-customer-preview__eyebrow">
            Vista cliente
          </span>

          <h4>
            Catálogo Wooly
          </h4>

          <p>
            Explora nuestra selección mayorista organizada
            por categorías.
          </p>
        </div>

        <div className="catalog-customer-preview__total">
          <strong>
            {productCount}
          </strong>

          <span>
            productos
          </span>
        </div>
      </header>

      <nav
        className="catalog-customer-preview__navigation"
        aria-label="Categorías del catálogo"
      >
        {sections.map(
          (section) => (
            <a
              key={
                section.id
              }
              href={`#catalog-preview-${section.id}`}
            >
              <span>
                {section.icon}
              </span>

              <strong>
                {section.label}
              </strong>

              <small>
                {section.products.length}
              </small>
            </a>
          ),
        )}
      </nav>

      <div className="catalog-customer-preview__sections">
        {sections.map(
          (section) => {
            const visibleProducts =
              section.products.slice(
                0,
                MAX_VISIBLE_PRODUCTS_PER_SECTION,
              );

            const hiddenCount =
              Math.max(
                section.products.length -
                  visibleProducts.length,
                0,
              );

            return (
              <article
                key={
                  section.id
                }
                id={`catalog-preview-${section.id}`}
                className="catalog-customer-preview__section"
              >
                <header className="catalog-customer-preview__sectionHeader">
                  <div>
                    <span>
                      {section.icon}
                    </span>

                    <div>
                      <small>
                        Categoría
                      </small>

                      <h5>
                        {section.label}
                      </h5>
                    </div>
                  </div>

                  <strong>
                    {section.products.length}
                    {" "}
                    productos
                  </strong>
                </header>

                <div className="catalog-customer-preview__grid">
                  {visibleProducts.map(
                    (product) => {
                      const hasOffer =
                        product.showPricing &&
                        typeof product.offerPrice ===
                          "number" &&
                        product.offerPrice > 0 &&
                        product.price1 >
                          product.offerPrice;

                      return (
                        <article
                          key={
                            product.id
                          }
                          className="catalog-customer-preview__card"
                        >
                          <div className="catalog-customer-preview__image">
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.title
                              }
                              loading="lazy"
                            />

                            {product.presentation !==
                            "published" ? (
                              <span className="catalog-customer-preview__badge">
                                {product.presentation ===
                                "preventa"
                                  ? "Preventa"
                                  : "Agotado"}
                              </span>
                            ) : null}
                          </div>

                          <div className="catalog-customer-preview__content">
                            <span className="catalog-customer-preview__id">
                              {product.id}
                            </span>

                            <h6>
                              {product.title}
                            </h6>

                            {product.description ? (
                              <p>
                                {product.description}
                              </p>
                            ) : null}

                            <div className="catalog-customer-preview__commercial">
                              {product.showPricing &&
                              product.primaryPrice > 0 ? (
                                <div className="catalog-customer-preview__price">
                                  {hasOffer ? (
                                    <small>
                                      {formatPrice(
                                        product.price1,
                                      )}
                                    </small>
                                  ) : null}

                                  <strong>
                                    {formatPrice(
                                      product.primaryPrice,
                                    )}
                                  </strong>
                                </div>
                              ) : (
                                <strong className="catalog-customer-preview__consult">
                                  Consultar
                                </strong>
                              )}

                              <span className="catalog-customer-preview__stock">
                                {product.stockLabel}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    },
                  )}

                  {hiddenCount > 0 ? (
                    <div className="catalog-customer-preview__more">
                      <strong>
                        +{hiddenCount}
                      </strong>

                      <span>
                        productos adicionales
                      </span>

                      <small>
                        Vista previa resumida
                      </small>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          },
        )}
      </div>
    </section>
  );
}