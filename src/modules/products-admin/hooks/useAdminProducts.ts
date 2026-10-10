import { useQuery } from "@tanstack/react-query";
import { jungCoreAdminProducts } from "../integrations/JungCoreAdminProducts";
export const PRODUCT_ADMIN_AUTO_REFRESH_MS = 5 * 60 * 1000;
export function useAdminProducts() {
  const products = useQuery({
    refetchInterval: PRODUCT_ADMIN_AUTO_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryKey: ["products-admin", "core"],
    queryFn: () => jungCoreAdminProducts.list(),
  });
  const options = useQuery({
    refetchInterval: PRODUCT_ADMIN_AUTO_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryKey: ["products-admin", "options"],
    queryFn: () => jungCoreAdminProducts.options(),
  });
  return {
    data: products.data ?? [],
    isLoading: products.isLoading,
    isFullCatalogLoaded: products.isSuccess,
    error: products.error ?? options.error,
    categories:
      options.data?.categories.map((category) => ({
        id: category.slug,
        name: category.name,
      })) ?? [],
    reload: async () => {
      await Promise.all([products.refetch(), options.refetch()]);
    },
  };
}
