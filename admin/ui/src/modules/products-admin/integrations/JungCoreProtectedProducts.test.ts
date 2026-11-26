import { describe, expect, it, vi, afterEach } from "vitest";
import {
  loadProtectedBrandProducts,
  protectedProductSchema,
  assertLegacyListingParity,
} from "./JungCoreProtectedProducts";

afterEach(() => vi.unstubAllGlobals());

const product = {
  id: "p-01", code: "CT-554", name: "Producto", slug: "producto", description: null,
  status: "ACTIVE", category: null, image: null,
  pricing: { currency: null, tiers: [] }, offer: null,
  inventory: { tracked: null, availabilityOverride: null, balances: [] },
  media: { primary: null, gallery: [] }, merchandising: null,
};

describe("CORE-SEC-01A lector protegido sin integración activa", () => {
  it("valida el contrato admin de lectura", () => {
    expect(protectedProductSchema.parse(product).code).toBe("CT-554");
  });
  it("bloquea paridad legacy no satisfecha", () => {
    expect(() => assertLegacyListingParity(protectedProductSchema.parse(product)))
      .toThrow(/WOOLY_ADMIN_PARITY_BLOCKED/);
  });
  it("incluye cookie, marca en URL y nunca agrega credenciales técnicas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [product] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const items = await loadProtectedBrandProducts("brand-01");
    expect(items).toHaveLength(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/catalog-commercial/brands/brand-01/products");
    expect(options.credentials).toBe("include");
    expect(options.headers).toEqual({ Accept: "application/json" });
  });
  it("bloquea falta de marca", async () => {
    await expect(loadProtectedBrandProducts(" ")).rejects.toThrow(/BRAND_REQUIRED/);
  });
});
