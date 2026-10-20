import {
  useEffect,
  useState,
} from "react";

import type {
  Campaign,
} from "@wooly/contracts/types/product";

import {
  loadCatalogCampaigns,
} from "../services/campaignService";

export interface UseCatalogCampaignsOptions {
  includeInactive?: boolean;
}

export function useCatalogCampaigns(
  options:
    UseCatalogCampaignsOptions = {},
) {
  const {
    includeInactive = false,
  } = options;

  const [
    campaigns,
    setCampaigns,
  ] = useState<Campaign[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      try {
        const result =
          await loadCatalogCampaigns({
            includeInactive,
          });

        if (!cancelled) {
          setCampaigns(result);
        }
      } catch (error) {
        console.error(
          "Error cargando campañas:",
          error,
        );

        if (!cancelled) {
          setCampaigns([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [includeInactive]);

  return {
    campaigns,
    isLoading,
  };
}
