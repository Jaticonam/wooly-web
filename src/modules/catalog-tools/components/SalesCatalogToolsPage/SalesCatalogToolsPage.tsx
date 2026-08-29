import {
  useState,
} from "react";

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

import "./SalesCatalogToolsPage.css";

export default function SalesCatalogToolsPage() {
  const [
    isCatalogSyncOpen,
    setIsCatalogSyncOpen,
  ] = useState(
    false,
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
    <AdminShell>
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
