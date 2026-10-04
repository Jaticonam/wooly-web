import type {
  ProductMedia,
} from "@/shared/lib/productMedia";

import type {
  Product,
} from "@/shared/types/product";

export type ProductShareImageSource =
  | "commercial-output"
  | "resolved-media"
  | "product-primary"
  | "none";

export interface ProductShareImage {
  url: string | null;
  source: ProductShareImageSource;
}

interface ResolveProductShareImageInput {
  product: Product;
  media: readonly ProductMedia[];

  /**
   * Punto de integración para una imagen comercial específica.
   *
   * JUNG CORE Commercial Publishing podrá entregar aquí un artefacto
   * preparado para compartir (Pinterest/redes) sin acoplar la UI
   * al proveedor de almacenamiento o al endpoint que lo genere.
   *
   * Mientras no exista ese artefacto, la experiencia usa la media
   * ya resuelta del producto. Esa media puede venir de JUNG CORE
   * mediante el override actual o de la fuente vigente del catálogo.
   */
  commercialImageUrl?: string | null;
}

function cleanUrl(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function isPlaceholder(
  value: string,
): boolean {
  return (
    value.length === 0 ||
    value.includes(
      "/placeholder.svg",
    )
  );
}

export function resolveProductShareImage({
  product,
  media,
  commercialImageUrl,
}: ResolveProductShareImageInput): ProductShareImage {
  const commercial =
    cleanUrl(
      commercialImageUrl,
    );

  if (
    !isPlaceholder(
      commercial,
    )
  ) {
    return {
      url:
        commercial,
      source:
        "commercial-output",
    };
  }

  const resolvedMedia =
    media.find(
      (item) =>
        item.type ===
          "image" &&
        !isPlaceholder(
          cleanUrl(
            item.src,
          ),
        ),
    );

  if (
    resolvedMedia
  ) {
    return {
      url:
        cleanUrl(
          resolvedMedia.src,
        ),
      source:
        "resolved-media",
    };
  }

  const primary =
    cleanUrl(
      product.img,
    );

  if (
    !isPlaceholder(
      primary,
    )
  ) {
    return {
      url:
        primary,
      source:
        "product-primary",
    };
  }

  return {
    url:
      null,
    source:
      "none",
  };
}
