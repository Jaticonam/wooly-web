import { z } from "zod";
import type { Campaign } from "@wooly/contracts/types/product";
import { getCampaignComputedStatus } from "@wooly/contracts/catalog/domain/CampaignRules";
import { getCampaignThemeToken } from "@wooly/contracts/catalog/domain/CampaignTheme";
import { getCampaignColorClass } from "@wooly/contracts/catalog/domain/CampaignColorClass";
import { jungCoreAdminProducts } from "@/modules/products-admin/integrations/JungCoreAdminProducts";

// Se preserva el UUID técnico de CORE para que corresponda con product.campaigns.
const coreCampaignSchema = z.object({
  id: z.string().min(1),
  brandId: z.string().min(1),
  slug: z.string(),
  name: z.string(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  themeToken: z.string().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  priority: z.number(),
  publicationStatus: z.string(),
});
const coreCampaignListSchema = z.object({
  success: z.literal(true),
  data: z.array(coreCampaignSchema),
});
const coreOptionsSchema = z.object({
  id: z.string().min(1),
});

type CoreCampaign = z.infer<typeof coreCampaignSchema>;
export function mapCoreCatalogCampaign(raw: CoreCampaign): Campaign {
  const color = raw.color ?? "";
  const campaign: Campaign = {
    id: raw.id,
    name: raw.name,
    icon: raw.icon ?? "🏷️",
    color,
    themeToken: raw.themeToken || getCampaignThemeToken(color),
    colorClass: getCampaignColorClass(color),
    startDate: raw.startsAt?.slice(0, 10) ?? "",
    endDate: raw.endsAt?.slice(0, 10) ?? "",
    priority: raw.priority,
    publicationStatus: raw.publicationStatus,
    computedStatus: "borrador",
  };
  return { ...campaign, computedStatus: getCampaignComputedStatus(campaign) };
}

export async function listCoreCatalogCampaigns(): Promise<Campaign[]> {
  const options = coreOptionsSchema.parse(await jungCoreAdminProducts.options());
  // Endpoint protegido por marca: incluye borradores y campañas sin productos.
  // No consultar /campaigns global ni la vista pública de campañas.
  const response = coreCampaignListSchema.parse(
    await jungCoreAdminProducts.request(
      "/catalog-commercial/brands/" + encodeURIComponent(options.id) + "/campaigns",
    ),
  );
  if (response.data.some((item) => item.brandId !== options.id)) {
    throw new Error("JUNG CORE devolvió campañas de otra marca.");
  }
  return response.data
    .map(mapCoreCatalogCampaign)
    .sort((a, b) => b.priority - a.priority);
}
