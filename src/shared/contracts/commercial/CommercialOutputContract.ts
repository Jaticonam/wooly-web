export type CommercialOutputStatus =
  | "pending"
  | "ready"
  | "partial"
  | "blocked"
  | "failed";

export interface CommercialOutputIssue {
  code: string;
  message: string;
  itemId: string | null;
  field: string | null;
}

export interface PublicAssetReference {
  assetId: string;
  kind: "image" | "og-image" | "pdf" | "feed";
  status: "ready" | "pending" | "unavailable";
  url: string | null;
  mimeType: string;
  version: number;
}

export type CommercialDocumentType =
  | "catalog"
  | "quotation"
  | "price-list"
  | "product-sheet";

export interface CommercialDocumentRequestV1 {
  contractVersion: "commercial-document-request.v1";
  compositionId: string;
  documentType: CommercialDocumentType;
  templateId: string;
  locale: string;
  brandingProfileId: string;
  output: "pdf";
}

export interface CommercialDocumentResultV1 {
  contractVersion: "commercial-document-result.v1";
  documentId: string;
  compositionId: string;
  status: CommercialOutputStatus;
  asset: PublicAssetReference | null;
  generatedAt: string;
  warnings: readonly CommercialOutputIssue[];
  errors: readonly CommercialOutputIssue[];
}

export type CommerceChannel =
  | "meta"
  | "google-merchant"
  | "pinterest"
  | "mercado-libre";

export interface ChannelExportRequestV1 {
  contractVersion: "channel-export-request.v1";
  compositionId: string;
  channel: CommerceChannel;
  profileId: string;
  mode: "feed" | "api";
  dryRun: boolean;
}

export interface ChannelExportResultV1 {
  contractVersion: "channel-export-result.v1";
  exportId: string;
  compositionId: string;
  channel: CommerceChannel;
  status: CommercialOutputStatus;
  artifact: PublicAssetReference | null;
  processed: number;
  accepted: number;
  rejected: number;
  warnings: readonly CommercialOutputIssue[];
  errors: readonly CommercialOutputIssue[];
  generatedAt: string;
}

export interface ExportProfileV1 {
  contractVersion: "export-profile.v1";
  profileId: string;
  appId: string;
  channel: CommerceChannel;
  locale: string;
  currency: string;
  country: string;
  mappings: Readonly<Record<string, string>>;
  rules: Readonly<Record<string, string | number | boolean>>;
  defaults: Readonly<Record<string, string | number | boolean | null>>;
  publicationMode: "feed" | "api";
  credentialsRef: string | null;
}
