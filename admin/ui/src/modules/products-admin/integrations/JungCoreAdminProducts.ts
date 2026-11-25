import { z } from "zod";
import { requestJson } from "@wooly/shared/infrastructure/http";
import type { Product } from "@wooly/contracts/types/product";
const assetSchema = z.object({
  publicUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
});
export const adminProductSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  sunatCode: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  category: z
    .object({ id: z.string(), name: z.string(), slug: z.string() })
    .nullable(),
  campaigns: z.array(z.object({ campaignId: z.string() })).default([]),
  assets: z
    .array(z.object({ isPrimary: z.boolean(), asset: assetSchema }))
    .default([]),
  priceTiers: z
    .array(
      z.object({
        minimumQuantity: z.number(),
        unitPrice: z.union([z.number(), z.string()]),
      }),
    )
    .default([]),
  offers: z
    .array(
      z.object({
        unitPrice: z.union([z.number(), z.string()]),
        startsAt: z.string().nullable(),
        endsAt: z.string().nullable(),
      }),
    )
    .default([]),
  inventoryBalances: z
    .array(z.object({ onHand: z.number(), reserved: z.number() }))
    .default([]),
  merchandising: z
    .object({ priority: z.number(), manualBadgeCodes: z.array(z.string()) })
    .nullable()
    .optional(),
});
export function mapAdminProduct(
  raw: z.infer<typeof adminProductSchema>,
): Product {
  const tiers = new Map(
    raw.priceTiers.map((tier) => [
      tier.minimumQuantity,
      Number(tier.unitPrice),
    ]),
  );
  const primary = raw.assets.find((relation) => relation.isPrimary)?.asset;
  const now = Date.now(),
    offer = raw.offers.find(
      (value) =>
        (!value.startsAt || Date.parse(value.startsAt) <= now) &&
        (!value.endsAt || Date.parse(value.endsAt) > now),
    );
  return {
    id: raw.id,
    code: raw.code ?? null,
    barcode: raw.barcode ?? null,
    sunatCode: raw.sunatCode ?? null,
    sku: raw.sku,
    title: raw.name,
    description: raw.description ?? "",
    category: raw.category?.slug ?? "",
    price_1: tiers.get(1) ?? 0,
    price_3: tiers.get(3),
    price_12: tiers.get(12),
    price_50: tiers.get(50),
    price_100: tiers.get(100),
    price_offer: offer ? Number(offer.unitPrice) : null,
    stock: raw.inventoryBalances.length
      ? raw.inventoryBalances.reduce(
          (n, b) => n + Math.max(0, b.onHand - b.reserved),
          0,
        )
      : null,
    img: primary?.publicUrl ?? primary?.thumbnailUrl ?? "",
    status:
      (
        {
          DRAFT: "borrador",
          HIDDEN: "oculto",
          INACTIVE: "oculto",
          ACTIVE: "publicado",
          PUBLISHED: "publicado",
          PREORDER: "preventa",
          OUT_OF_STOCK: "agotado",
        } as Record<string, string>
      )[raw.status] ?? raw.status.toLowerCase(),
    priority: raw.merchandising?.priority ?? 0,
    badges: raw.merchandising?.manualBadgeCodes ?? [],
    campaigns: raw.campaigns.map((relation) => relation.campaignId),
  };
}
export const adminOptionsSchema = z.object({
  id: z.string(),
  name: z.string(),
  categories: z.array(
    z.object({ id: z.string(), name: z.string(), slug: z.string() }),
  ),
});
/** Contrato administrativo protegido de CORE, no la proyección pública /products. */
const commercialAdminProductSchema = z.object({
  id: z.string(),
  code: z.string().nullable(),
  barcode: z.string().nullable(),
  sunatCode: z.string().nullable(),
  sku: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  category: z.object({ id: z.string(), code: z.string(), name: z.string() }).nullable(),
  campaigns: z.array(z.object({ campaignId: z.string() })),
  image: z.object({ url: z.string(), thumbnailUrl: z.string().nullable() }).nullable(),
  pricing: z.object({
    tiers: z.array(z.object({ minimumQuantity: z.number(), unitPrice: z.number() })),
  }),
  offer: z.object({
    unitPrice: z.number(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    status: z.string(),
  }).nullable(),
  inventory: z.object({ balances: z.array(z.object({ onHand: z.number(), reserved: z.number() })) }),
  merchandising: z.object({
    priority: z.number(),
    badges: z.array(z.object({ code: z.string() })),
  }).nullable(),
});

function mapCommercialAdminProduct(
  raw: z.infer<typeof commercialAdminProductSchema>,
  categories: z.infer<typeof adminOptionsSchema>["categories"],
): Product {
  const category = raw.category;
  const option = categories.find(item => item.id === category?.id);
  return mapAdminProduct({
    id: raw.id, code: raw.code, barcode: raw.barcode, sunatCode: raw.sunatCode,
    sku: raw.sku, name: raw.name, description: raw.description, status: raw.status,
    category: category ? { id: category.id, name: category.name, slug: option?.slug ?? category.code } : null,
    campaigns: raw.campaigns,
    assets: raw.image ? [{ isPrimary: true, asset: { publicUrl: raw.image.url, thumbnailUrl: raw.image.thumbnailUrl } }] : [],
    priceTiers: raw.pricing.tiers,
    offers: raw.offer?.status === "ACTIVE" ? [raw.offer] : [],
    inventoryBalances: raw.inventory.balances,
    merchandising: raw.merchandising ? {
      priority: raw.merchandising.priority,
      manualBadgeCodes: raw.merchandising.badges.map(badge => badge.code),
    } : null,
  });
}
export class JungCoreAdminProducts {
  constructor(
    private base = String(
      import.meta.env.VITE_JUNG_CORE_API_BASE_URL ?? "/jung-core",
    ).replace(/\/+$/, ""),
    private brand = String(
      import.meta.env.VITE_JUNG_CORE_BRAND_SLUG ?? "wooly",
    ),
  ) {}
  async request(endpoint: string, body?: unknown): Promise<unknown> {
    const response = await requestJson<unknown>(this.base + endpoint, {
      source: "JUNG CORE Productos Admin",
      method: body === undefined ? "GET" : "POST",
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    if (!response.ok) throw new Error(response.error.message);
    return response.data;
  }
  async options() {
    return adminOptionsSchema.parse(
      z
        .object({ success: z.literal(true), data: z.unknown() })
        .parse(
          await this.request(
            "/products/admin-options?brandSlug=" +
              encodeURIComponent(this.brand),
          ),
        ).data,
    );
  }
  async list(): Promise<Product[]> {
    const brand = await this.options();
    const result = z.object({
      success: z.literal(true),
      data: z.array(commercialAdminProductSchema),
    }).parse(await this.request(
      "/catalog-commercial/brands/" + encodeURIComponent(brand.id) + "/products",
    ));
    return result.data.map(product => mapCommercialAdminProduct(product, brand.categories));
  }
}
export const jungCoreAdminProducts = new JungCoreAdminProducts();
