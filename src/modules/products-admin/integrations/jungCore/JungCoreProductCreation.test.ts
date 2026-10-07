import { afterEach, describe, expect, it, vi } from "vitest";
import {
  JungCoreProductCreation,
  type CreateCanonicalProductInput,
} from "./JungCoreProductCreation";

const product = {
  id: "core-id",
  sku: "CORE-SKU",
  name: "Nuevo",
  status: "DRAFT",
  brandId: "brand-1",
  categoryId: "category-1",
};
function response(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  });
}
afterEach(() => vi.unstubAllGlobals());
describe("JungCoreProductCreation", () => {
  it("posts only user fields through the shared HTTP client and renders CORE identity", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(product));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new JungCoreProductCreation("/jung-core", "wooly");
    const result = await provider.create({
      name: " Nuevo ",
      description: " Texto ",
      brandId: "brand-1",
      categoryId: "category-1",
      sku: "INJECTED",
      status: "ACTIVE",
      tiers: [{ minimumQuantity: 1, unitPrice: 10 }],
    } as CreateCanonicalProductInput);
    expect(result.sku).toBe("CORE-SKU");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/jung-core/products");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      name: "Nuevo",
      description: "Texto",
      brandId: "brand-1",
      categoryId: "category-1",
      tiers: [{ minimumQuantity: 1, unitPrice: 10 }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("loads canonical options for the configured brand", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        response({
          id: "brand-1",
          name: "Wooly",
          categories: [{ id: "category-1", name: "Flores" }],
          priceLists: [],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const options = await new JungCoreProductCreation(
      "/jung-core/",
      "wooly",
    ).loadOptions();
    expect(options.categories[0].id).toBe("category-1");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/jung-core/products/creation-options?brandSlug=wooly",
    );
  });
  it("reports HTTP validation failures without retrying POST", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      new JungCoreProductCreation().create({
        name: "Nuevo",
        brandId: "b",
        categoryId: "c",
      }),
    ).rejects.toThrow("CORE rechazó los datos");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("treats connection failure as uncertain and does not automatically create again", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("connection lost"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      new JungCoreProductCreation().create({
        name: "Nuevo",
        brandId: "b",
        categoryId: "c",
      }),
    ).rejects.toThrow("Verifica en CORE");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("rejects success responses without a returned SKU", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ ...product, sku: undefined })),
    );
    await expect(
      new JungCoreProductCreation().create({
        name: "Nuevo",
        brandId: "b",
        categoryId: "c",
      }),
    ).rejects.toThrow("identidad válida");
  });
});
