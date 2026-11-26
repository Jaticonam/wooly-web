import { describe, expect, it } from "vitest";
import { mapProtectedAdminProduct } from "./JungCoreProtectedProductAdapter";
import { protectedProductSchema } from "./JungCoreProtectedProducts";

const item = {
  id: "p1", code: "CT-554", barcode: "123", sunatCode: "S-1", sku: null,
  name: "Osito", slug: "osito", description: null, status: "DRAFT",
  campaigns: [{ campaignId: "c1" }],
  category: { id: "cat1", code: "PEL", name: "Peluches", status: "ACTIVE" },
  image: { url: "https://example.com/image.webp", thumbnailUrl: null, altText: "" },
  pricing: { currency: "PEN", tiers: [{ minimumQuantity: 1, unitPrice: 14 }] },
  offer: null,
  inventory: { tracked: true, availabilityOverride: null, balances: [{ onHand: 2, reserved: 1, available: 1 }] },
  media: { primary: null, gallery: [] },
  merchandising: { priority: 1, badges: [{ code: "graduacion", label: null, active: true }] },
};

describe("CORE-SEC-01C adaptador protegido, sin activacion", () => {
  it("mapea precios, campaña, imagen, categoria e identificadores", () => {
    const product = mapProtectedAdminProduct(protectedProductSchema.parse(item), [{ id: "cat1", slug: "peluches", name: "Peluches" }]);
    expect(product).toMatchObject({ code: "CT-554", barcode: "123", sunatCode: "S-1", price_1: 14, category: "peluches", stock: 1, campaigns: ["c1"] });
    expect(product.img).toContain("image.webp");
  });
  it("bloquea respuesta sin SKU explicito", () => {
    const { sku: _sku, ...withoutSku } = item;
    expect(() => mapProtectedAdminProduct(protectedProductSchema.parse(withoutSku), [])).toThrow();
  });
  it("bloquea categoria desconocida", () => {
    expect(() => mapProtectedAdminProduct(protectedProductSchema.parse(item), [])).toThrow(/CATEGORY_PARITY/);
  });
});
