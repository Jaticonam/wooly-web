import { z } from "zod";
import { resolveAdminCoreUrl } from "@/modules/admin-auth/services/AdminAuthClient";

/**
 * WOOLY-ADMIN-CORE-SEC-01A — lector autenticado aislado.
 * No sustituye el contrato legacy hasta completar la paridad comercial.
 */
export const protectedProductSchema = z.object({
  id: z.string().min(1),
  code: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  category: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    status: z.string(),
  }).nullable(),
  image: z.object({
    url: z.string(),
    thumbnailUrl: z.string().nullable(),
    altText: z.string(),
  }).nullable(),
  pricing: z.object({
    currency: z.string().nullable(),
    tiers: z.array(z.object({ minimumQuantity: z.number(), unitPrice: z.number() })),
  }),
  offer: z.object({
    unitPrice: z.number(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    status: z.string(),
  }).nullable(),
  inventory: z.object({
    tracked: z.boolean().nullable(),
    availabilityOverride: z.string().nullable(),
    balances: z.array(z.object({
      onHand: z.number(), reserved: z.number(), available: z.number(),
    }).passthrough()),
  }),
  media: z.object({
    primary: z.object({ url: z.string() }).passthrough().nullable(),
    gallery: z.array(z.object({ url: z.string() }).passthrough()),
  }),
  merchandising: z.object({
    priority: z.number(),
    badges: z.array(z.object({ code: z.string(), label: z.string().nullable(), active: z.boolean() })),
  }).nullable(),
}).passthrough();

export type ProtectedProduct = z.infer<typeof protectedProductSchema>;

const protectedListSchema = z.object({
  success: z.literal(true),
  data: z.array(protectedProductSchema),
});

/**
 * A diferencia del cliente antiguo, siempre remite la cookie de sesión Admin.
 * La autorización real y el ámbito por marca son responsabilidad del CORE.
 */
export async function loadProtectedBrandProducts(brandId: string): Promise<ProtectedProduct[]> {
  if (!brandId || !brandId.trim()) throw new Error("WOOLY_ADMIN_BRAND_REQUIRED");
  const path = `/catalog-commercial/brands/${encodeURIComponent(brandId)}/products`;
  const response = await fetch(resolveAdminCoreUrl(path), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`WOOLY_ADMIN_PRODUCTS_HTTP_${response.status}`);
  const envelope: unknown = await response.json();
  return protectedListSchema.parse(envelope).data;
}

/**
 * Gate de paridad: no inventar ni borrar códigos de barras, SUNAT o campañas.
 * El ProductAdminView actual NO incluye estas propiedades; se mantiene
 * desacoplado de useAdminProducts hasta corregir CORE.
 */
export function assertLegacyListingParity(product: ProtectedProduct): void {
  const fields = product as Record<string, unknown>;
  const missing = ["barcode", "sunatCode", "campaigns"]
    .filter((key) => !Object.prototype.hasOwnProperty.call(fields, key));
  if (missing.length) throw new Error(`WOOLY_ADMIN_PARITY_BLOCKED:${missing.join(",")}`);
}
