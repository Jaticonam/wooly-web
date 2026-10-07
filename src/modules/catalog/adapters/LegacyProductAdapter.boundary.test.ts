import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CATALOG_PRODUCT_CONTRACT_VERSION,
  type CatalogProductContract,
} from "@/shared/contracts/catalog";

import {
  adaptCatalogProductToLegacyProduct,
  mapCatalogProductToLegacyProduct,
  validateAndAdaptCatalogProductToLegacy,
} from "./LegacyProductAdapter";

function validContract(
  overrides: Partial<CatalogProductContract> = {},
): CatalogProductContract {
  return {
    contractVersion: CATALOG_PRODUCT_CONTRACT_VERSION,
    id: "product-1",
    code: "CT-554", barcode: "00123", sku: "SKU-1",
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

describe("LegacyProductAdapter boundary", () => {
  it.each([
    ["published", "publicado"],
    ["preorder", "preventa"],
    ["archived", "oculto"],
  ] as const)("mapea %s a %s", (publicationStatus, expected) => {
    const result = adaptCatalogProductToLegacyProduct(
      validContract({ publicationStatus }),
    );
    expect(result.product.status).toBe(expected);
  });

  it("degrada explícitamente un estado futuro sin crear un estado legacy", () => {
    const contract = {
      ...validContract(),
      publicationStatus: "future",
    } as unknown as CatalogProductContract;
    const result = adaptCatalogProductToLegacyProduct(contract);
    expect(result.product.status).toBe("oculto");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PUBLICATION_STATUS_DOWNGRADED" }),
      ]),
    );
  });

  it("impide adaptar una versión desconocida o contrato inválido", () => {
    expect(validateAndAdaptCatalogProductToLegacy({
      ...validContract(),
      contractVersion: "catalog-product.v2",
    })).toMatchObject({
      ok: false,
      errors: [{ code: "INVALID_CONTRACT_VERSION" }],
    });
    expect(validateAndAdaptCatalogProductToLegacy({
      ...validContract(),
      sku: "",
    })).toMatchObject({ ok: false });
  });

  it("conserva el Product de la fachada compatible", () => {
    const contract = validContract();
    expect(mapCatalogProductToLegacyProduct(contract)).toEqual(
      adaptCatalogProductToLegacyProduct(contract).product,
    );
  });

  it("registra identificador, moneda, marca y slug descartados", () => {
    const result = adaptCatalogProductToLegacyProduct(validContract());
    expect(result.product.id).toBe("product-1");
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
          "CURRENCY_NOT_REPRESENTED",
        "BRAND_DROPPED",
        "SLUG_DROPPED",
      ]),
    );
  });

  it("preserva tiers legacy y separa todos los arbitrarios", () => {
    const base = validContract();
    const contract = validContract({
      pricing: {
        ...base.pricing,
        volumePrices: [
          { id: "1", minimumQuantity: 1, unitPrice: 10 },
          { id: "3", minimumQuantity: 3, unitPrice: 9 },
          { id: "12", minimumQuantity: 12, unitPrice: 8 },
          { id: "50", minimumQuantity: 50, unitPrice: 7 },
          { id: "100", minimumQuantity: 100, unitPrice: 6 },
          { id: "6", minimumQuantity: 6, unitPrice: 8.5 },
          { id: "24", minimumQuantity: 24, unitPrice: 7.5 },
        ],
      },
    });
    const result = adaptCatalogProductToLegacyProduct(contract);
    expect(result.product).toMatchObject({
      price_1: 10,
      price_3: 9,
      price_12: 8,
      price_50: 7,
      price_100: 6,
    });
    expect(result.unsupportedVolumePrices.map((tier) => tier.minimumQuantity))
      .toEqual([6, 24]);
    expect(result.issues.filter((issue) =>
      issue.code === "UNSUPPORTED_VOLUME_TIER")).toHaveLength(2);
  });

  it("diagnostica precio base default y oferta descartada", () => {
    const base = validContract();
    const result = adaptCatalogProductToLegacyProduct(validContract({
      pricing: {
        ...base.pricing,
        volumePrices: [],
        offer: { unitPrice: 12, startsAt: null, endsAt: null },
      },
    }));
    expect(result.product.price_1).toBe(0);
    expect(result.product.price_offer).toBeNull();
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["BASE_PRICE_DEFAULTED", "OFFER_DROPPED"]),
    );
  });

  it("conserva oferta válida y diagnostica su ventana temporal", () => {
    const base = validContract();
    const result = adaptCatalogProductToLegacyProduct(validContract({
      pricing: {
        ...base.pricing,
        offer: {
          unitPrice: 8,
          startsAt: "2026-01-01",
          endsAt: "2026-12-31",
        },
      },
    }));
    expect(result.product.price_offer).toBe(8);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OFFER_WINDOW_DROPPED" }),
      ]),
    );
  });

  it.each([
    [12, 12, undefined],
    [12.9, 12, "INVENTORY_QUANTITY_ROUNDED"],
    [-2, 0, "INVENTORY_QUANTITY_ROUNDED"],
  ] as const)("reduce inventario tracked %s a %s", (quantity, stock, issue) => {
    const result = adaptCatalogProductToLegacyProduct(validContract({
      inventory: {
        tracked: true,
        availableQuantity: quantity,
        status: "available",
        updatedAt: null,
      },
    }));
    expect(result.product.stock).toBe(stock);
    if (issue) {
      expect(result.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: issue })]),
      );
    }
  });

  it("diagnostica inventario untracked y comingSoon", () => {
    const untracked = adaptCatalogProductToLegacyProduct(validContract({
      inventory: {
        tracked: false,
        availableQuantity: 20,
        status: "untracked",
        updatedAt: null,
      },
    }));
    expect(untracked.product.stock).toBeNull();
    expect(untracked.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "UNTRACKED_INVENTORY_REDUCED" }),
      ]),
    );

    const comingSoon = adaptCatalogProductToLegacyProduct(validContract({
      inventory: {
        tracked: true,
        availableQuantity: 0,
        status: "comingSoon",
        updatedAt: null,
      },
    }));
    expect(comingSoon.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVENTORY_STATUS_DOWNGRADED" }),
      ]),
    );
  });

  it("preserva imagen y galería, y diagnostica metadata", () => {
    const contract = validContract({
      mediaAssets: [
        ...validContract().mediaAssets,
        {
          id: "gallery",
          kind: "image",
          url: "https://example.com/gallery.jpg",
          thumbnailUrl: "https://example.com/thumb.jpg",
          altText: "Galería",
          position: 2,
          isPrimary: false,
        },
      ],
    });
    const result = adaptCatalogProductToLegacyProduct(contract);
    expect(result.product.img).toBe("https://example.com/image.jpg");
    expect(result.product.gallery).toBe("https://example.com/gallery.jpg");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MEDIA_METADATA_DROPPED" }),
      ]),
    );
  });

  it("no muta el contrato y conserva campañas", () => {
    const contract = validContract({
      campaignIds: ["c1", "c1", "c2"],
      updatedAt: "2026-01-01",
    });
    const before = structuredClone(contract);
    const result = adaptCatalogProductToLegacyProduct(contract);
    expect(contract).toEqual(before);
    expect(result.product.campaigns).toEqual(["c1", "c2"]);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "TIMESTAMPS_DROPPED" }),
      ]),
    );
  });
});
