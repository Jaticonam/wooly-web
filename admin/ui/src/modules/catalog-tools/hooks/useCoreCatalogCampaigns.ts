import { useQuery } from "@tanstack/react-query";
import { listCoreCatalogCampaigns } from "../integrations/CoreCatalogCampaigns";

export function useCoreCatalogCampaigns() {
  const query = useQuery({
    queryKey: ["catalog-tools", "core-campaigns", "wooly"],
    queryFn: listCoreCatalogCampaigns,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  return {
    campaigns: query.data ?? [],
    isLoading: query.isLoading,
    isReady: query.isSuccess,
    error: query.error,
  };
}
