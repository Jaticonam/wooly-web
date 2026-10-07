import {
  resolveProductCommercialPolicy,
} from "@/modules/catalog/domain/ProductCommercialPolicy";
import {
  resolveProductCommercialState,
} from "@/shared/domain/commercialPolicy";
import {
  getBaseUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";
import type {
  Product,
} from "@/shared/types/product";
import type {
  ProductSeoData,
} from "./productSeo";
import { getApplicationConfig } from "@/shared/config/application";

export type SeoSchemaIssueCode =
  | "PRODUCT_NOT_PUBLIC"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_URL"
  | "INVALID_PRICE"
  | "UNSUPPORTED_AVAILABILITY"
  | "SERIALIZATION_FAILED";

export interface SeoSchemaIssue {
  code: SeoSchemaIssueCode;
  field?: string;
  message: string;
}

export type SeoSchemaResult<T> =
  | { ok: true; schema: T; json: string }
  | { ok: false; issues: readonly SeoSchemaIssue[] };

export type ProductJsonLdSchema = Record<string, unknown>;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function validHttpUrl(value: unknown): boolean {
  try {
    const url = new URL(clean(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function buildProductSeoSchema(
  product: Product,
  seo: ProductSeoData,
): SeoSchemaResult<ProductJsonLdSchema> {
  const config = getApplicationConfig();
  const policy = resolveProductCommercialPolicy(product);
  const commercial = resolveProductCommercialState(product);
  const issues: SeoSchemaIssue[] = [];
  const id = clean(product.id);
  const name = clean(product.title);
  const description = clean(product.description);

  if (!policy.isPubliclyVisible) {
    issues.push({
      code: "PRODUCT_NOT_PUBLIC",
      message: "El producto no es públicamente visible.",
    });
  }
  for (const [field, value] of [
    ["id", id],
    ["name", name],
    ["description", description],
  ]) {
    if (!value) {
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        field,
        message: `El campo "${field}" es obligatorio.`,
      });
    }
  }
  if (!validHttpUrl(seo.canonical)) {
    issues.push({
      code: "INVALID_URL",
      field: "canonical",
      message: "La URL canónica debe ser HTTP(S) absoluta.",
    });
  }
  if (!validHttpUrl(product.img)) {
    issues.push({
      code: "INVALID_URL",
      field: "image",
      message: "La imagen debe ser HTTP(S) absoluta.",
    });
  }
  if (issues.length) return { ok: false, issues };

  const schema: ProductJsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    ...(product.code ? { sku: product.code } : product.sku ? { sku: product.sku } : {}),
    url: seo.canonical,
    image: [clean(product.img)],
    category: clean(product.category),
    brand: {
      "@type": "Brand",
      name: config.app.name,
    },
  };

  if (policy.canShowPricing) {
    const price = getBaseUnitPrice(product);
    if (!Number.isFinite(price) || price <= 0) {
      return {
        ok: false,
        issues: [{
          code: "INVALID_PRICE",
          field: "price",
          message: "El precio debe ser finito y positivo.",
        }],
      };
    }
    const availability =
      commercial.availability === "AVAILABLE"
        ? "https://schema.org/InStock"
        : commercial.availability === "OUT_OF_STOCK"
          ? "https://schema.org/OutOfStock"
          : null;
    if (!availability) {
      return {
        ok: false,
        issues: [{
          code: "UNSUPPORTED_AVAILABILITY",
          field: "availability",
          message: "La disponibilidad no es representable en Product JSON-LD.",
        }],
      };
    }
    schema.offers = {
      "@type": "Offer",
      url: seo.canonical,
      priceCurrency: config.locale.currency,
      price,
      availability,
      itemCondition: "https://schema.org/NewCondition",
    };
  }

  try {
    const json = JSON.stringify(schema, (_key, value) => {
      if (typeof value === "number" && !Number.isFinite(value)) {
        throw new TypeError("Número no finito");
      }
      if (typeof value === "function" || typeof value === "undefined") {
        throw new TypeError("Valor no serializable");
      }
      return value;
    });
    JSON.parse(json);
    return { ok: true, schema, json };
  } catch {
    return {
      ok: false,
      issues: [{
        code: "SERIALIZATION_FAILED",
        message: "El schema no pudo serializarse de forma segura.",
      }],
    };
  }
}
