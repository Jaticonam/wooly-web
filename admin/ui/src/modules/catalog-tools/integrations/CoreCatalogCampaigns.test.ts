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

  it("filtra por la marca Wooly, recorre páginas y nunca usa Sheets", async () => {
    const options = vi.spyOn(jungCoreAdminProducts, "options").mockResolvedValue({
      id: "wooly", name: "Wooly", categories: [],
    });
    const request = vi.spyOn(jungCoreAdminProducts, "request").mockImplementation(async (url) => ({
      success: true, page: Number(url.match(/page=(\d+)/)?.[1] ?? 0),
      pages: 2, total: 2, data: [{
        id: url.includes("page=1") ? "wooly-uuid" : "other-uuid",
        brandId: url.includes("page=1") ? "wooly" : "other",
        slug: "graduados", name: "Graduados", icon: "🎓", color: "Negro",
        startsAt: null, endsAt: null, priority: 50, publicationStatus: "DRAFT",
      }],
    }));
    try {
      const result = await listCoreCatalogCampaigns();
      expect(result.map((campaign) => campaign.id)).toEqual(["wooly-uuid"]);
      expect(request).toHaveBeenCalledTimes(2);
      expect(request.mock.calls[0][0]).toBe("/campaigns?page=1&limit=100");
    } finally { request.mockRestore(); options.mockRestore(); }
  });
});
