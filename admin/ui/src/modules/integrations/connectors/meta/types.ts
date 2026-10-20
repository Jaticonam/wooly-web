import type {
  MetaFeedItem,
} from "../../types/feed";

export type MetaFeedIssueCode =
  | "PRODUCT_NOT_PUBLIC"
  | "PRODUCT_NOT_EXPORTABLE"
  | "INVALID_PRICE"
  | "INVALID_PRODUCT_URL"
  | "INVALID_IMAGE_URL"
  | "INVALID_CURRENCY"
  | "UNSUPPORTED_AVAILABILITY"
  | "MISSING_REQUIRED_FIELD";

export interface MetaFeedIssue {
  code: MetaFeedIssueCode;
  field?: keyof MetaFeedItem;
  message: string;
}

export type MetaMappingResult =
  | {
      ok: true;
      item: MetaFeedItem;
    }
  | {
      ok: false;
      issues: readonly MetaFeedIssue[];
    };

export interface MetaRejectedProduct {
  productId: string;
  issues: readonly MetaFeedIssue[];
}

export interface MetaExportResult {
  csv: string;
  items: readonly MetaFeedItem[];
  rejected: readonly MetaRejectedProduct[];
}
