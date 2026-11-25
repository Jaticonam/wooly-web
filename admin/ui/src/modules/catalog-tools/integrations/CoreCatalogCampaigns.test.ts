import { describe, expect, it, vi } from "vitest";
import { jungCoreAdminProducts } from "@/modules/products-admin/integrations/JungCoreAdminProducts";
import { listCoreCatalogCampaigns, mapCoreCatalogCampaign } from "./CoreCatalogCampaigns";

describe("Campañas administrativas JUNG CORE", () => {
  it("respeta UUID, fechas y estado borrador sin activar campañas", () => {
    const result = mapCoreCatalogCampaign({
      id: "uuid-core", brandId: "brand-wooly", slug: "san-valentin",
      name: "San Valentín", icon: "💕", color: "Fucsia",
      themeToken: null, startsAt: "2026-12-15T00:00:00.000Z",
      endsAt: "2027-02-10T00:00:00.000Z",
      priority: 50, publicationStatus: "DRAFT",
    });
    expect(result).toMatchObject({
      id: "uuid-core", startDate: "2026-12-15", endDate: "2027-02-10",
      themeToken: "campaign.fucsia", computedStatus: "borrador",
    });
  });

  it("consulta sólo la marca WOOLY por el endpoint protegido", async () => {
    const options = vi.spyOn(jungCoreAdminProducts, "options").mockResolvedValue({
      id: "wooly", name: "Wooly", categories: [],
    });
    const request = vi.spyOn(jungCoreAdminProducts, "request").mockResolvedValue({
      success: true,
      data: [{
        id: "campaign-uuid", brandId: "wooly", slug: "graduados",
        name: "Graduados", icon: "🎓", color: "Negro",
        startsAt: null, endsAt: null, priority: 50, publicationStatus: "DRAFT",
      }],
    });
    try {
      const result = await listCoreCatalogCampaigns();
      expect(result.map(item => item.id)).toEqual(["campaign-uuid"]);
      expect(request).toHaveBeenCalledOnce();
      expect(request).toHaveBeenCalledWith("/catalog-commercial/brands/wooly/campaigns");
    } finally { request.mockRestore(); options.mockRestore(); }
  });

  it("rechaza campañas ajenas aunque la API responda success", async () => {
    const options = vi.spyOn(jungCoreAdminProducts, "options").mockResolvedValue({
      id: "wooly", name: "Wooly", categories: [],
    });
    const request = vi.spyOn(jungCoreAdminProducts, "request").mockResolvedValue({
      success: true,
      data: [{
        id: "campaign-other", brandId: "other", slug: "other",
        name: "Otra marca", icon: null, color: null,
        startsAt: null, endsAt: null, priority: 0, publicationStatus: "DRAFT",
      }],
    });
    try {
      await expect(listCoreCatalogCampaigns()).rejects.toThrow("otra marca");
    } finally { request.mockRestore(); options.mockRestore(); }
  });
});
