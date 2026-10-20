import { toPng } from "html-to-image";

export const PRODUCT_CAPTURE_RENDER_WIDTH = 360;
export const PRODUCT_CAPTURE_RENDER_HEIGHT = 640;

export const PRODUCT_CAPTURE_WIDTH = 1080;
export const PRODUCT_CAPTURE_HEIGHT = 1920;

export function buildProductCaptureFileName(
  productId: string,
): string {
  const normalizedId = productId
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${normalizedId || "producto"}-wooly.png`;
}

export async function downloadProductCardCapture(
  node: HTMLElement,
  productId: string,
): Promise<void> {
  const dataUrl = await toPng(node, {
    width: PRODUCT_CAPTURE_RENDER_WIDTH,
    height: PRODUCT_CAPTURE_RENDER_HEIGHT,
    canvasWidth: PRODUCT_CAPTURE_WIDTH,
    canvasHeight: PRODUCT_CAPTURE_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: "#ffffff",
  });

  const link = document.createElement("a");

  link.download =
    buildProductCaptureFileName(
      productId,
    );

  link.href = dataUrl;
  link.rel = "noopener";

  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
  }
}