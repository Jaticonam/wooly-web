import {
  COMMERCIAL_COMPOSITION_CONTRACT_VERSION,
  type CommercialAvailability,
  type CommercialCompositionV1,
  type CommercialItem,
  type CommercialSection,
} from "@/shared/contracts/commercial";

import type {
  Product,
} from "@/shared/types/product";

export interface WoolyCommercialCompositionOptions {
  compositionId: string;
  version: number;
  title: string;
  description?: string | null;
  createdAt: string;
  productUrl?: (product: Product) => string | null;
  sectionTitle?: (categoryId: string) => string;
}

const normalizeStatus = (
  value?: string,
) => String(value ?? "").trim().toLowerCase();

const resolveAvailability = (
  product: Product,
): CommercialAvailability => {
  const status = normalizeStatus(product.status);

  if (status === "preventa" || status === "preorder") {
    return "preorder";
  }

  if (status === "agotado" || product.stock === 0) {
    return "out_of_stock";
  }

  if (status === "oculto" || status === "borrador") {
    return "unavailable";
  }

  return "in_stock";
};

const parseGallery = (
  gallery?: string,
) => Array.from(
  new Set(
    String(gallery ?? "")
      .split(/[\n,|]/)
      .map((url) => url.trim())
      .filter(Boolean),
  ),
);

const toCommercialItem = (
  product: Product,
  productUrl?: (product: Product) => string | null,
): CommercialItem => ({
  productId: product.id,
  sku: product.id,
  title: product.title,
  description: product.description,
  price: product.price_offer ?? product.price_1,
  currency: "PEN",
  stock: product.stock ?? null,
  availability: resolveAvailability(product),
  brand: "Wooly",
  identifiers: {
    gtin: null,
    mpn: null,
  },
  media: {
    primaryImage: product.img || null,
    gallery: parseGallery(product.gallery),
  },
  productUrl: productUrl?.(product) ?? null,
  attributes: {
    categoryId: product.category,
    campaignIds: product.campaigns ?? [],
    badgeCodes: product.badges ?? [],
    publicationStatus: product.status ?? null,
    priority: product.priority ?? 0,
    price_3: product.price_3 ?? null,
    price_12: product.price_12 ?? null,
    price_50: product.price_50 ?? null,
    price_100: product.price_100 ?? null,
  },
});

const buildSections = (
  products: readonly Product[],
  sectionTitle?: (categoryId: string) => string,
): CommercialSection[] => {
  const idsByCategory = new Map<string, string[]>();

  products.forEach((product) => {
    const categoryId = product.category.trim() || "uncategorized";
    const itemIds = idsByCategory.get(categoryId) ?? [];

    itemIds.push(product.id);
    idsByCategory.set(categoryId, itemIds);
  });

  return Array.from(idsByCategory, ([sectionId, itemIds]) => ({
    sectionId,
    title: sectionTitle?.(sectionId) ?? sectionId,
    description: null,
    itemIds,
  }));
};

/**
 * ACL de Wooly hacia Commercial Publishing.
 *
 * La selección ya debe llegar resuelta por CatalogCompositionResolver;
 * este adapter solo proyecta el resultado y conserva su orden estable.
 */
export const toWoolyCommercialComposition = (
  products: readonly Product[],
  options: WoolyCommercialCompositionOptions,
): CommercialCompositionV1 => ({
  contractVersion: COMMERCIAL_COMPOSITION_CONTRACT_VERSION,
  compositionId: options.compositionId,
  appId: "wooly",
  type: "catalog",
  version: options.version,
  title: options.title,
  description: options.description ?? null,
  sections: buildSections(products, options.sectionTitle),
  items: products.map((product) =>
    toCommercialItem(product, options.productUrl)),
  brandingProfile: {
    profileId: "wooly-default",
  },
  pricingProfile: {
    profileId: "wooly-b2b-pen",
    currency: "PEN",
  },
  publicationContext: {
    locale: "es-PE",
    country: "PE",
  },
  createdAt: options.createdAt,
});
