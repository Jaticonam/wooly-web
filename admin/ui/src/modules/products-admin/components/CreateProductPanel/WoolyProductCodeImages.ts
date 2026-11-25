import { z } from "zod";
import { requestJson } from "@wooly/shared/infrastructure/http";

const imageAssetSchema = z.object({
  id: z.string(),
  mediaCode: z.string(),
  kind: z.string().nullable(),
  status: z.string(),
  publicUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  brand: z.object({ slug: z.string() }).nullable(),
});
const manifestSchema = z.object({
  success: z.literal(true),
  assets: z.array(imageAssetSchema),
});

export type IndexedMediaAsset = z.infer<typeof imageAssetSchema>;
export interface ProductCodeImage {
  id: string;
  mediaCode: string;
  url: string;
  isPrimary: boolean;
  position: number;
}
export function matchProductCodeImages(assets: readonly IndexedMediaAsset[], code: string): ProductCodeImage[] {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,80}$/.test(normalized)) return [];
  const prefix = "WOOLY:" + normalized + ":";
  return assets.flatMap((asset) => {
    if (asset.brand?.slug.toLowerCase() !== "wooly" ||
        asset.kind?.toUpperCase() !== "IMAGE" ||
        asset.status.toUpperCase() !== "ACTIVE" ||
        !asset.mediaCode.startsWith(prefix)) return [];
    const suffix = asset.mediaCode.slice(prefix.length);
    if (!/^(0[1-9]|[1-9][0-9])$/.test(suffix)) return [];
    const url = [asset.thumbnailUrl, asset.publicUrl].find((value) => {
      if (!value) return false;
      try { return new URL(value).protocol === "https:"; }
      catch { return false; }
    });
    if (!url) return [];
    const position = Number(suffix);
    return [{ id: asset.id, mediaCode: asset.mediaCode, url, position, isPrimary: position === 1 }];
  }).sort((a, b) => a.position - b.position);
}

export async function loadWoolyImageManifest(): Promise<IndexedMediaAsset[]> {
  // Read only. Never register assets, attach images, or upload to storage.
  const response = await requestJson<unknown>("/jung-core/assets/manifest?brand=wooly", {
    source: "Wooly Admin Media Finder",
    method: "GET",
  });
  if (!response.ok) throw new Error("No se pudo consultar la biblioteca de imágenes de CORE.");
  const parsed = manifestSchema.safeParse(response.data);
  if (!parsed.success) throw new Error("CORE respondió con un índice de imágenes no válido.");
  return parsed.data.assets;
}
