import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
  validateCatalogProductContractV1,
  type CatalogProductContract,
} from ".";

function validContract(
  overrides: Partial<CatalogProductContract> = {},
): CatalogProductContract {
  return {
    contractVersion: CATALOG_PRODUCT_CONTRACT_VERSION,
    id: "product-1",
    sku: "SKU-1",
    slug: "product-1",
    brandId: "brand-1",
    categoryId: "flores",
    title: "Producto",
    description: "Descripción",
    campaignIds: ["campaign-1"],
    manualBadgeCodes: [],
    priority: 1,
    publicationStatus: "published",
    pricing: {
      currency: "PEN",
      volumePrices: [
        { id: "base", minimumQuantity: 1, unitPrice: 10 },
        { id: "tier", minimumQuantity: 3, unitPrice: 8 },
      ],
      offer: null,
    },
    inventory: {
      tracked: true,
      availableQuantity: 10,
      status: "available",
      updatedAt: null,
    },
    mediaAssets: [{
      id: "image-1",
      kind: "image",
      url: "https://example.com/image.jpg",
      thumbnailUrl: null,
      altText: "Producto",
      position: 1,
      isPrimary: true,
    }],
    updatedAt: null,
    ...overrides,
  };
}

function codes(value: unknown) {
  const result = validateCatalogProductContractV1(value);
  return result.ok === true
    ? []
    : result.errors.map((issue) => issue.code);
}

describe("validateCatalogProductContractV1", () => {
  it("acepta contrato v1 válido", () => {
    expect(validateCatalogProductContractV1(validContract())).toMatchObject({
      ok: true,
      data: expect.objectContaining({
        contractVersion: CATALOG_PRODUCT_CONTRACT_VERSION,
      }),
    });
  });

  it.each([
    ["ausente", undefined],
    ["v2", "catalog-product.v2"],
    ["sin versión", "catalog-product"],
    ["vacía", ""],
    ["null", null],
  ])("rechaza versión %s", (_case, contractVersion) => {
    const value = { ...validContract(), contractVersion };
    expect(codes(value)).toContain("INVALID_CONTRACT_VERSION");
  });

  it.each([
    ["id", { id: "" }],
    ["sku", { sku: "" }],
    ["title", { title: "" }],
  ])("rechaza %s vacío", (_case, override) => {
    expect(codes(validContract(override))).toContain("EMPTY_IDENTIFIER");
  });

  it("rechaza publicationStatus desconocido", () => {
    expect(codes({
      ...validContract(),
      publicationStatus: "future",
    })).toContain("UNKNOWN_ENUM_VALUE");
  });

  it.each([
    ["moneda vacía", { currency: "" }, "EMPTY_IDENTIFIER"],
    [
      "precio inválido",
      { currency: "PEN", volumePrices: [{ id: "x", minimumQuantity: 1, unitPrice: Infinity }], offer: null },
      "INVALID_PRICE",
    ],
    [
      "cantidad inválida",
      { currency: "PEN", volumePrices: [{ id: "x", minimumQuantity: 0, unitPrice: 1 }], offer: null },
      "INVALID_QUANTITY",
    ],
    [
      "tier duplicado",
      {
        currency: "PEN",
        volumePrices: [
          { id: "a", minimumQuantity: 3, unitPrice: 2 },
          { id: "b", minimumQuantity: 3, unitPrice: 1 },
        ],
        offer: null,
      },
      "DUPLICATE_VOLUME_TIER",
    ],
  ])("rechaza pricing: %s", (_case, pricing, expected) => {
    expect(codes(validContract({
      pricing: pricing as CatalogProductContract["pricing"],
    }))).toContain(expected);
  });

  it.each([
    ["fecha inicial", { unitPrice: 8, startsAt: "ayer", endsAt: null }, "INVALID_DATE"],
    ["fecha final", { unitPrice: 8, startsAt: null, endsAt: "mañana" }, "INVALID_DATE"],
    [
      "rango invertido",
      { unitPrice: 8, startsAt: "2026-12-31", endsAt: "2026-01-01" },
      "INVALID_DATE_RANGE",
    ],
  ])("rechaza oferta con %s", (_case, offer, expected) => {
    const base = validContract();
    expect(codes(validContract({
      pricing: { ...base.pricing, offer },
    }))).toContain(expected);
  });

  it("rechaza inventario inválido", () => {
    expect(codes(validContract({
      inventory: {
        tracked: true,
        availableQuantity: -1,
        status: "available",
        updatedAt: null,
      },
    }))).toContain("INVALID_INVENTORY");
  });

  it("rechaza URL de media y campaña inválidas", () => {
    const contract = validContract({
      mediaAssets: [{
        id: "x",
        kind: "image",
        url: "javascript:alert(1)",
        thumbnailUrl: null,
        altText: "",
        position: 1,
        isPrimary: true,
      }],
      campaignIds: [""],
    });
    expect(codes(contract)).toEqual(
      expect.arrayContaining(["INVALID_MEDIA_URL", "EMPTY_IDENTIFIER"]),
    );
  });
});
