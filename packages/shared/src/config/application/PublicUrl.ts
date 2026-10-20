import type { ApplicationConfig } from "./ApplicationConfig";
import { getApplicationConfig } from "./resolveApplicationConfig";

export function buildPublicUrl(
  path: string,
  config: ApplicationConfig = getApplicationConfig(),
): string {
  return new URL(path, `${config.publicSite.origin}/`).toString();
}

export function buildProductPublicUrl(
  productId: string,
  category?: string,
  config: ApplicationConfig = getApplicationConfig(),
): string {
  const url = new URL(config.routes.productDetail, `${config.publicSite.origin}/`);
  if (productId) url.searchParams.set("id", productId);
  if (category) url.searchParams.set("cat", category);
  return url.toString();
}

export function buildProductPublicPath(
  productId: string,
  category?: string,
  config: ApplicationConfig = getApplicationConfig(),
): string {
  const params = new URLSearchParams();
  params.set("id", productId);
  if (category) params.set("cat", category);
  return `${config.routes.productDetail}?${params.toString()}`;
}

export function buildCatalogPublicUrl(
  config: ApplicationConfig = getApplicationConfig(),
): string {
  return buildPublicUrl(config.routes.catalog, config);
}

export function buildCatalogPdfPublicUrl(
  config: ApplicationConfig = getApplicationConfig(),
): string {
  return buildPublicUrl(config.routes.catalogPdf, config);
}
