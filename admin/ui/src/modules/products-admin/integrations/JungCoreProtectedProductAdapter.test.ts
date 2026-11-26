import { describe, expect, it } from "vitest";
import { mapProtectedAdminProduct } from "./JungCoreProtectedProductAdapter";
import { protectedProductSchema } from "./JungCoreProtectedProducts";

const principal = {
  assetId: "asset-01",
  url: "https://example.com/official-01.webp",
  thumbnailUrl: null,
  altText: "Principal",
  role: "PRIMARY",
  position: 1,
  isPrimary: true,
  origin: "MEDIA_ASSET",
  temporarySource: null,
  assetStatus: "ACTIVE",
};

const secondary = {
  ...principal,
  assetId: "asset-02",
  url: "https://example.com/official-02.webp",
  role: "GALLERY",
  position: 2,
  isPrimary: false,
};

const third = {
  ...secondary,
  assetId: "asset-03",
  url: "https://example.com/official-03.webp",
  position: 3,
};

const item = {
  id: "p1", code: "CT-554", barcode: "123", sunatCode: "S-1", sku: null,
  name: "Osito", slug: "osito", description: null, status: "DRAFT",
  campaigns: [{ campaignId: "c1" }],
  category: { id: "cat1", code: "PEL", name: "Peluches", status: "ACTIVE" },
  image: { url: "https://example.com/image.webp", thumbnailUrl: null, altText: "" },
  pricing: { currency: "PEN", tiers: [{ minimumQuantity: 1, unitPrice: 14 }] },
  offer: null,
  inventory: { tracked: true, availabilityOverride: null, balances: [{ onHand: 2, reserved: 1, available: 1 }] },
  media: { primary: principal, gallery: [third, secondary] },
  merchandising: { priority: 1, badges: [{ code: "graduacion", label: null, active: true }] },
};

describe("CORE-SEC-01C adaptador protegido, sin activacion", () => {
  it("mapea precios, campaña, imagen, categoria e identificadores", () => {
    const product = mapProtectedAdminProduct(protectedProductSchema.parse(item), [{ id: "cat1", slug: "peluches", name: "Peluches" }]);
    expect(product).toMatchObject({ code: "CT-554", barcode: "123", sunatCode: "S-1", price_1: 14, category: "peluches", stock: 1, campaigns: ["c1"] });
    expect(product.img).toBe(principal.url);
    expect(product.gallery).toBe(
      `${secondary.url}|${third.url}`,
    );
    expect(product.media).toEqual({
      primary: principal,
      gallery: [secondary, third],
    });
  });
  it("bloquea respuesta sin SKU explicito", () => {
    const { sku: _sku, ...withoutSku } = item;
    expect(() => mapProtectedAdminProduct(protectedProductSchema.parse(withoutSku), [])).toThrow();
  });
  it("bloquea categoria desconocida", () => {
    expect(() => mapProtectedAdminProduct(protectedProductSchema.parse(item), [])).toThrow(/CATEGORY_PARITY/);
  });
});


describe("W-FM-01A canonical media", () => {
  const categories = [
    { id: "cat1", slug: "peluches", name: "Peluches" },
  ];

  it("never substitutes legacy image for missing primary", () => {
    const raw = protectedProductSchema.parse({
      ...item,
      media: { primary: null, gallery: [secondary] },
    });

    const product = mapProtectedAdminProduct(raw, categories);

    expect(product.img).toBe("");
    expect(product.gallery).toBe(secondary.url);
    expect(product.media?.primary).toBeNull();
  });

  it("does not invent assets for products without media", () => {
    const raw = protectedProductSchema.parse({
      ...item,
      media: { primary: null, gallery: [] },
    });

    const product = mapProtectedAdminProduct(raw, categories);

    expect(product.img).toBe("");
    expect(product.gallery).toBe("");
    expect(product.media?.gallery).toEqual([]);
  });

  it("rejects incomplete canonical asset identity", () => {
    expect(() => protectedProductSchema.parse({
      ...item,
      media: {
        primary: { url: principal.url },
        gallery: [],
      },
    })).toThrow();
  });
});