import {
  Link,
} from "react-router-dom";

import {
  ArrowRight,
} from "lucide-react";

import {
  resolveProductCommercialPolicy,
} from "@/modules/catalog/domain/ProductCommercialPolicy";

import {
  resolveProductCommercialState,
} from "@/shared/domain/commercialPolicy";

import type {
  Product,
} from "@/shared/types/product";

import {
  applyProductImageFallback,
  resolveProductImageSrc,
} from "@/shared/lib/productMedia";

import {
  getAvailableVolumePrices,
  getBaseUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

const BADGE_ICONS:
  Record<
    string,
    string
  > = {
  "san valentin":
    "❤️",

  "día madre":
    "🌷",

  "dia madre":
    "🌷",

  "día padre":
    "👨",

  "dia padre":
    "👨",

  "hot wheels":
    "🏎️",
};

const formatBadge = (
  value?:
    string,
) => {
  if (!value) {
    return "💡 Oportunidad";
  }

  const normalized =
    value
      .replace(
        /-/g,
        " ",
      )
      .toLowerCase();

  const text =
    normalized.replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );

  return `${
    BADGE_ICONS[
      normalized
    ] ||
    "💡"
  } ${text}`;
};

const TIER_PRESENTATION:
  Record<
    number,
    {
      displayLabel:
        string;
      icon:
        string;
    }
  > = {
    3: {
      displayLabel: "Mayor",
      icon: "🔥",
    },
    12: {
      displayLabel: "Docena",
      icon: "⚡",
    },
    50: {
      displayLabel: "Medio ciento",
      icon: "🚀",
    },
    100: {
      displayLabel: "Caja",
      icon: "💎",
    },
  };

export default function BlogCatalogProductCard({
  product,
}: {
  product:
    Product;
}) {
  const policy =
    resolveProductCommercialPolicy(
      product,
    );

  const commercialState =
    resolveProductCommercialState(
      product,
    );

  if (
    !policy.isPubliclyVisible
  ) {
    return null;
  }

  const isPreventa =
    commercialState
      .availability ===
    "PREORDER";

  const isAgotado =
    commercialState
      .availability ===
    "OUT_OF_STOCK";

  const campaign =
    isPreventa
      ? "◷ Preventa"
      : isAgotado
        ? "✕ Agotado"
        : formatBadge(
            product
              .campaigns?.[0] ||
            product
              .badges?.[0],
          );

  const primaryPrice =
    getBaseUnitPrice(
      product,
    );

  const tiers =
    policy.isPurchasable
      ? getAvailableVolumePrices(
          product,
          {
            includeBasePrice:
              false,
          },
        ).flatMap(
          (tier) => {
            const presentation =
              TIER_PRESENTATION[
                tier.qty
              ];

            return presentation
              ? [
                  {
                    ...tier,
                    ...presentation,
                  },
                ]
              : [];
          },
        )
      : [];

  const ctaLabel =
    isPreventa
      ? "Consultar preventa"
      : isAgotado
        ? "Consultar reposición"
        : "Ver oportunidad";

  return (
    <Link
      to={buildProductPublicPath(product.id, product.category)}
      className="hub-card blog-catalog-product-card"
    >
      <div className="blog-catalog-product-image">
        <img
          src={resolveProductImageSrc(
            product.img,
          )}
          alt={
            product.title
          }
          loading="lazy"
          onError={({ currentTarget }) =>
            applyProductImageFallback(
              currentTarget,
            )
          }
        />

        <span>
          {campaign}
        </span>
      </div>

      <div className="blog-catalog-product-body">
        <div className="blog-catalog-product-meta">
          <small>
            {product.id}
          </small>

          <small>
            {product.category}
          </small>
        </div>

        <h3>
          {product.title}
        </h3>

        <p>
          {
            product.description
          }
        </p>

        {policy.canShowPricing ? (
          <div className="blog-catalog-product-price">
            <small>
              Precio base
            </small>

            <strong>
              S/{" "}
              {primaryPrice
                .toFixed(2)}
            </strong>
          </div>
        ) : (
          <div className="blog-catalog-product-price">
            <small>
              Información comercial
            </small>

            <strong>
              Consultar
            </strong>
          </div>
        )}

        {tiers.length > 0 && (
          <div className="blog-catalog-product-tiers">
            <b>
              📦 Precios mayoristas
            </b>

            {tiers.map(
              (tier) => (
                <span
                  key={
                    tier.qty
                  }
                >
                  <em>
                    {
                      tier.icon
                    }{" "}
                    {
                      tier
                        .displayLabel
                    }{" "}
                    (
                    {
                      tier
                        .label
                    })
                  </em>

                  <strong>
                    S/
                    {tier
                      .unitPrice
                      .toFixed(2)}
                  </strong>
                </span>
              ),
            )}
          </div>
        )}

        <b className="blog-catalog-product-cta">
          {ctaLabel}{" "}
          <ArrowRight
            size={15}
          />
        </b>
      </div>
    </Link>
  );
}
import { buildProductPublicPath } from "@/shared/config/application";
