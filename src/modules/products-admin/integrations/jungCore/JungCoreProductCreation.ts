import { z } from "zod";
import { requestJson } from "@/shared/infrastructure/http";

const optionsSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  categories: z.array(
    z.object({ id: z.string().min(1), name: z.string().min(1) }),
  ),
  priceLists: z.array(
    z.object({ id: z.string().min(1), name: z.string(), currency: z.string() }),
  ),
});
const productSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  barcode: z.string().nullable().optional(),
  sunatCode: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  name: z.string(),
  status: z.literal("DRAFT"),
  categoryId: z.string(),
  brandId: z.string(),
});
export type ProductCreationOptions = z.infer<typeof optionsSchema>;
export type CreatedCanonicalProduct = z.infer<typeof productSchema>;
export interface CreateCanonicalProductInput {
  code: string;
  barcode?: string;
  sunatCode?: string;
  name: string;
  description?: string;
  brandId: string;
  categoryId: string;
  tiers?: { minimumQuantity: number; unitPrice: number }[];
}
export interface ProductCreationProvider {
  loadOptions(): Promise<ProductCreationOptions>;
  create(input: CreateCanonicalProductInput): Promise<CreatedCanonicalProduct>;
}

export class JungCoreProductCreation implements ProductCreationProvider {
  constructor(
    private readonly baseUrl = String(
      import.meta.env.VITE_JUNG_CORE_API_BASE_URL ?? "/jung-core",
    ).replace(/\/+$/, ""),
    private readonly brandSlug = String(
      import.meta.env.VITE_JUNG_CORE_BRAND_SLUG ?? "wooly",
    ),
  ) {}

  private async request(
    endpoint: string,
    body?: CreateCanonicalProductInput,
  ): Promise<unknown> {
    const result = await requestJson<unknown>(this.baseUrl.trim().replace(/\/+$/, "") + endpoint, {
      source: "JUNG CORE Productos",
      method: body ? "POST" : "GET",
      ...(body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
    if (!result.ok) {
      if (
        body &&
        [
          "TIMEOUT",
          "NETWORK_ERROR",
          "EMPTY_BODY",
          "INVALID_JSON",
          "UNEXPECTED_CONTENT_TYPE",
        ].includes(result.error.code)
      ) {
        throw new Error(
          "No se pudo confirmar la creación. Verifica en CORE si se creó el producto antes de volver a enviarlo.",
        );
      }
      throw new Error(
        result.error.status === 400
          ? "CORE rechazó los datos. Revisa nombre, categoría y precios; vuelve a abrir el formulario si cambió la configuración."
          : result.error.message,
      );
    }
    const envelope = z
      .object({ success: z.literal(true), data: z.unknown() })
      .safeParse(result.data);
    if (!envelope.success)
      throw new Error(
        "Respuesta de CORE inválida. Verifica el producto antes de repetir el alta.",
      );
    return envelope.data.data;
  }

  async loadOptions(): Promise<ProductCreationOptions> {
    return optionsSchema.parse(
      await this.request(
        "/products/creation-options?brandSlug=" +
          encodeURIComponent(this.brandSlug),
      ),
    );
  }

  async create(
    input: CreateCanonicalProductInput,
  ): Promise<CreatedCanonicalProduct> {
    // Explicit user fields only: runtime callers cannot inject SKU, slug or status.
    const body: CreateCanonicalProductInput = {
      code: input.code.trim(),
      barcode: input.barcode?.trim(),
      sunatCode: input.sunatCode?.trim(),
      name: input.name.trim(),
      description: input.description?.trim(),
      brandId: input.brandId,
      categoryId: input.categoryId,
      ...(input.tiers
        ? {
            tiers: input.tiers.map(({ minimumQuantity, unitPrice }) => ({
              minimumQuantity,
              unitPrice,
            })),
          }
        : {}),
    };
    const result = productSchema.safeParse(
      await this.request("/products", body),
    );
    if (!result.success)
      throw new Error(
        "CORE respondió sin una identidad válida. Verifica el producto antes de repetir el alta.",
      );
    return result.data;
  }
}

export const jungCoreProductCreation = new JungCoreProductCreation();
