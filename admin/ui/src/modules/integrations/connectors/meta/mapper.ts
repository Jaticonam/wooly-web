import {
  resolveProductCommercialPolicy,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";
import {
  resolveProductCommercialState,
} from "@wooly/contracts/domain/commercialPolicy";
import {
  getBaseUnitPrice,
} from "@wooly/contracts/domain/volumePricing/VolumePricingHelpers";
import {
  buildProductPublicUrl,
  getApplicationConfig,
  type ApplicationConfig,
} from "@wooly/shared/config/application";

import type {
  FeedProduct,
  MetaFeedItem,
} from "../../types/feed";
import type {
  MetaFeedIssue,
  MetaMappingResult,
} from "./types";

const defaultConfig = getApplicationConfig();
export const META_SITE_URL = defaultConfig.publicSite.origin;
export const META_BRAND = defaultConfig.integrations.meta.brandName;
export const META_CURRENCY = defaultConfig.locale.currency;

export interface MetaMapperOptions {
  siteUrl?: string;
  config?: ApplicationConfig;
}

const categoryMap: Record<string, string> = {
  flores: "Home & Garden > Decor",
  peluches: "Toys & Games > Toys > Dolls, Playsets & Toy Figures",
  papeles: "Arts & Entertainment > Party & Celebration",
  cajas: "Arts & Entertainment > Gift Giving",
  cintas: "Arts & Entertainment > Crafts & Hobbies",
  globos: "Arts & Entertainment > Party & Celebration",
  accesorios: "Arts & Entertainment > Party & Celebration",
  hotwheels: "Toys & Games > Toys > Toy Vehicles",
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanDescription(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function issue(
  code: MetaFeedIssue["code"],
  message: string,
  field?: MetaFeedIssue["field"],
): MetaFeedIssue {
  return { code, field, message };
}

export function isMetaExportEligible(
  product: FeedProduct,
): boolean {
  const policy = resolveProductCommercialPolicy(product);
  const commercial = resolveProductCommercialState(product);
  const price = getBaseUnitPrice(product);
  const availabilityMatchesStatus =
    (
      policy.status === "publicado" &&
      commercial.availability === "AVAILABLE"
    ) ||
    (
      policy.status === "agotado" &&
      commercial.availability === "OUT_OF_STOCK"
    );

  return (
    policy.isPubliclyVisible &&
    policy.canShowPricing &&
    availabilityMatchesStatus &&
    Number.isFinite(price) &&
    price > 0
  );
}

export function mapProductToMetaDetailed(
  product: FeedProduct,
  options: MetaMapperOptions = {},
): MetaMappingResult {
  const policy = resolveProductCommercialPolicy(product);
  const commercial = resolveProductCommercialState(product);
  const issues: MetaFeedIssue[] = [];
  const id = clean(product.id);
  const title = clean(product.title).slice(0, 150);
  const description = cleanDescription(product.description).slice(0, 5000);
  const imageLink = clean(product.img);
  const price = getBaseUnitPrice(product);
  const config = options.config ?? getApplicationConfig();
  const link = options.siteUrl
    ? buildProductPublicUrl(id, undefined, {
        ...config,
        publicSite: { ...config.publicSite, origin: options.siteUrl },
      })
    : buildProductPublicUrl(id, undefined, config);

  if (!policy.isPubliclyVisible) {
    issues.push(issue(
      "PRODUCT_NOT_PUBLIC",
      "El producto no es públicamente visible.",
    ));
  }
  if (!isMetaExportEligible(product)) {
    issues.push(issue(
      "PRODUCT_NOT_EXPORTABLE",
      "El producto no cumple la política de exportación Meta.",
    ));
  }
  if (!Number.isFinite(price) || price <= 0) {
    issues.push(issue(
      "INVALID_PRICE",
      "El precio canónico debe ser finito y positivo.",
      "price",
    ));
  }
  if (!id) {
    issues.push(issue("MISSING_REQUIRED_FIELD", "Falta el ID.", "id"));
  }
  if (!title) {
    issues.push(issue("MISSING_REQUIRED_FIELD", "Falta el título.", "title"));
  }
  if (!description) {
    issues.push(issue(
      "MISSING_REQUIRED_FIELD",
      "Falta la descripción.",
      "description",
    ));
  }
  if (!validHttpUrl(link)) {
    issues.push(issue(
      "INVALID_PRODUCT_URL",
      "La URL de producto debe ser HTTP(S) absoluta.",
      "link",
    ));
  }
  if (!validHttpUrl(imageLink)) {
    issues.push(issue(
      "INVALID_IMAGE_URL",
      "La URL de imagen debe ser HTTP(S) absoluta.",
      "image_link",
    ));
  }

  const availability =
    commercial.availability === "AVAILABLE"
      ? "in stock"
      : commercial.availability === "OUT_OF_STOCK"
        ? "out of stock"
        : null;

  if (!availability) {
    issues.push(issue(
      "UNSUPPORTED_AVAILABILITY",
      "La disponibilidad comercial no es exportable a Meta.",
      "availability",
    ));
  }

  if (issues.length || !availability) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    item: {
      id,
      title,
      description,
      availability,
      condition: "new",
      price: `${price.toFixed(2)} ${config.locale.currency}`,
      link,
      image_link: imageLink,
      brand: config.integrations.meta.brandName,
      google_product_category:
        categoryMap[clean(product.category).toLowerCase()] ||
        "Arts & Entertainment > Party & Celebration",
    },
  };
}

/**
 * Fachada compatible para el motor administrativo, que invoca
 * validate antes de map. Los exportadores usan el resultado detallado.
 */
export function mapProductToMeta(
  product: FeedProduct,
): MetaFeedItem {
  const result = mapProductToMetaDetailed(product);
  if (result.ok === false) {
    throw new Error("Producto no exportable a Meta.");
  }
  return result.item;
}
