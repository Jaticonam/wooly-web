import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useCatalogCampaigns,
} from "@/modules/catalog/hooks/useCatalogCampaigns";

import {
  useCatalogData,
} from "@/modules/catalog/hooks/useCatalogData";

import CatalogSyncPanel from "@/modules/catalog-tools/components/CatalogSyncPanel/CatalogSyncPanel";

import CatalogCompositionPanel from "@/modules/catalog-tools/components/CatalogCompositionPanel/CatalogCompositionPanel";

import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";
import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";

import {
  parseCatalogWorkspaceHandoff,
} from "@/modules/catalog-tools/domain/CatalogWorkspaceHandoff";

import "./SalesCatalogToolsPage.css";

export default function SalesCatalogToolsPage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    incomingHandoff,
  ] = useState(
    () =>
      parseCatalogWorkspaceHandoff(
        location.state,
      ),
  );

  const [
    isCatalogSyncOpen,
    setIsCatalogSyncOpen,
  ] = useState(
    false,
  );

  useEffect(
    () => {
      if (!incomingHandoff) {
        return;
      }

      navigate(
        `${location.pathname}${location.search}${location.hash}`,
        {
          replace: true,
          state: null,
        },
      );
    },
    [
      incomingHandoff,
      location.hash,
      location.pathname,
      location.search,
      navigate,
    ],
  );

  const {
    data,
    isLoading,
    isFullCatalogLoaded,
  } = useCatalogData(
    "todas",
  );

  const {
    campaigns,
    isLoading:
      isCampaignRegistryLoading,
  } = useCatalogCampaigns({
    includeInactive: true,
  });

  const isPanelReady =
    isFullCatalogLoaded &&
    !isCampaignRegistryLoading;

  return (
    <AdminShell title="Catálogos">
      <main className="sales-catalog-tools">
        <AdminModal
          open={
            isCatalogSyncOpen
          }
          size="large"
          title="Google Sheets"
          description="Revisa el estado del catálogo y actualiza los datos cuando sea necesario."
          onClose={() =>
            setIsCatalogSyncOpen(
              false,
            )
          }
        >
          <CatalogSyncPanel
            currentProductCount={
              data.length
            }
            campaignCount={
              campaigns.length
            }
            isReady={
              isPanelReady
            }
            initiallyExpanded
          />
        </AdminModal>

        <CatalogCompositionPanel
          products={
            data
          }
          campaigns={
            campaigns
          }
          isReady={
            isPanelReady
          }
          initialProductIds={
            incomingHandoff
              ?.productIds ??
            []
          }
          onBackToProducts={() =>
            navigate(
              "/admin",
            )
          }
          onOpenCatalogSync={() =>
            setIsCatalogSyncOpen(
              true,
            )
          }
        />

        {!isPanelReady ? (
          <section className="sales-catalog-tools__notice">
            {isLoading ||
            isCampaignRegistryLoading
              ? "Cargando catálogo y campañas oficiales..."
              : "El catálogo aún puede estar cargando categorías. Espera unos segundos antes de preparar un catálogo."}
          </section>
        ) : null}
      </main>
    </AdminShell>
  );
}
