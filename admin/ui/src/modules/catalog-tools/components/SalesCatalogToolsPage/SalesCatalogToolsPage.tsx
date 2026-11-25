import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAdminProducts } from "@/modules/products-admin/hooks/useAdminProducts";
import { useCoreCatalogCampaigns } from "@/modules/catalog-tools/hooks/useCoreCatalogCampaigns";

import CatalogCompositionPanel from "@/modules/catalog-tools/components/CatalogCompositionPanel/CatalogCompositionPanel";

import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";

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

  // Productos únicamente desde JUNG CORE protegido; nunca desde Sheets.
  const { data, isLoading, isFullCatalogLoaded, error } = useAdminProducts();
  // Campañas administrativas de CORE; nunca recurrir a Sheets.
  const {
    campaigns,
    isLoading: campaignsLoading,
    isReady: campaignsReady,
    error: campaignsError,
  } = useCoreCatalogCampaigns();
  const isPanelReady = isFullCatalogLoaded && campaignsReady;

  return (
    <AdminShell title="Catálogos">
      <main className="sales-catalog-tools">
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
        />

        {error ? (
          <section className="sales-catalog-tools__notice" role="alert">
            Error al consultar JUNG CORE. No se utilizarán datos antiguos de Sheets.
          </section>
        ) : !isPanelReady ? (
          <section className="sales-catalog-tools__notice" role="status">
            {isLoading ? "Cargando productos desde JUNG CORE..." : "El catálogo administrativo de JUNG CORE todavía no está disponible."}
          </section>
        ) : null}
        {campaignsError ? (
          <section className="sales-catalog-tools__notice" role="alert">
            Error al consultar campañas de JUNG CORE. No se utilizarán datos antiguos de Sheets.
          </section>
        ) : campaignsLoading ? (
          <section className="sales-catalog-tools__notice" role="status">
            Cargando campañas desde JUNG CORE...
          </section>
        ) : null}
      </main>
    </AdminShell>
  );
}
