import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import type {
  Campaign,
} from "@wooly/contracts/types/product";
import type {
  CatalogCategory,
} from "@wooly/shared/catalog/services/fetchProducts";
import {
  CATEGORY_CONFIG,
} from "@wooly/shared/catalog/config/categories";

export const isCatalogCategory = (
  id: string,
): id is CatalogCategory =>
  id === "todas" ||
  CATEGORY_CONFIG.some(
    (category) => category.id === id,
  );

export function readCatalogNavigation(
  search: string,
): {
  category: CatalogCategory;
  campaign: string;
} {
  const params = new URLSearchParams(search);
  const category = params.get("cat") || "todas";

  return {
    category: isCatalogCategory(category)
      ? category
      : "todas",
    campaign: params.get("cpg") || "",
  };
}

export function useCatalogNavigation(
  campaigns: readonly Campaign[],
) {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = readCatalogNavigation(
    window.location.search,
  );

  const [
    activeCategory,
    setActiveCategory,
  ] = useState<CatalogCategory>(
    initial.category,
  );
  const [
    activeCampaign,
    setActiveCampaign,
  ] = useState(initial.campaign);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const isCampaignId = useCallback(
    (id: string) =>
      !id ||
      campaigns.some(
        (campaign) => campaign.id === id,
      ),
    [campaigns],
  );

  useEffect(() => {
    const next = readCatalogNavigation(
      location.search,
    );
    setActiveCategory(next.category);
    setActiveCampaign(next.campaign);
  }, [location.search]);

  useEffect(() => {
    if (!activeCampaign) return;
    if (campaigns.length === 0) return;
    if (isCampaignId(activeCampaign)) return;

    setActiveCampaign("");
    navigate("/catalogo", {
      replace: true,
    });
  }, [
    activeCampaign,
    campaigns,
    isCampaignId,
    navigate,
  ]);

  useEffect(() => {
    const restored =
      location.state?.restoreSearch ||
      sessionStorage.getItem(
        "wooly_restore_search",
      );

    if (!restored) return;

    setSearchQuery(restored);
    sessionStorage.removeItem(
      "wooly_restore_search",
    );
    window.history.replaceState(
      {},
      document.title,
    );
  }, [location.state]);

  const selectCategory = useCallback(
    (id: string) => {
      setSearchQuery("");
      setActiveCategory(
        id as CatalogCategory,
      );

      const params =
        new URLSearchParams();

      if (id !== "todas") {
        params.set("cat", id);
      }
      if (activeCampaign) {
        params.set(
          "cpg",
          activeCampaign,
        );
      }

      navigate(
        `/catalogo${
          params.toString()
            ? `?${params}`
            : ""
        }`,
      );
    },
    [navigate, activeCampaign],
  );

  const selectCampaign = useCallback(
    (campaign: string) => {
      setSearchQuery("");
      setActiveCampaign(campaign);

      const params =
        new URLSearchParams();

      if (activeCategory !== "todas") {
        params.set(
          "cat",
          activeCategory,
        );
      }
      if (campaign) {
        params.set("cpg", campaign);
      }

      navigate(
        `/catalogo${
          params.toString()
            ? `?${params}`
            : ""
        }`,
      );
    },
    [navigate, activeCategory],
  );

  const resetCatalog = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("todas");
    setActiveCampaign("");
    navigate("/catalogo");
  }, [navigate]);

  return {
    activeCategory,
    activeCampaign,
    searchQuery,
    setSearchQuery,
    selectCategory,
    selectCampaign,
    resetCatalog,
  };
}
