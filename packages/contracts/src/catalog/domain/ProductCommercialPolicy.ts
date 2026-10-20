import {
  resolveProductCommercialState,
  type CommercialIssue,
} from "../../domain/commercialPolicy";

/* =========================================================
   CONTRATO MÍNIMO DE POLÍTICA
   ========================================================= */

/**
 * Contrato mínimo deliberadamente independiente del tipo
 * legacy Product.
 *
 * JUNG CORE podrá proporcionar los mismos datos desde su
 * contrato canónico sin reescribir las reglas comerciales.
 */
export interface ProductCommercialPolicyInput {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  img?: string | null;

  price_1?: number | null;
  price_offer?: number | null;
  stock?: number | null;

  status?: string | null;
}

/* =========================================================
   ESTADOS OFICIALES DEL SHEET LEGACY
   ========================================================= */

export const PRODUCT_SHEET_STATUSES = [
  "borrador",
  "oculto",
  "preventa",
  "publicado",
  "agotado",
] as const;

export type ProductSheetStatus =
  (typeof PRODUCT_SHEET_STATUSES)[number];

export type ResolvedProductSheetStatus =
  | ProductSheetStatus
  | "invalid";

const PRODUCT_SHEET_STATUS_SET =
  new Set<string>(
    PRODUCT_SHEET_STATUSES,
  );

/* =========================================================
   DIAGNÓSTICO
   ========================================================= */

export type ProductCommercialIssue =
  CommercialIssue;

export interface ProductCommercialPolicy {
  status:
    ResolvedProductSheetStatus;

  isStatusValid:
    boolean;

  isPubliclyVisible:
    boolean;

  hasValidPublicationData:
    boolean;

  isPurchasable:
    boolean;

  isConsultOnly:
    boolean;

  canShowPricing:
    boolean;

  canShowInventoryQuantity:
    boolean;

  canExportToTransactionalChannel:
    boolean;

  issues:
    ProductCommercialIssue[];
}

/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(
  value: unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

export function normalizeProductSheetStatus(
  value: unknown,
): ResolvedProductSheetStatus {
  const normalized =
    cleanText(value)
      .toLowerCase();

  return PRODUCT_SHEET_STATUS_SET.has(
    normalized,
  )
    ? (
        normalized as
          ProductSheetStatus
      )
    : "invalid";
}

/* =========================================================
   RESOLUCIÓN DE POLÍTICA
   ========================================================= */

export function resolveProductCommercialPolicy(
  product:
    ProductCommercialPolicyInput,
): ProductCommercialPolicy {
  const status =
    normalizeProductSheetStatus(
      product.status,
    );

  const commercialState =
    resolveProductCommercialState(
      product,
    );

  const issues:
    ProductCommercialIssue[] = [
      ...commercialState.issues,
    ];

  /*
   * La fachada legacy conserva las validaciones editoriales
   * de publicación. El dominio canónico deliberadamente solo
   * recibe datos comerciales mínimos.
   */
  const isPublished =
    commercialState.publication ===
    "PUBLISHED";

  if (!isPublished) {
    return {
      status,
      isStatusValid:
        status !== "invalid",
      isPubliclyVisible: false,
      hasValidPublicationData: false,
      isPurchasable: false,
      isConsultOnly: false,
      canShowPricing: false,
      canShowInventoryQuantity: false,
      canExportToTransactionalChannel:
        false,
      issues,
    };
  }

  if (!cleanText(product.id)) {
    issues.push(
      "missing-id",
    );
  }

  if (!cleanText(product.title)) {
    issues.push(
      "missing-title",
    );
  }

  if (!cleanText(product.img)) {
    issues.push(
      "missing-image",
    );
  }

  if (
    status === "preventa" &&
    !cleanText(
      product.description,
    )
  ) {
    issues.push(
      "missing-description",
    );
  }

  const hasValidPublicationData =
    issues.length === 0;

  const isPubliclyVisible =
    commercialState
      .isPubliclyVisible &&
    hasValidPublicationData;

  const isPurchasable =
    commercialState
      .isPurchasable &&
    hasValidPublicationData;

  const isConsultOnly =
    hasValidPublicationData &&
    (
      commercialState
        .purchaseMode ===
        "PREORDER" ||
      commercialState
        .purchaseMode ===
        "WHATSAPP"
    );

  const canShowPricing =
    commercialState
      .canShowPricing &&
    hasValidPublicationData;

  const canShowInventoryQuantity =
    commercialState
      .canShowInventoryQuantity &&
    hasValidPublicationData;

  return {
    status,
    isStatusValid: true,
    isPubliclyVisible,
    hasValidPublicationData,
    isPurchasable,
    isConsultOnly,
    canShowPricing,
    canShowInventoryQuantity,
    canExportToTransactionalChannel:
      isPurchasable,
    issues,
  };
}

/* =========================================================
   ATAJOS DE CONSUMO
   ========================================================= */

export function isProductPubliclyVisible(
  product:
    ProductCommercialPolicyInput,
): boolean {
  return (
    resolveProductCommercialPolicy(
      product,
    ).isPubliclyVisible
  );
}

export function isProductPublicationDataValid(
  product:
    ProductCommercialPolicyInput,
): boolean {
  return (
    resolveProductCommercialPolicy(
      product,
    ).hasValidPublicationData
  );
}

export function isProductPurchasable(
  product:
    ProductCommercialPolicyInput,
): boolean {
  return (
    resolveProductCommercialPolicy(
      product,
    ).isPurchasable
  );
}

export function canProductExportToTransactionalChannel(
  product:
    ProductCommercialPolicyInput,
): boolean {
  return (
    resolveProductCommercialPolicy(
      product,
    ).canExportToTransactionalChannel
  );
}
