import type {
  CatalogContractIssue,
  CatalogProductContract,
  CatalogVolumePriceContract,
} from "@/shared/contracts/catalog";
import {
  validateCatalogProductContractV1,
} from "@/shared/contracts/catalog";

import type {
  Product,
} from "@/shared/types/product";

/* =========================================================
   TIPOS
   ========================================================= */

export interface CatalogProductCompatibilityResult {
  product: Product;
  issues: readonly LegacyAdaptationIssue[];

  /**
   * Escalas válidas de JUNG CORE que la interfaz legacy
   * todavía no puede representar mediante price_1,
   * price_3, price_12, price_50 o price_100.
   */
  unsupportedVolumePrices:
    readonly CatalogVolumePriceContract[];
}

export type LegacyAdaptationIssueCode =
  | "IDENTIFIER_REPLACED_BY_SKU"
  | "CURRENCY_NOT_REPRESENTED"
  | "OFFER_WINDOW_DROPPED"
  | "OFFER_DROPPED"
  | "UNSUPPORTED_VOLUME_TIER"
  | "INVENTORY_STATUS_DOWNGRADED"
  | "UNTRACKED_INVENTORY_REDUCED"
  | "INVENTORY_QUANTITY_ROUNDED"
  | "MEDIA_METADATA_DROPPED"
  | "BRAND_DROPPED"
  | "SLUG_DROPPED"
  | "TIMESTAMPS_DROPPED"
  | "BASE_PRICE_DEFAULTED"
  | "PUBLICATION_STATUS_DOWNGRADED";

export interface LegacyAdaptationIssue {
  code: LegacyAdaptationIssueCode;
  path: string;
  message: string;
  value?: string | number | boolean | null;
}

export type ValidatedLegacyProductAdaptationResult =
  | {
      ok: true;
      data: CatalogProductCompatibilityResult;
    }
  | {
      ok: false;
      errors: readonly CatalogContractIssue[];
    };

/* =========================================================
   CONFIGURACIÓN LEGACY
   ========================================================= */

const LEGACY_VOLUME_PRICE_QUANTITIES =
  new Set([
    1,
    3,
    12,
    50,
    100,
  ]);

const LEGACY_PRODUCT_STATUS = {
  draft: "borrador",
  published: "publicado",
  hidden: "oculto",
  preorder: "preventa",
  archived: "oculto",
} satisfies Record<
  CatalogProductContract["publicationStatus"],
  string
>;

function adaptationIssue(
  code: LegacyAdaptationIssueCode,
  path: string,
  message: string,
  value?: string | number | boolean | null,
): LegacyAdaptationIssue {
  return { code, path, message, value };
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

function uniqueStrings(
  values: readonly string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(cleanText)
        .filter(Boolean),
    ),
  );
}

function normalizeUnitPrice(
  value: unknown,
): number | null {
  const unitPrice =
    Number(value);

  return (
    Number.isFinite(unitPrice) &&
    unitPrice > 0
  )
    ? unitPrice
    : null;
}

function findUnitPrice(
  contract:
    CatalogProductContract,
  minimumQuantity:
    number,
): number | null {
  const volumePrice =
    contract.pricing
      .volumePrices
      .find(
        (candidate) =>
          candidate.minimumQuantity ===
          minimumQuantity,
      );

  return normalizeUnitPrice(
    volumePrice?.unitPrice,
  );
}

function normalizeStock(
  value: unknown,
): number | null {
  const stock =
    Number(value);

  if (
    !Number.isFinite(stock)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.floor(stock),
  );
}

function getLegacyImageUrls(
  contract:
    CatalogProductContract,
): string[] {
  const imageAssets =
    [...contract.mediaAssets]
      .filter(
        (asset) =>
          asset.kind === "image" &&
          cleanText(asset.url),
      )
      .sort(
        (a, b) =>
          Number(b.isPrimary) -
            Number(a.isPrimary) ||
          a.position -
            b.position ||
          a.id.localeCompare(
            b.id,
          ),
      );

  return uniqueStrings(
    imageAssets.map(
      (asset) =>
        asset.url,
    ),
  );
}

/* =========================================================
   ADAPTADOR
   ========================================================= */

