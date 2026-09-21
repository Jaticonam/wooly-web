import {
  resolveProductCommercialPolicy,
  type ProductCommercialIssue,
} from "@/modules/catalog/domain/ProductCommercialPolicy";
import type {
  Product,
} from "@/shared/types/product";

export type ProductAdminInventoryState =
  | "available"
  | "low"
  | "out"
  | "preorder"
  | "inconsistent"
  | "untracked";

const STATUS_LABELS = {
  borrador: "Borrador",
  oculto: "Oculto",
  preventa: "Preventa",
  publicado: "Publicado",
  agotado: "Agotado",
  invalid: "Estado inválido",
} as const;

const ISSUE_LABELS: Partial<Record<ProductCommercialIssue, string>> = {
  "invalid-status": "Estado inválido",
  "missing-id": "Sin SKU",
  "missing-title": "Sin nombre",
  "missing-image": "Sin imagen",
  "missing-description": "Sin descripción",
  "invalid-base-price": "Precio inválido",
  "invalid-stock": "Stock inválido",
  "stock-status-mismatch": "Stock inconsistente",
};

export function resolveProductAdminOperationalState(
  product: Product,
  options: { imageLoadFailed?: boolean } = {},
) {
  const policy = resolveProductCommercialPolicy(product);
  const stock = typeof product.stock === "number" && Number.isFinite(product.stock)
    ? product.stock
    : null;

  let inventoryState: ProductAdminInventoryState = "untracked";
  let inventoryLabel = "No aplica";

  if (policy.status === "preventa") {
    inventoryState = "preorder";
    inventoryLabel = "Preventa";
  } else if (policy.status === "agotado") {
    inventoryState = "out";
    inventoryLabel = "Agotado";
  } else if (
    policy.issues.includes("invalid-stock") ||
    policy.issues.includes("stock-status-mismatch")
  ) {
    inventoryState = "inconsistent";
    inventoryLabel = "Stock inconsistente";
  } else if (policy.status === "publicado" && stock !== null && stock > 0) {
    inventoryState = stock <= 5 ? "low" : "available";
    inventoryLabel = stock <= 5
      ? `Stock bajo · ${stock}`
      : `Disponible · ${stock}`;
  }

  const observations = policy.issues
    .map((issue) => ISSUE_LABELS[issue])
    .filter((label): label is string => Boolean(label));

  if (options.imageLoadFailed && !observations.includes("Imagen no disponible")) {
    observations.push("Imagen no disponible");
  }

  return {
    policy,
    statusLabel: STATUS_LABELS[policy.status],
    inventoryState,
    inventoryLabel,
    observations,
  };
}

export function summarizeProductAdminOperations(
  products: readonly Product[],
) {
  return products.reduce(
    (summary, product) => {
      const state = resolveProductAdminOperationalState(product);

      if (state.policy.isPubliclyVisible) {
        summary.visible += 1;
      }

      if (state.policy.isPurchasable) {
        summary.sellable += 1;
      }

      if (state.observations.length > 0) {
        summary.observed += 1;
      }

      return summary;
    },
    {
      total: products.length,
      visible: 0,
      sellable: 0,
      observed: 0,
    },
  );
}
