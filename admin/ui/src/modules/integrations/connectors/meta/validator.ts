import type {
  FeedProduct,
  MetaFeedItem,
} from "../../types/feed";
import {
  META_CURRENCY,
  mapProductToMetaDetailed,
} from "./mapper";
import type {
  MetaFeedIssue,
} from "./types";

const AVAILABILITIES = new Set(["in stock", "out of stock"]);
const CONDITIONS = new Set(["new"]);

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

export function validateMetaFeedItem(
  item: MetaFeedItem,
): readonly MetaFeedIssue[] {
  const issues: MetaFeedIssue[] = [];
  const required = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
  ] as const;

  for (const field of required) {
    if (!String(item[field] ?? "").trim()) {
      issues.push(issue(
        "MISSING_REQUIRED_FIELD",
        `El campo "${field}" es obligatorio.`,
        field,
      ));
    }
  }

  if (!AVAILABILITIES.has(item.availability)) {
    issues.push(issue(
      "UNSUPPORTED_AVAILABILITY",
      "availability no es reconocida.",
      "availability",
    ));
  }
  if (!CONDITIONS.has(item.condition)) {
    issues.push(issue(
      "MISSING_REQUIRED_FIELD",
      "condition no es reconocida.",
      "condition",
    ));
  }

  const priceMatch = item.price.trim().match(
    /^(-?(?:\d+\.?\d*|\.\d+))\s+([A-Z]{3})$/,
  );
  const numericPrice = priceMatch ? Number(priceMatch[1]) : Number.NaN;
  const currency = priceMatch?.[2];
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    issues.push(issue(
      "INVALID_PRICE",
      "price debe contener un importe finito y positivo.",
      "price",
    ));
  }
  if (currency !== META_CURRENCY) {
    issues.push(issue(
      "INVALID_CURRENCY",
      `La moneda permitida es ${META_CURRENCY}.`,
      "price",
    ));
  }
  if (!validHttpUrl(item.link)) {
    issues.push(issue(
      "INVALID_PRODUCT_URL",
      "link debe ser una URL HTTP(S) absoluta.",
      "link",
    ));
  }
  if (!validHttpUrl(item.image_link)) {
    issues.push(issue(
      "INVALID_IMAGE_URL",
      "image_link debe ser una URL HTTP(S) absoluta.",
      "image_link",
    ));
  }

  return issues;
}

/**
 * Fachada compatible con IntegrationConnector.validate.
 */
export function validateMetaProduct(
  product: FeedProduct,
): string[] {
  const mapping = mapProductToMetaDetailed(product);
  if (mapping.ok === false) {
    return mapping.issues.map((item) => item.message);
  }
  return validateMetaFeedItem(mapping.item).map((item) => item.message);
}
