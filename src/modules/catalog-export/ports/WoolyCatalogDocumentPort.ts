import type {
  CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  buildCatalogPdfUrl,
  type BuildCatalogPdfUrlParams,
} from "@/modules/catalog-tools/services/BuildCatalogPdfUrl";

import type {
  CommercialDocumentRequestV1,
  CommercialOutputIssue,
} from "@/shared/contracts/commercial";

export type WoolyCatalogDocumentPreparationStatus =
  | "ready"
  | "blocked";

export interface WoolyCatalogDocumentPreparation {
  request: CommercialDocumentRequestV1;
  status: WoolyCatalogDocumentPreparationStatus;
  previewUrl: string | null;
  deliveryMode: "browser-print";
  issues: readonly CommercialOutputIssue[];
}

const hashText = (
  value: string,
) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

const sorted = (
  values: readonly string[],
) => [...values].map((value) => value.trim()).filter(Boolean).sort();

/**
 * Identidad reproducible de la selección mientras no exista todavía
 * un publicationId persistido por JUNG CORE.
 */
export const createWoolyCatalogCompositionId = (
  composition: CatalogComposition,
) => {
  const fingerprint = JSON.stringify({
    mode: composition.mode,
    categoryIds: sorted(composition.filters.categoryIds),
    campaignIds: sorted(composition.filters.campaignIds),
    includedProductIds: sorted(composition.overrides.includedProductIds),
    excludedProductIds: sorted(composition.overrides.excludedProductIds),
  });

  return `wooly-catalog-${hashText(fingerprint)}`;
};

export const createWoolyCatalogDocumentRequest = (
  compositionId: string,
): CommercialDocumentRequestV1 => ({
  contractVersion: "commercial-document-request.v1",
  compositionId: compositionId.trim(),
  documentType: "catalog",
  templateId: "wooly-catalog-default",
  locale: "es-PE",
  brandingProfileId: "wooly-default",
  output: "pdf",
});

const issue = (
  code: string,
  message: string,
): CommercialOutputIssue => ({
  code,
  message,
  itemId: null,
  field: null,
});

/**
 * Adapter de compatibilidad del PDF actual.
 *
 * Prepara la vista imprimible existente, pero no declara un
 * CommercialDocumentResult porque todavía no produce ni registra un
 * archivo PDF real. Ese resultado corresponderá al renderer de CORE.
 */
export const prepareWoolyCatalogDocument = (
  request: CommercialDocumentRequestV1,
  params: BuildCatalogPdfUrlParams,
): WoolyCatalogDocumentPreparation => {
  const issues: CommercialOutputIssue[] = [];

  if (!request.compositionId.trim()) {
    issues.push(issue(
      "MISSING_COMPOSITION_ID",
      "La solicitud documental no tiene compositionId.",
    ));
  }

  if (
    request.documentType !== "catalog" ||
    request.output !== "pdf" ||
    request.templateId !== "wooly-catalog-default"
  ) {
    issues.push(issue(
      "UNSUPPORTED_DOCUMENT_REQUEST",
      "El adapter Wooly solo prepara el catálogo PDF con su template oficial.",
    ));
  }

  if (issues.length > 0) {
    return {
      request,
      status: "blocked",
      previewUrl: null,
      deliveryMode: "browser-print",
      issues,
    };
  }

  try {
    return {
      request,
      status: "ready",
      previewUrl: buildCatalogPdfUrl(params),
      deliveryMode: "browser-print",
      issues: [],
    };
  } catch {
    return {
      request,
      status: "blocked",
      previewUrl: null,
      deliveryMode: "browser-print",
      issues: [issue(
        "INVALID_PDF_LINK",
        "No se pudo construir la vista imprimible del catálogo.",
      )],
    };
  }
};
