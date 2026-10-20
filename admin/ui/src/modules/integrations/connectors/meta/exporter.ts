import type {
  FeedProduct,
  MetaFeedItem,
} from "../../types/feed";
import {
  mapProductToMetaDetailed,
} from "./mapper";
import type {
  MetaExportResult,
  MetaRejectedProduct,
} from "./types";
import {
  validateMetaFeedItem,
} from "./validator";

const META_COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "google_product_category",
] as const satisfies readonly (keyof MetaFeedItem)[];

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function metaItemsToCsv(items: readonly MetaFeedItem[]): string {
  const header = META_COLUMNS.join(",");
  const rows = items.map((item) =>
    META_COLUMNS.map((column) => csvCell(String(item[column]))).join(","),
  );
  return [header, ...rows].join("\n");
}

export function buildMetaExport(
  products: readonly FeedProduct[],
): MetaExportResult {
  const items: MetaFeedItem[] = [];
  const rejected: MetaRejectedProduct[] = [];

  for (const product of products) {
    const mapping = mapProductToMetaDetailed(product);
    if (mapping.ok === false) {
      rejected.push({
        productId: String(product.id ?? "").trim(),
        issues: mapping.issues,
      });
      continue;
    }

    const validationIssues = validateMetaFeedItem(mapping.item);
    if (validationIssues.length) {
      rejected.push({
        productId: String(product.id ?? "").trim(),
        issues: validationIssues,
      });
      continue;
    }
    items.push(mapping.item);
  }

  return {
    csv: metaItemsToCsv(items),
    items,
    rejected,
  };
}

export function getMetaValidationReport(
  products: FeedProduct[],
) {
  return products.map((product) => {
    const mapping = mapProductToMetaDetailed(product);
    return {
      product,
      errors: mapping.ok === true
        ? validateMetaFeedItem(mapping.item).map((issue) => issue.message)
        : mapping.issues.map((issue) => issue.message),
    };
  });
}

export function exportMetaCsv(
  products: FeedProduct[],
): string {
  return buildMetaExport(products).csv;
}
