import {
  resolveProductCommercialPolicy,
} from "@/modules/catalog/domain/ProductCommercialPolicy";

import {
  resolveProductCommercialState,
  type CommercialAvailability,
} from "@/shared/domain/commercialPolicy";

import type {
  Product,
} from "@/shared/types/product";

import {
  getAvailableVolumePrices,
  getBaseUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

import {
  PDF_IMAGE_MANIFEST,
} from "../data/PdfImageManifest";

import type {
  PdfProduct,
  PdfProductPresentation,
  PdfVolumePrice,
} from "../types/PdfProduct";

export const PDF_PRODUCT_PLACEHOLDER_IMAGE =
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" rx="48" fill="#f8fafc"/>
  <rect x="110" y="145" width="380" height="270" rx="28" fill="#e2e8f0"/>
  <circle cx="235" cy="245" r="45" fill="#cbd5e1"/>
  <path d="M145 380l105-110 78 78 54-58 73 90H145z" fill="#cbd5e1"/>
  <text x="300" y="475" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#64748b">
    Wooly Imports
  </text>
</svg>
`)}`;

const PDF_DESCRIPTION_MAX_LENGTH =
  190;

const cleanText = (
  value?:
    string |
    null,
  fallback = "",
) =>
  String(
    value ||
    fallback,
  )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();

const getMainImage = (
  product:
    Product,
) => {
  const productId =
    cleanText(
      product.code ?? product.id,
    );

  const optimizedPdfImage =
    cleanText(
      PDF_IMAGE_MANIFEST[
        productId
      ],
    );

  const catalogImage =
    cleanText(
      product.img,
    );

  return (
    optimizedPdfImage ||
    catalogImage ||
    PDF_PRODUCT_PLACEHOLDER_IMAGE
  );
};

const getShortDescription = (
  product:
    Product,
) => {
  const description =
    cleanText(
      product.description,
    );

  if (!description) {
    return "";
  }

  if (
    description.length <=
    PDF_DESCRIPTION_MAX_LENGTH
  ) {
    return description;
  }

  return `${description
    .slice(
      0,
      PDF_DESCRIPTION_MAX_LENGTH -
        3,
    )
    .trim()}...`;
};

const getPresentation = (
  availability:
    CommercialAvailability,
): PdfProductPresentation => {
  if (
    availability === "PREORDER"
  ) {
    return "preventa";
  }

  if (
    availability ===
    "OUT_OF_STOCK"
  ) {
    return "agotado";
  }

  return "published";
};

const PDF_TIER_PRESENTATION:
  Record<
    Exclude<
      PdfVolumePrice["qty"],
      1
    >,
    Pick<
      PdfVolumePrice,
      "kind" |
      "label"
    >
  > = {
    3: {
      kind: "price3",
      label: "Por Mayor (3u) a",
    },
    12: {
      kind: "price12",
      label: "Por Docena (12u) a",
    },
    50: {
      kind: "price50",
      label: "Por 50 (50u) a",
    },
    100: {
      kind: "price100",
      label: "Por 100 (100u) a",
    },
  };

const getPdfVolumePrices = (
  product:
    Product,
  showWholesalePricing:
    boolean,
): PdfVolumePrice[] => {
  if (!showWholesalePricing) {
    return [];
  }

  return getAvailableVolumePrices(
    product,
    {
      includeBasePrice:
        false,
    },
  ).flatMap(
    (availablePrice) => {
      const presentation =
        PDF_TIER_PRESENTATION[
          availablePrice.qty
        ];

      return presentation
        ? [
            {
              ...presentation,
              qty:
                availablePrice.qty,
              unitPrice:
                availablePrice.unitPrice,
            },
          ]
        : [];
    },
  );
};

export const mapProductToPdfProduct = (
  product:
    Product,
): PdfProduct => {
  const policy =
    resolveProductCommercialPolicy(
      product,
    );

  const commercialState =
    resolveProductCommercialState(
      product,
    );

  const status =
    policy.isStatusValid
      ? policy.status
      : "";

  const isPreventa =
    commercialState
      .availability ===
    "PREORDER";

  const isAgotado =
    commercialState
      .availability ===
    "OUT_OF_STOCK";

  const showWholesalePricing =
    policy.isPurchasable;

  const primaryPrice =
    policy.canShowPricing
      ? getBaseUnitPrice(
          product,
        )
      : 0;

  const hasOffer =
    policy.canShowPricing &&
    primaryPrice !==
      product.price_1;

  return {
    code: product.code ?? null,
    id:
      cleanText(
        product.id,
      ),

    title:
      cleanText(
        product.title,
        "Producto Wooly",
      ),

    description:
      getShortDescription(
        product,
      ),

    category:
      cleanText(
        product.category,
        "Sin categoría",
      ),

    image:
      getMainImage(
        product,
      ),

    /*
     * Los datos confidenciales de preventa se neutralizan
     * en el DTO. No basta con esconderlos mediante CSS.
     */
    price1:
      policy.canShowPricing
        ? product.price_1
        : 0,

    offerPrice:
      hasOffer
        ? primaryPrice
        : null,

    primaryPrice:
      primaryPrice,

    volumePrices:
      getPdfVolumePrices(
        product,
        showWholesalePricing,
      ),

    stock:
      policy.canShowInventoryQuantity
        ? product.stock
        : null,

    stockLabel:
      isPreventa
        ? "Preventa · Consultar"
        : isAgotado
          ? "Agotado"
          : typeof product.stock ===
                "number"
            ? `Stock: ${product.stock} und.`
            : "Disponible",

    presentation:
      getPresentation(
        commercialState
          .availability,
      ),

    showPricing:
      policy.canShowPricing,

    showWholesalePricing,

    status:
      status || undefined,

    priority:
      Number(
        product.priority ||
        0,
      ),
  };
};

export const mapProductsToPdfProducts = (
  products:
    Product[],
): PdfProduct[] =>
  products
    .filter(
      (product) =>
        resolveProductCommercialPolicy(
          product,
        ).isPubliclyVisible,
    )
    .map(
      mapProductToPdfProduct,
    );
