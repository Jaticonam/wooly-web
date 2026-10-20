import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type {
  Campaign,
} from "@wooly/contracts/types/product";

import {
  isCampaignActive,
} from "@wooly/contracts/catalog/domain/CampaignRules";

import {
  useCatalogCampaigns,
} from "../hooks/useCatalogCampaigns";

export interface CatalogCampaignRegistryValue {
  /**
   * Registro completo proveniente de SheetCampaign.
   * Incluye activas e inactivas.
   */
  allCampaigns:
    readonly Campaign[];

  /**
   * Campañas visibles y operativas en la fecha actual.
   */
  activeCampaigns:
    readonly Campaign[];

  /**
   * Índice oficial utilizado por CampaignBadgeResolver.
   */
  campaignById:
    ReadonlyMap<string, Campaign>;

  isLoading:
    boolean;
}

const EMPTY_CAMPAIGN_MAP =
  new Map<string, Campaign>();

const EMPTY_REGISTRY:
  CatalogCampaignRegistryValue = {
    allCampaigns: [],
    activeCampaigns: [],
    campaignById:
      EMPTY_CAMPAIGN_MAP,
    isLoading: false,
  };

const CatalogCampaignRegistryContext =
  createContext<
    CatalogCampaignRegistryValue
  >(
    EMPTY_REGISTRY,
  );

interface CatalogCampaignRegistryProviderProps {
  children:
    ReactNode;
}

export function CatalogCampaignRegistryProvider({
  children,
}: CatalogCampaignRegistryProviderProps) {
  /**
   * El resolver necesita conocer también las campañas
   * inactivas para distinguir una campaña inactiva
   * de una relación inexistente.
   */
  const {
    campaigns:
      allCampaigns,

    isLoading,
  } = useCatalogCampaigns({
    includeInactive: true,
  });

  const activeCampaigns =
    useMemo(
      () =>
        allCampaigns
          .filter(
            (campaign) =>
              isCampaignActive(
                campaign,
              ),
          )
          .sort(
            (a, b) =>
              b.priority -
              a.priority,
          ),
      [allCampaigns],
    );

  const campaignById =
    useMemo(
      () =>
        new Map(
          allCampaigns.map(
            (campaign) => [
              campaign.id,
              campaign,
            ],
          ),
        ),
      [allCampaigns],
    );

  const value =
    useMemo<
      CatalogCampaignRegistryValue
    >(
      () => ({
        allCampaigns,
        activeCampaigns,
        campaignById,
        isLoading,
      }),
      [
        allCampaigns,
        activeCampaigns,
        campaignById,
        isLoading,
      ],
    );

  return (
    <CatalogCampaignRegistryContext.Provider
      value={value}
    >
      {children}
    </CatalogCampaignRegistryContext.Provider>
  );
}

export function useCatalogCampaignRegistry():
  CatalogCampaignRegistryValue {
  return useContext(
    CatalogCampaignRegistryContext,
  );
}
