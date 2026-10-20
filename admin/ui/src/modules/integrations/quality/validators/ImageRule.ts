import type { Product } from "@wooly/contracts/types/product";
import type { QualityIssue } from "../models";
import type { QualityRule } from "../contracts/QualityRule";

function parsePublicImageUrl(
  value: string,
): URL | null {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    )
      ? url
      : null;
  } catch {
    return null;
  }
}

const isValidImage = (
  url: URL,
) =>
  /\.(jpg|jpeg|png|webp)$/i
    .test(url.pathname) ||
  url.hostname ===
    "dl.dropboxusercontent.com";

export const ImageRule: QualityRule<Product> = {
  key: "image",
  name: "Imagen principal",
  description: "Valida que el producto tenga una imagen principal pública y compatible.",
  category: "media",
  weight: 20,
  required: true,
  enabled: true,

  validate(product) {
    const issues: QualityIssue[] = [];
    const img = String(product.img || "").trim();

    if (!img) {
      issues.push({ level: "error", code: "IMAGE_EMPTY", field: "img", message: "El producto no tiene imagen principal." });
      return issues;
    }

    const publicUrl =
      parsePublicImageUrl(img);

    if (!publicUrl) {
      issues.push({ level: "error", code: "IMAGE_NOT_PUBLIC_URL", field: "img", message: "La imagen debe ser una URL pública." });
      return issues;
    }

    if (!isValidImage(publicUrl)) {
      issues.push({ level: "warning", code: "IMAGE_FORMAT_REVIEW", field: "img", message: "La imagen no parece tener un formato estándar jpg, png o webp." });
    }

    return issues;
  },
};
