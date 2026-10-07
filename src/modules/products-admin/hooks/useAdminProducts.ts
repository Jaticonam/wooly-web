import { useQuery } from "@tanstack/react-query";
import { jungCoreAdminProducts } from "../integrations/JungCoreAdminProducts";
export function useAdminProducts() {
  const products = useQuery({
    queryKey: ["products-admin", "core"],
    queryFn: () => jungCoreAdminProducts.list(),
  });
  const options = useQuery({
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
      await products.refetch();
    },
  };
}
