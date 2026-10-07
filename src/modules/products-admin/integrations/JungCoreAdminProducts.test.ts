import { describe, expect, it, vi } from "vitest";
import {
  JungCoreAdminProducts,
  adminProductSchema,
  mapAdminProduct,
} from "./JungCoreAdminProducts";
const raw = {
  id: "technical-uuid",
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
      sku: "USER-SKU",
      status: "borrador",
      img: "",
      price_1: 12.5,
    });
  });
  it("loads every CORE page with brand filtering and includes DRAFT", async () => {
    const client = new JungCoreAdminProducts("/core", "wooly");
    const request = vi
      .spyOn(client, "request")
      .mockResolvedValueOnce({ success: true, pages: 2, data: [raw] })
      .mockResolvedValueOnce({
        success: true,
        pages: 2,
        data: [{ ...raw, id: "other", sku: "OTHER" }],
      });
    expect(await client.list()).toHaveLength(2);
    expect(request.mock.calls.map((call) => call[0])).toEqual([
      "/products?brandSlug=wooly&limit=100&page=1",
      "/products?brandSlug=wooly&limit=100&page=2",
    ]);
  });
  it("fails visibly instead of falling back to a public or Sheets source", async () => {
    const client = new JungCoreAdminProducts("/core", "wooly");
    vi.spyOn(client, "request").mockRejectedValue(
      new Error("CORE unavailable"),
    );
    await expect(client.list()).rejects.toThrow("CORE unavailable");
  });
});
