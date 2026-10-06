import type { Product } from "@/shared/types/product";

export type ProductMediaType = "image" | "video";

export interface ProductMedia {
  id: string;
  type: ProductMediaType;
  src: string;
  thumb?: string;
  alt: string;
  order: number;
}

/**
 * Único placeholder visual oficial para producto sin media pública.
 *
 * JUNG Media sustituirá este recurso cuando el producto reciba
 * una imagen real. La UI no necesita conocer el origen del asset.
 */
export const PRODUCT_IMAGE_PLACEHOLDER =
  "/placeholder.svg";

const cleanMediaUrl = (
  value:
    unknown,
) =>
  typeof value ===
    "string"
    ? value.trim()
    : "";

export function resolveProductImageSrc(
  value:
    unknown,
): string {
  return (
    cleanMediaUrl(
      value,
    ) ||
    PRODUCT_IMAGE_PLACEHOLDER
  );
}

/**
 * Fallback defensivo para URLs existentes que fallen en runtime.
 *
 * También evita un loop de onError en caso de que el propio
 * placeholder no pudiera cargarse.
 */
export function applyProductImageFallback(
  image:
    HTMLImageElement,
): void {
  if (
    image.dataset
      .productFallbackApplied ===
      "true"
  ) {
    return;
  }

  image.dataset
    .productFallbackApplied =
      "true";

  image.removeAttribute(
    "srcset",
  );

  image.src =
    PRODUCT_IMAGE_PLACEHOLDER;
}

export function getProductMedia(
  product:
    Product,
): ProductMedia[] {
  const galleryImages =
    cleanMediaUrl(
      product.gallery,
    )
      .split("|")
      .map(
        (
          item,
        ) =>
          item.trim(),
      )
      .filter(
        Boolean,
      );

  const rawImages =
    [
      product.img,
      ...galleryImages,
    ]
      .map(
        cleanMediaUrl,
      )
      .filter(
        Boolean,
      );

  const uniqueImages =
    Array.from(
      new Set(
        rawImages,
      ),
    );

  const media =
    uniqueImages.map(
      (
        src,
        index,
      ) => ({
        id:
          `${product.id}-image-${index + 1}`,

        type:
          "image" as const,

        src,

        thumb:
          src,

        alt:
          index === 0
            ? `${product.title} imagen principal`
            : `${product.title} imagen ${index + 1}`,

        order:
          index + 1,
      }),
    );

  return media.length
    ? media
    : [
        {
          id:
            `${product.id}-placeholder`,

          type:
            "image",

          src:
            PRODUCT_IMAGE_PLACEHOLDER,

          thumb:
            PRODUCT_IMAGE_PLACEHOLDER,

          alt:
            `Imagen en proceso de ${product.title}`,

          order:
            1,
        },
      ];
}
