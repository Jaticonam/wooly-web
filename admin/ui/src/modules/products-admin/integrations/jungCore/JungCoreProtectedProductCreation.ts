import { z } from "zod";
import {
  loadAdminSession,
  loadBrandAdminConfiguration,
  resolveAdminCoreUrl,
} from "@/modules/admin-auth/services/AdminAuthClient";
import type {
  CreateCanonicalProductInput,
  CreatedCanonicalProduct,
  ProductCreationOptions,
  ProductCreationProvider,
} from "./JungCoreProductCreation";

const createdViewSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  barcode: z.string().nullable(),
  sunatCode: z.string().nullable(),
  name: z.string(),
  status: z.literal("DRAFT"),
  category: z.object({ id: z.string() }).nullable(),
});

/** Cliente protegido independiente: no modifica el proveedor vigente. */
export class JungCoreProtectedProductCreation implements ProductCreationProvider {
  private async woolyBrandId(): Promise<string> {
    const session = await loadAdminSession();
    const brand = session.accesses.find(entry => entry.brand.slug === "wooly");
    if (!brand) throw new Error("WOOLY_ADMIN_BRAND_ACCESS_DENIED");
    return brand.brand.id;
  }

  async loadOptions(): Promise<ProductCreationOptions> {
    const brandId = await this.woolyBrandId();
    const response = await loadBrandAdminConfiguration(brandId);
    if (!response.success || response.data.brandId !== brandId) {
      throw new Error("WOOLY_ADMIN_CONFIGURATION_MISMATCH");
    }
    const priceList = z.object({
      id: z.string().min(1), name: z.string(), currency: z.string(),
    }).nullable().parse(response.data.defaultPriceList);
    return {
      id: brandId,
      name: "Wooly",
      categories: response.data.categories
        .filter(category => category.status === "ACTIVE")
        .map(category => ({ id: category.id, name: category.name })),
      priceLists: priceList ? [priceList] : [],
    };
  }

  async create(input: CreateCanonicalProductInput): Promise<CreatedCanonicalProduct> {
    const brandId = await this.woolyBrandId();
    if (input.brandId !== brandId) throw new Error("WOOLY_ADMIN_BRAND_MISMATCH");
    // brandId se obtiene de la sesion y la ruta; nunca del body.
    const body = {
      code: input.code.trim(),
      barcode: input.barcode?.trim() || null,
      sunatCode: input.sunatCode?.trim() || null,
      name: input.name.trim(),
      description: input.description?.trim(),
      categoryId: input.categoryId,
      ...(input.tiers ? { tiers: input.tiers.map(tier => ({ minimumQuantity: tier.minimumQuantity, unitPrice: tier.unitPrice })) } : {}),
    };
    const response = await fetch(resolveAdminCoreUrl(`/catalog-commercial/brands/${encodeURIComponent(brandId)}/products`), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`WOOLY_ADMIN_PRODUCT_CREATE_HTTP_${response.status}`);
    const envelope = z.object({ success: z.literal(true), data: createdViewSchema }).parse(await response.json());
    const data = envelope.data;
    if (data.category?.id !== input.categoryId) throw new Error("WOOLY_ADMIN_CREATED_CATEGORY_MISMATCH");
    if (data.code !== body.code) throw new Error("WOOLY_ADMIN_CREATED_CODE_MISMATCH");
    return {
      id: data.id,
      code: data.code,
      barcode: data.barcode,
      sunatCode: data.sunatCode,
      sku: null,
      name: data.name,
      status: data.status,
      categoryId: input.categoryId,
      brandId,
    };
  }
}

export const jungCoreProtectedProductCreation = new JungCoreProtectedProductCreation();