export function adaptCatalogProductToLegacyProduct(
  contract:
    CatalogProductContract,
): CatalogProductCompatibilityResult {
  const issues: LegacyAdaptationIssue[] = [];
  const basePrice =
    findUnitPrice(
      contract,
      1,
    ) ?? 0;
  if (basePrice === 0) {
    issues.push(adaptationIssue(
      "BASE_PRICE_DEFAULTED",
      "pricing.volumePrices",
      "No existe un precio base representable para cantidad 1; se usa 0.",
    ));
  }

  const rawOfferPrice =
    normalizeUnitPrice(
      contract.pricing
        .offer
        ?.unitPrice,
    );

  const offerPrice =
    rawOfferPrice !== null &&
    basePrice > 0 &&
    rawOfferPrice < basePrice
      ? rawOfferPrice
      : null;
  if (contract.pricing.offer && offerPrice === null) {
    issues.push(adaptationIssue(
      "OFFER_DROPPED",
      "pricing.offer.unitPrice",
      "La oferta no es representable como descuento legacy.",
      contract.pricing.offer.unitPrice,
    ));
  }
  if (
    contract.pricing.offer &&
    (
      contract.pricing.offer.startsAt !== null ||
      contract.pricing.offer.endsAt !== null
    )
  ) {
    issues.push(adaptationIssue(
      "OFFER_WINDOW_DROPPED",
      "pricing.offer",
      "Product no representa la ventana temporal de la oferta.",
    ));
  }

  const imageUrls =
    getLegacyImageUrls(
      contract,
    );

  const product: Product = {
    // Preserve CORE UUID for relationships, selection, routes and cart lines.
    id: cleanText(contract.id),
    code: contract.code ?? null,
    barcode: contract.barcode ?? null,
    sku: contract.sku,

    title:
      cleanText(
        contract.title,
      ),

    description:
      cleanText(
        contract.description,
      ),

    category:
      cleanText(
        contract.categoryId,
      ),

    price_1:
      basePrice,

    price_3:
      findUnitPrice(
        contract,
        3,
      ),

    price_12:
      findUnitPrice(
        contract,
        12,
      ),

    price_50:
      findUnitPrice(
        contract,
        50,
      ),

    price_100:
      findUnitPrice(
        contract,
        100,
      ),

    price_offer:
      offerPrice,

    stock:
      contract.inventory
        .tracked
        ? normalizeStock(
            contract.inventory
              .availableQuantity,
          )
        : null,

    img:
      imageUrls[0] ?? "",

    gallery:
      imageUrls.length > 1
        ? imageUrls
            .slice(1)
            .join("|")
        : undefined,

    status:
      LEGACY_PRODUCT_STATUS[
        contract.publicationStatus
      ],

    badges:
      uniqueStrings(
        contract.manualBadgeCodes,
      ),

    campaigns:
      uniqueStrings(
        contract.campaignIds,
      ),

    priority:
      Number.isFinite(
        contract.priority,
      )
        ? contract.priority
        : 0,
  };

  const unsupportedVolumePrices =
    contract.pricing
      .volumePrices
      .filter(
        (volumePrice) =>
          !LEGACY_VOLUME_PRICE_QUANTITIES
            .has(
              volumePrice
                .minimumQuantity,
            ),
      );

  if (cleanText(contract.id) !== product.id) {
    issues.push(adaptationIssue(
      "IDENTIFIER_REPLACED_BY_SKU",
      "id",
      "Product.id debe conservar el ID canónico.",
      contract.id,
    ));
  }
  issues.push(adaptationIssue(
    "CURRENCY_NOT_REPRESENTED",
    "pricing.currency",
    "Product no representa la moneda del contrato.",
    contract.pricing.currency,
  ));
  unsupportedVolumePrices.forEach((tier) => {
    issues.push(adaptationIssue(
      "UNSUPPORTED_VOLUME_TIER",
      "pricing.volumePrices",
      "El tier no tiene una escala equivalente en Product.",
      tier.minimumQuantity,
    ));
  });

  if (
    contract.inventory.status === "comingSoon" ||
    (
      contract.inventory.status !== "available" &&
      contract.inventory.status !== "outOfStock" &&
      contract.inventory.status !== "untracked"
    )
  ) {
    issues.push(adaptationIssue(
      "INVENTORY_STATUS_DOWNGRADED",
      "inventory.status",
      "El estado de inventario no tiene representación equivalente en Product.",
      contract.inventory.status,
    ));
  }
  if (!contract.inventory.tracked) {
    issues.push(adaptationIssue(
      "UNTRACKED_INVENTORY_REDUCED",
      "inventory",
      "El inventario no rastreado se reduce a stock null.",
    ));
  } else if (
    contract.inventory.availableQuantity !== null &&
    normalizeStock(contract.inventory.availableQuantity) !==
      contract.inventory.availableQuantity
  ) {
    issues.push(adaptationIssue(
      "INVENTORY_QUANTITY_ROUNDED",
      "inventory.availableQuantity",
      "La cantidad se redondea hacia abajo y se limita a cero.",
      contract.inventory.availableQuantity,
    ));
  }
  if (contract.mediaAssets.some((asset) =>
    asset.altText || asset.thumbnailUrl || asset.kind !== "image"
  )) {
    issues.push(adaptationIssue(
      "MEDIA_METADATA_DROPPED",
      "mediaAssets",
      "Product conserva URLs de imágenes, pero no toda su metadata.",
    ));
  }
  if (cleanText(contract.brandId)) {
    issues.push(adaptationIssue(
      "BRAND_DROPPED", "brandId", "Product no representa brandId.",
      contract.brandId,
    ));
  }
  if (cleanText(contract.slug)) {
    issues.push(adaptationIssue(
      "SLUG_DROPPED", "slug", "Product no representa el slug canónico.",
      contract.slug,
    ));
  }
  if (contract.updatedAt || contract.inventory.updatedAt) {
    issues.push(adaptationIssue(
      "TIMESTAMPS_DROPPED",
      "updatedAt",
      "Product no representa timestamps del contrato.",
    ));
  }
  if (!(contract.publicationStatus in LEGACY_PRODUCT_STATUS)) {
    issues.push(adaptationIssue(
      "PUBLICATION_STATUS_DOWNGRADED",
      "publicationStatus",
      "El estado futuro se degrada a oculto.",
      contract.publicationStatus,
    ));
    product.status = "oculto";
  }

  return {
    product,
    issues,
    unsupportedVolumePrices,
  };
}

export function validateAndAdaptCatalogProductToLegacy(
  value: unknown,
): ValidatedLegacyProductAdaptationResult {
  const validation = validateCatalogProductContractV1(value);
  if (validation.ok === false) {
    return { ok: false, errors: validation.errors };
  }
  return {
    ok: true,
    data: adaptCatalogProductToLegacyProduct(validation.data),
  };
}

/**
 * Atajo para consumidores que solo necesitan
 * el modelo operativo de Wooly.
 */
export function mapCatalogProductToLegacyProduct(
  contract:
    CatalogProductContract,
): Product {
  return adaptCatalogProductToLegacyProduct(
    contract,
  ).product;
}
