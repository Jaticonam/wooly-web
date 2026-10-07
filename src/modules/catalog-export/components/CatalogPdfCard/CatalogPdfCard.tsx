import type {
  PdfProduct,
} from "../../types/PdfProduct";

import {
  PDF_PRODUCT_PLACEHOLDER_IMAGE,
} from "../../mappers/PdfProductMapper";

import "./CatalogPdfCard.css";
import { getApplicationConfig } from "@/shared/config/application";

interface CatalogPdfCardProps {
  product:
    PdfProduct;
}

const applicationConfig = getApplicationConfig();
const moneyFormatter =
  new Intl.NumberFormat(
    applicationConfig.locale.currencyLocale,
    {
      style:
        "currency",

      currency:
        applicationConfig.locale.currency,

      minimumFractionDigits:
        2,
    },
  );

const formatMoney = (
  value?:
    number |
    null,
) => {
  const amount =
    typeof value ===
      "number" &&
    Number.isFinite(value)
      ? value
      : 0;

  if (amount <= 0) {
    return "Consultar";
  }

  return moneyFormatter
    .format(amount);
};

const formatCategory = (
  category:
    string,
) =>
  category
    .replace(
      /-/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();

export default function CatalogPdfCard({
  product,
}: CatalogPdfCardProps) {
  const tierPrices =
    product
      .showWholesalePricing
      ? product.volumePrices
      : [];

  const isPreventa =
    product.presentation ===
    "preventa";

  const isAgotado =
    product.presentation ===
    "agotado";

  const hasOffer =
    product.showPricing &&
    product.offerPrice !==
      null &&
    product.offerPrice !==
      undefined;

  const unitPrice =
    hasOffer
      ? product.price1
      : product.primaryPrice;

  const offerPrice =
    hasOffer
      ? product.primaryPrice
      : 0;

  const badgeLabel =
    isPreventa
      ? "Preventa"
      : isAgotado
        ? "Agotado"
        : hasOffer
          ? "Oferta"
          : "";

  return (
    <article className="catalog-pdf-card">
      <div className="catalog-pdf-card__media">
        <img
          className="catalog-pdf-card__image"
          src={product.image}
          alt={product.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src =
              PDF_PRODUCT_PLACEHOLDER_IMAGE;
          }}
        />

        {badgeLabel ? (
          <span className="catalog-pdf-card__offerBadge">
            {badgeLabel}
          </span>
        ) : null}
      </div>

      <div className="catalog-pdf-card__content">
        <div className="catalog-pdf-card__meta">
          <span className="catalog-pdf-card__code">
            {product.code ?? "Sin código"}
          </span>

          <span className="catalog-pdf-card__category">
            {formatCategory(
              product.category,
            )}
          </span>

          <span className="catalog-pdf-card__stock">
            {isAgotado
              ? "✕"
              : isPreventa
                ? "◷"
                : "✓"}{" "}
            {product.stockLabel}
          </span>
        </div>

        <h2 className="catalog-pdf-card__title">
          {product.title}
        </h2>

        {product.showPricing ? (
          <div
            className={`catalog-pdf-card__priceSummary ${
              hasOffer
                ? ""
                : "catalog-pdf-card__priceSummary--single"
            }`}
          >
            <div className="catalog-pdf-card__priceBox catalog-pdf-card__priceBox--unit">
              <span>
                Precio unidad:
              </span>

              <strong>
                {formatMoney(
                  unitPrice,
                )}
              </strong>
            </div>

            {hasOffer ? (
              <div className="catalog-pdf-card__priceBox catalog-pdf-card__priceBox--offer">
                <span>
                  Precio oferta:
                </span>

                <strong>
                  {formatMoney(
                    offerPrice,
                  )}
                </strong>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="catalog-pdf-card__noTiers">
            Precio disponible mediante consulta comercial.
          </p>
        )}

        <div className="catalog-pdf-card__wholesaleSection">
          <span className="catalog-pdf-card__sectionLabel">
            {product
              .showWholesalePricing
              ? "Precios mayoristas"
              : "Información comercial"}
          </span>

          {product
            .showWholesalePricing &&
          tierPrices.length > 0 ? (
            <div
              className="catalog-pdf-card__tiers"
              aria-label="Precios mayoristas"
            >
              {tierPrices.map(
                (tier) => (
                  <div
                    className={`catalog-pdf-card__tier catalog-pdf-card__tier--${tier.kind}`}
                    key={
                      tier.kind
                    }
                  >
                    <span className="catalog-pdf-card__tierLabel">
                      {
                        tier.label
                      }
                    </span>

                    <strong className="catalog-pdf-card__tierPrice">
                      {formatMoney(
                        tier.unitPrice,
                      )}
                    </strong>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="catalog-pdf-card__noTiers">
              {isPreventa
                ? "Producto en preventa: consultar características y disponibilidad con una asesora."
                : isAgotado
                  ? "Producto agotado: consultar fecha de reposición con una asesora."
                  : "Mayorista: consultar con asesora."}
            </p>
          )}
        </div>

        {product.description ? (
          <p className="catalog-pdf-card__description">
            <span>
              Descripción:
            </span>{" "}
            {
              product.description
            }
          </p>
        ) : null}
      </div>
    </article>
  );
}
