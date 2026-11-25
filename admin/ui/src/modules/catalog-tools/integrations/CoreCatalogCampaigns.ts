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
const coreCampaignPageSchema = z.object({
  success: z.literal(true),
  page: z.number(),
  pages: z.number(),
  total: z.number(),
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
  const result: Campaign[] = [];
  let page = 1;
  let pages = 1;

  do {
    // Lectura administrativa, incluye borradores y publicados.
    // No utilizar el endpoint público ni Google Sheets.
    const response = coreCampaignPageSchema.parse(
      await jungCoreAdminProducts.request("/campaigns?page=" + page + "&limit=100"),
    );
    pages = response.pages;
    if (pages > 100 || response.page !== page) {
      throw new Error("Paginación de campañas CORE no válida.");
    }
    result.push(
      ...response.data.filter((item) => item.brandId === options.id).map(mapCoreCatalogCampaign),
    );
    page++;
  } while (page <= pages);
  return result.sort((a, b) => b.priority - a.priority);
}
