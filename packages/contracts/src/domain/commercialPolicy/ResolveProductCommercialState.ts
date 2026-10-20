import {
  getBaseUnitPrice,
} from "../volumePricing/VolumePricing";

import type {
  CommercialIssue,
  ProductCommercialState,
  ProductCommercialStateInput,
} from "./CommercialPolicyTypes";

const PRODUCT_SOURCE_STATUSES = new Set([
  "borrador",
  "oculto",
  "preventa",
  "publicado",
  "agotado",
]);

function normalizeSourceStatus(
  value: unknown,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function hasValidBasePrice(
  input: ProductCommercialStateInput,
): boolean {
  return (
    getBaseUnitPrice({
      price_1:
        input.price_1 ?? 0,
      price_offer:
        input.price_offer,
    }) > 0
  );
}

export function resolveProductCommercialState(
  input: ProductCommercialStateInput,
): ProductCommercialState {
  const status =
    normalizeSourceStatus(
      input.status,
    );

  if (
    !PRODUCT_SOURCE_STATUSES.has(
      status,
    )
  ) {
    return {
      publication: "INVALID",
      availability: "INVALID",
      purchaseMode: "NONE",
      isPubliclyVisible: false,
      isPurchasable: false,
      canShowPricing: false,
      canShowInventoryQuantity: false,
      issues: ["invalid-status"],
    };
  }

  if (
    status === "oculto" ||
    status === "borrador"
  ) {
    return {
      publication: "UNPUBLISHED",
      availability: "UNTRACKED",
      purchaseMode: "NONE",
      isPubliclyVisible: false,
      isPurchasable: false,
      canShowPricing: false,
      canShowInventoryQuantity: false,
      issues: ["non-public-status"],
    };
  }

  if (status === "preventa") {
    return {
      publication: "PUBLISHED",
      availability: "PREORDER",
      purchaseMode: "PREORDER",
      isPubliclyVisible: true,
      isPurchasable: false,
      canShowPricing: false,
      canShowInventoryQuantity: false,
      issues: [],
    };
  }

  if (status === "agotado") {
    const validPrice =
      hasValidBasePrice(input);

    return validPrice
      ? {
          publication: "PUBLISHED",
          availability: "OUT_OF_STOCK",
          purchaseMode: "WHATSAPP",
          isPubliclyVisible: true,
          isPurchasable: false,
          canShowPricing: true,
          canShowInventoryQuantity: false,
          issues: [],
        }
      : {
          publication: "PUBLISHED",
          availability: "INVALID",
          purchaseMode: "NONE",
          isPubliclyVisible: false,
          isPurchasable: false,
          canShowPricing: false,
          canShowInventoryQuantity: false,
          issues: ["invalid-base-price"],
        };
  }

  const issues:
    CommercialIssue[] = [];

  if (!hasValidBasePrice(input)) {
    issues.push(
      "invalid-base-price",
    );
  }

  const hasFiniteStock =
    typeof input.stock === "number" &&
    Number.isFinite(input.stock) &&
    input.stock >= 0;

  if (!hasFiniteStock) {
    issues.push(
      "invalid-stock",
    );
  } else if (input.stock === 0) {
    issues.push(
      "stock-status-mismatch",
    );
  }

  const isAvailable =
    issues.length === 0;

  return {
    publication: "PUBLISHED",
    availability:
      isAvailable
        ? "AVAILABLE"
        : "INVALID",
    purchaseMode:
      isAvailable
        ? "CART"
        : "NONE",
    isPubliclyVisible:
      isAvailable,
    isPurchasable:
      isAvailable,
    canShowPricing:
      isAvailable,
    canShowInventoryQuantity:
      isAvailable,
    issues,
  };
}
