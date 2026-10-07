import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
  type CatalogProductContract,
} from "./ProductContract";

export type CatalogContractIssueCode =
  | "INVALID_CONTRACT_VERSION"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_FIELD_TYPE"
  | "EMPTY_IDENTIFIER"
  | "INVALID_PRICE"
  | "INVALID_QUANTITY"
  | "DUPLICATE_VOLUME_TIER"
  | "INVALID_INVENTORY"
  | "INVALID_DATE"
  | "INVALID_DATE_RANGE"
  | "INVALID_MEDIA_URL"
  | "UNKNOWN_ENUM_VALUE";

export interface CatalogContractIssue {
  code: CatalogContractIssueCode;
  path: string;
  message: string;
  value?: unknown;
}

export type CatalogContractValidationResult =
  | {
      ok: true;
      data: CatalogProductContract;
      warnings: readonly CatalogContractIssue[];
    }
  | {
      ok: false;
      errors: readonly CatalogContractIssue[];
      warnings: readonly CatalogContractIssue[];
    };

const PUBLICATION_STATUSES = new Set([
  "draft",
  "published",
  "hidden",
  "preorder",
  "archived",
]);
const INVENTORY_STATUSES = new Set([
  "available",
  "outOfStock",
  "preorder",
  "comingSoon",
  "untracked",
]);
const MEDIA_KINDS = new Set(["image", "video"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitized(value: unknown): unknown {
  return typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean" || value === null
    ? value
    : undefined;
}

function push(
  errors: CatalogContractIssue[],
  code: CatalogContractIssueCode,
  path: string,
  message: string,
  value?: unknown,
): void {
  errors.push({ code, path, message, value: sanitized(value) });
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  errors: CatalogContractIssue[],
): void {
  const value = record[key];
  if (typeof value !== "string") {
    push(errors, "INVALID_FIELD_TYPE", key, `"${key}" debe ser string.`, value);
  } else if (!value.trim()) {
    push(errors, "EMPTY_IDENTIFIER", key, `"${key}" no puede estar vacío.`, value);
  }
}

function validDate(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "" &&
    !Number.isNaN(Date.parse(value));
}

function validateStringArray(
  value: unknown,
  path: string,
  errors: CatalogContractIssue[],
  requireNonEmpty: boolean,
): void {
  if (!Array.isArray(value)) {
    push(errors, "INVALID_FIELD_TYPE", path, `${path} debe ser un array.`);
    return;
  }
  value.forEach((item, index) => {
    if (
      typeof item !== "string" ||
      (requireNonEmpty && !item.trim())
    ) {
      push(
        errors,
        requireNonEmpty ? "EMPTY_IDENTIFIER" : "INVALID_FIELD_TYPE",
        `${path}[${index}]`,
        `${path} contiene un valor inválido.`,
        item,
      );
    }
  });
}

export function validateCatalogProductContractV1(
  value: unknown,
): CatalogContractValidationResult {
  const errors: CatalogContractIssue[] = [];
  const warnings: CatalogContractIssue[] = [];

  if (!isRecord(value)) {
    push(errors, "INVALID_FIELD_TYPE", "$", "El contrato debe ser un objeto.");
    return { ok: false, errors, warnings };
  }

  if (value.contractVersion !== CATALOG_PRODUCT_CONTRACT_VERSION) {
    push(
      errors,
      "INVALID_CONTRACT_VERSION",
      "contractVersion",
      `Se requiere ${CATALOG_PRODUCT_CONTRACT_VERSION}.`,
      value.contractVersion,
    );
  }

  for (const key of [
    "id", "slug", "brandId", "categoryId", "title", "description",
  ]) {
    requiredString(value, key, errors);
  }

  for (const field of ['sku', 'code', 'barcode']) {
    if (value[field] !== undefined && value[field] !== null) requiredString(value, field, errors);
  }
  if (
    typeof value.publicationStatus !== "string" ||
    !PUBLICATION_STATUSES.has(value.publicationStatus)
  ) {
    push(errors, "UNKNOWN_ENUM_VALUE", "publicationStatus",
      "publicationStatus no es reconocido.", value.publicationStatus);
  }
  if (typeof value.priority !== "number" || !Number.isFinite(value.priority)) {
    push(errors, "INVALID_FIELD_TYPE", "priority",
      "priority debe ser un número finito.", value.priority);
  }
  validateStringArray(value.manualBadgeCodes, "manualBadgeCodes", errors, false);

  if (!isRecord(value.pricing)) {
    push(errors, "MISSING_REQUIRED_FIELD", "pricing", "pricing es obligatorio.");
  } else {
    requiredString(value.pricing, "currency", errors);
    const tiers = value.pricing.volumePrices;
    if (!Array.isArray(tiers)) {
      push(errors, "INVALID_FIELD_TYPE", "pricing.volumePrices",
        "volumePrices debe ser un array.");
    } else {
      const quantities = new Set<number>();
      tiers.forEach((tier, index) => {
        const path = `pricing.volumePrices[${index}]`;
        if (!isRecord(tier)) {
          push(errors, "INVALID_FIELD_TYPE", path, "El tier debe ser un objeto.");
          return;
        }
        requiredString(tier, "id", errors);
        const quantity = tier.minimumQuantity;
        if (
          typeof quantity !== "number" ||
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          push(errors, "INVALID_QUANTITY", `${path}.minimumQuantity`,
            "minimumQuantity debe ser finita y positiva.", quantity);
        } else if (quantities.has(quantity)) {
          push(errors, "DUPLICATE_VOLUME_TIER", `${path}.minimumQuantity`,
            "minimumQuantity está duplicada.", quantity);
        } else {
          quantities.add(quantity);
        }
        if (
          typeof tier.unitPrice !== "number" ||
          !Number.isFinite(tier.unitPrice) ||
          tier.unitPrice <= 0
        ) {
          push(errors, "INVALID_PRICE", `${path}.unitPrice`,
            "unitPrice debe ser finito y positivo.", tier.unitPrice);
        }
      });
      if (!tiers.some((tier) =>
        isRecord(tier) && tier.minimumQuantity === 1
      )) {
        push(errors, "INVALID_PRICE", "pricing.volumePrices",
          "Debe existir un precio base para cantidad 1.");
      }
    }

    const offer = value.pricing.offer;
    if (offer !== null) {
      if (!isRecord(offer)) {
        push(errors, "INVALID_FIELD_TYPE", "pricing.offer",
          "offer debe ser un objeto o null.");
      } else {
        if (
          typeof offer.unitPrice !== "number" ||
          !Number.isFinite(offer.unitPrice) ||
          offer.unitPrice <= 0
        ) {
          push(errors, "INVALID_PRICE", "pricing.offer.unitPrice",
            "El precio de oferta debe ser finito y positivo.", offer.unitPrice);
        }
        for (const key of ["startsAt", "endsAt"] as const) {
          const date = offer[key];
          if (date !== null && !validDate(date)) {
            push(errors, "INVALID_DATE", `pricing.offer.${key}`,
              `${key} no es una fecha válida.`, date);
          }
        }
        if (
          validDate(offer.startsAt) &&
          validDate(offer.endsAt) &&
          Date.parse(offer.startsAt as string) > Date.parse(offer.endsAt as string)
        ) {
          push(errors, "INVALID_DATE_RANGE", "pricing.offer",
            "La vigencia de oferta está invertida.");
        }
      }
    }
  }

  if (!isRecord(value.inventory)) {
    push(errors, "MISSING_REQUIRED_FIELD", "inventory", "inventory es obligatorio.");
  } else {
    if (typeof value.inventory.tracked !== "boolean") {
      push(errors, "INVALID_INVENTORY", "inventory.tracked",
        "tracked debe ser booleano.", value.inventory.tracked);
    }
    if (
      value.inventory.availableQuantity !== null &&
      (
        typeof value.inventory.availableQuantity !== "number" ||
        !Number.isFinite(value.inventory.availableQuantity) ||
        value.inventory.availableQuantity < 0
      )
    ) {
      push(errors, "INVALID_INVENTORY", "inventory.availableQuantity",
        "availableQuantity debe ser null o un número finito no negativo.",
        value.inventory.availableQuantity);
    }
    if (
      value.inventory.updatedAt !== null &&
      !validDate(value.inventory.updatedAt)
    ) {
      push(errors, "INVALID_DATE", "inventory.updatedAt",
        "inventory.updatedAt no es una fecha válida.", value.inventory.updatedAt);
    }
    if (
      typeof value.inventory.status !== "string" ||
      !INVENTORY_STATUSES.has(value.inventory.status)
    ) {
      push(errors, "UNKNOWN_ENUM_VALUE", "inventory.status",
        "El estado de inventario no es reconocido.", value.inventory.status);
    }
  }

  if (!Array.isArray(value.mediaAssets)) {
    push(errors, "INVALID_FIELD_TYPE", "mediaAssets",
      "mediaAssets debe ser un array.");
  } else {
    value.mediaAssets.forEach((asset, index) => {
      const path = `mediaAssets[${index}]`;
      if (!isRecord(asset)) {
        push(errors, "INVALID_FIELD_TYPE", path, "El media asset debe ser un objeto.");
        return;
      }
      requiredString(asset, "id", errors);
      try {
        const url = new URL(String(asset.url));
        if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
      } catch {
        push(errors, "INVALID_MEDIA_URL", `${path}.url`,
          "La URL debe usar HTTP o HTTPS.", asset.url);
      }
      if (typeof asset.kind !== "string" || !MEDIA_KINDS.has(asset.kind)) {
        push(errors, "UNKNOWN_ENUM_VALUE", `${path}.kind`,
          "El tipo de media no es reconocido.", asset.kind);
      }
      if (
        typeof asset.position !== "number" ||
        !Number.isFinite(asset.position)
      ) {
        push(errors, "INVALID_FIELD_TYPE", `${path}.position`,
          "position debe ser finita.", asset.position);
      }
      if (typeof asset.isPrimary !== "boolean") {
        push(errors, "INVALID_FIELD_TYPE", `${path}.isPrimary`,
          "isPrimary debe ser booleano.", asset.isPrimary);
      }
      if (typeof asset.altText !== "string") {
        push(errors, "INVALID_FIELD_TYPE", `${path}.altText`,
          "altText debe ser string.", asset.altText);
      }
      if (asset.thumbnailUrl !== null) {
        try {
          const thumbnail = new URL(String(asset.thumbnailUrl));
          if (thumbnail.protocol !== "http:" && thumbnail.protocol !== "https:") {
            throw new Error();
          }
        } catch {
          push(errors, "INVALID_MEDIA_URL", `${path}.thumbnailUrl`,
            "thumbnailUrl debe usar HTTP o HTTPS.", asset.thumbnailUrl);
        }
      }
    });
  }

  validateStringArray(value.campaignIds, "campaignIds", errors, true);
  if (value.updatedAt !== null && !validDate(value.updatedAt)) {
    push(errors, "INVALID_DATE", "updatedAt",
      "updatedAt no es una fecha válida.", value.updatedAt);
  }

  return errors.length
    ? { ok: false, errors, warnings }
    : { ok: true, data: value as unknown as CatalogProductContract, warnings };
}
