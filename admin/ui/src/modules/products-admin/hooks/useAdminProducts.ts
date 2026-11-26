import { useQuery } from "@tanstack/react-query";
import { jungCoreAdminProducts } from "../integrations/JungCoreAdminProducts";
import { loadProtectedBrandProducts } from "../integrations/JungCoreProtectedProducts";
import { mapProtectedAdminProduct } from "../integrations/JungCoreProtectedProductAdapter";
import { loadBrandAdminConfiguration } from "@/modules/admin-auth/services/AdminAuthClient";

export const PRODUCT_ADMIN_AUTO_REFRESH_MS = 5 * 60 * 1000;

/** Solo se habilita explícitamente en una instancia local de administración. */
export const PRODUCT_ADMIN_PROTECTED_MODE =
  import.meta.env.VITE_WOOLY_ADMIN_PROTECTED_PRODUCTS === "true";

export function useAdminProducts(brandId?: string) {
  const protectedMode = PRODUCT_ADMIN_PROTECTED_MODE;
  const protectedReady = protectedMode && !!brandId;

  const protectedCatalog = useQuery({
    refetchInterval: PRODUCT_ADMIN_AUTO_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryKey: ["products-admin", "protected", brandId],
    enabled: protectedReady,
    queryFn: async () => {
      if (!brandId) throw new Error("WOOLY_ADMIN_BRAND_REQUIRED");
      // El catálogo y sus categorías deben pertenecer a la MISMA marca autenticada.
      const [configuration, raw] = await Promise.all([
        loadBrandAdminConfiguration(brandId),
        loadProtectedBrandProducts(brandId),
      ]);
      if (!configuration.success || configuration.data.brandId !== brandId) {
        throw new Error("WOOLY_ADMIN_CONFIGURATION_MISMATCH");
      }
      const categories = configuration.data.categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
      }));
      return {
        products: raw.map((product) => mapProtectedAdminProduct(product, categories)),
        categories: categories.map((category) => ({ id: category.slug, name: category.name })),
      };
    },
  });

  const products = useQuery({
    refetchInterval: PRODUCT_ADMIN_AUTO_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryKey: ["products-admin", "core"],
    enabled: !protectedMode,
    queryFn: () => jungCoreAdminProducts.list(),
  });
  const options = useQuery({
    refetchInterval: PRODUCT_ADMIN_AUTO_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryKey: ["products-admin", "options"],
    enabled: !protectedMode,
    queryFn: () => jungCoreAdminProducts.options(),
  });

  if (protectedMode) {
    return {
      data: protectedCatalog.data?.products ?? [],
      isLoading: !brandId || protectedCatalog.isLoading,
      isFullCatalogLoaded: protectedCatalog.isSuccess,
      error: protectedCatalog.error,
      categories: protectedCatalog.data?.categories ?? [],
      reload: async () => { await protectedCatalog.refetch(); },
    };
  }
  return {
    data: products.data ?? [],
    isLoading: products.isLoading,
    isFullCatalogLoaded: products.isSuccess,
    error: products.error ?? options.error,
    categories: options.data?.categories.map((category) => ({
      id: category.slug, name: category.name,
    })) ?? [],
    reload: async () => { await Promise.all([products.refetch(), options.refetch()]); },
  };
}
