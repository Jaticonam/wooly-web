import { describe, expect, it, vi } from "vitest";
import {
  JungCoreAdminProducts,
  adminProductSchema,
  mapAdminProduct,
} from "./JungCoreAdminProducts";
const raw = {
  id: "technical-uuid",
  code: "CT-554", barcode: "00123", sunatCode: "10101501",
  sku: "USER-SKU",
  name: "New draft",
  description: null,
  status: "DRAFT",
  category: { id: "category", name: "Flores", slug: "flores" },
  priceTiers: [{ minimumQuantity: 1, unitPrice: "12.50" }],
  assets: [],
  inventoryBalances: [],
  campaigns: [],
};
describe("CORE administrative products", () => {
  it("maps DRAFT, declared SKU and stable productId without requiring an image", () => {
    const product = mapAdminProduct(adminProductSchema.parse(raw));
    expect(product).toMatchObject({
      id: "technical-uuid",
      code: "CT-554", barcode: "00123", sunatCode: "10101501",
  sku: "USER-SKU",
      status: "borrador",
      img: "",
      price_1: 12.5,
    });
  });
  it("loads the protected commercial admin collection including all 194 drafts", async () => {
    const client = new JungCoreAdminProducts("/core", "wooly");
    const commercial = {
      ...raw,
      category: { id: "category", code: "FLORES", name: "Flores" },
      image: null,
      pricing: { tiers: [{ minimumQuantity: 1, unitPrice: 12.5 }] },
      offer: null,
      inventory: { balances: [] },
      merchandising: { priority: 3, badges: [{ code: "nuevo" }] },
    };
    const request = vi.spyOn(client, "request")
      .mockResolvedValueOnce({ success: true, data: {
        id: "brand-id", name: "Wooly", categories: [raw.category],
      } })
      .mockResolvedValueOnce({ success: true, data: Array.from({ length: 194 }, (_, index) => ({
        ...commercial, id: "product-" + index,
      })) });
    const products = await client.list();
    expect(products).toHaveLength(194);
    expect(products[0]).toMatchObject({
      id: "product-0", status: "borrador", category: "flores", price_1: 12.5, img: "", priority: 3, badges: ["nuevo"],
    });
    expect(request.mock.calls.map(call => call[0])).toEqual([
      "/products/admin-options?brandSlug=wooly",
      "/catalog-commercial/brands/brand-id/products",
    ]);
  });
  it("never falls back to the public endpoint if commercial admin rejects the session", async () => {
    const client = new JungCoreAdminProducts("/core", "wooly");
    const request = vi.spyOn(client, "request")
      .mockResolvedValueOnce({ success: true, data: { id: "brand-id", name: "Wooly", categories: [] } })
      .mockRejectedValueOnce(new Error("HTTP 403"));
    await expect(client.list()).rejects.toThrow("HTTP 403");
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("fails visibly instead of falling back to a public or Sheets source", async () => {
    const client = new JungCoreAdminProducts("/core", "wooly");
    vi.spyOn(client, "request").mockRejectedValue(
      new Error("CORE unavailable"),
    );
    await expect(client.list()).rejects.toThrow("CORE unavailable");
  });
});
