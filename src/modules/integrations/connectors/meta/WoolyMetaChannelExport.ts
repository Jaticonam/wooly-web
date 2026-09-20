import {
  toWoolyCommercialComposition,
  type WoolyCommercialCompositionOptions,
} from "@/modules/catalog/adapters/WoolyCommercialCompositionAdapter";

import type {
  Product,
} from "@/shared/types/product";

import type {
  ChannelExportRequestV1,
  ChannelExportResultV1,
  CommercialOutputIssue,
  PublicAssetReference,
} from "@/shared/contracts/commercial";

import {
  buildMetaExport,
} from "./exporter";

export type MetaFeedArtifactWriter = (
  csv: string,
) => Promise<PublicAssetReference>;

export interface WoolyMetaChannelExportInput {
  request: ChannelExportRequestV1;
  products: readonly Product[];
  composition: WoolyCommercialCompositionOptions;
  generatedAt?: string;
  writeArtifact?: MetaFeedArtifactWriter;
}

const outputIssue = (
  code: string,
  message: string,
  itemId: string | null = null,
  field: string | null = null,
): CommercialOutputIssue => ({
  code,
  message,
  itemId,
  field,
});

const blockedResult = (
  request: ChannelExportRequestV1,
  generatedAt: string,
  processed: number,
  errors: readonly CommercialOutputIssue[],
): ChannelExportResultV1 => ({
  contractVersion: "channel-export-result.v1",
  exportId: `meta-${request.compositionId || "invalid"}`,
  compositionId: request.compositionId,
  channel: "meta",
  status: "blocked",
  artifact: null,
  processed,
  accepted: 0,
  rejected: processed,
  warnings: [],
  errors,
  generatedAt,
});

/**
 * ACL temporal entre el catálogo operativo de Wooly y el contrato
 * multicanal. Conserva el mapper Meta certificado mientras expone el
 * resultado provider-neutral y el dry run obligatorio.
 */
export const executeWoolyMetaChannelExport = async ({
  request,
  products,
  composition: compositionOptions,
  generatedAt = new Date().toISOString(),
  writeArtifact,
}: WoolyMetaChannelExportInput): Promise<ChannelExportResultV1> => {
  const composition = toWoolyCommercialComposition(
    products,
    compositionOptions,
  );

  const requestErrors: CommercialOutputIssue[] = [];

  if (
    request.channel !== "meta" ||
    request.mode !== "feed"
  ) {
    requestErrors.push(outputIssue(
      "UNSUPPORTED_META_REQUEST",
      "El adapter Meta de Wooly solo admite el canal meta en modo feed.",
    ));
  }

  if (
    !request.compositionId.trim() ||
    request.compositionId !== composition.compositionId
  ) {
    requestErrors.push(outputIssue(
      "COMPOSITION_ID_MISMATCH",
      "La solicitud no corresponde a la composición comercial recibida.",
    ));
  }

  if (requestErrors.length > 0) {
    return blockedResult(
      request,
      generatedAt,
      products.length,
      requestErrors,
    );
  }

  const meta = buildMetaExport(products);
  const errors = meta.rejected.flatMap((rejected) =>
    rejected.issues.map((currentIssue) =>
      outputIssue(
        currentIssue.code,
        currentIssue.message,
        rejected.productId || null,
        currentIssue.field ?? null,
      )),
  );

  const accepted = meta.items.length;
  const rejected = meta.rejected.length;
  const status = accepted === 0
    ? "blocked"
    : rejected > 0
      ? "partial"
      : "ready";

  if (request.dryRun) {
    return {
      contractVersion: "channel-export-result.v1",
      exportId: `meta-${request.compositionId}-dry-run`,
      compositionId: request.compositionId,
      channel: "meta",
      status,
      artifact: null,
      processed: products.length,
      accepted,
      rejected,
      warnings: [],
      errors,
      generatedAt,
    };
  }

  if (!writeArtifact) {
    return blockedResult(
      request,
      generatedAt,
      products.length,
      [outputIssue(
        "ARTIFACT_WRITER_UNAVAILABLE",
        "La publicación real requiere un writer de artifacts configurado.",
      )],
    );
  }

  const artifact = await writeArtifact(meta.csv);

  return {
    contractVersion: "channel-export-result.v1",
    exportId: `meta-${request.compositionId}`,
    compositionId: request.compositionId,
    channel: "meta",
    status,
    artifact,
    processed: products.length,
    accepted,
    rejected,
    warnings: [],
    errors,
    generatedAt,
  };
};
