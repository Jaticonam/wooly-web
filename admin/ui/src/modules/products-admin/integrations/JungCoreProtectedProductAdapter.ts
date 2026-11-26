import { z } from "zod";
import type { Product } from "@wooly/contracts/types/product";
import { assertLegacyListingParity, type ProtectedProduct } from "./JungCoreProtectedProducts";

const commercialProductSchema = z.object({
  id: z.string().min(1),
  code: z.string().nullable(),
  barcode: z.string().nullable(),
  sunatCode: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  sku: z.string().nullable(),
  category: z.object({ id: z.string() }).nullable(),
  image: z.object({ url: z.string() }).nullable(),
  campaigns: z.array(z.object({ campaignId: z.string() })),
  pricing: z.object({ tiers: z.array(z.object({ minimumQuantity: z.number(), unitPrice: z.number() })) }),
  offer: z.object({ unitPrice: z.number(), status: z.string() }).nullable(),
  inventory: z.object({ balances: z.array(z.object({ available: z.number() })) }),
  merchandising: z.object({ priority: z.number(), badges: z.array(z.object({ code: z.string() })) }).nullable(),
}).passthrough();

export interface ProtectedCategory { id: string; slug: string; name: string }

/**
 * Fail-closed: no se genera SKU ni slug a partir de valores aproximados.
 * La ruta administrativa debe incluir sku explícitamente antes de activarse.
 */
export function mapProtectedAdminProduct(
  raw: ProtectedProduct,
  categories: readonly ProtectedCategory[],
): Product {
  assertLegacyListingParity(raw);
  const data = commercialProductSchema.parse(raw);
  const category = data.category
    ? categories.find((entry) => entry.id === data.category?.id)
    : undefined;
  if (data.category && !category) throw new Error("WOOLY_ADMIN_CATEGORY_PARITY_BLOCKED");
  const tiers = new Map(data.pricing.tiers.map(tier => [tier.minimumQuantity, tier.unitPrice]));
  const status = ({ DRAFT: "borrador", HIDDEN: "oculto", INACTIVE: "oculto", ACTIVE: "publicado", PUBLISHED: "publicado", PREORDER: "preventa", OUT_OF_STOCK: "agotado" } as Record<string, string>)[data.status] ?? data.status.toLowerCase();
  return {
    id: data.id,
    code: data.code,
    barcode: data.barcode,
    sunatCode: data.sunatCode,
    sku: data.sku,
    title: data.name,
    description: data.description ?? "",
    category: category?.slug ?? "",
    price_1: tiers.get(1) ?? 0,
    price_3: tiers.get(3),
    price_12: tiers.get(12),
    price_50: tiers.get(50),
    price_100: tiers.get(100),
    price_offer: data.offer?.status === "ACTIVE" ? data.offer.unitPrice : null,
    stock: data.inventory.balances.length
      ? data.inventory.balances.reduce((sum, balance) => sum + Math.max(0, balance.available), 0)
      : null,
    img: data.image?.url ?? "",
    status,
    priority: data.merchandising?.priority ?? 0,
    badges: data.merchandising?.badges.map(badge => badge.code) ?? [],
    campaigns: data.campaigns.map(relation => relation.campaignId),
  };
}
