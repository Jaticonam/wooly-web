import { lazy, Suspense } from "react";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  HelmetProvider,
} from "react-helmet-async";

import {
  Toaster,
} from "@wooly/shared/components/ui/toaster";

import {
  Toaster as Sonner,
} from "@wooly/shared/components/ui/sonner";

import {
  TooltipProvider,
} from "@wooly/shared/components/ui/tooltip";

import {
  CatalogCampaignRegistryProvider,
} from "@wooly/shared/catalog/context/CatalogCampaignRegistryContext";

import {
  AdminAuthProvider,
} from "@/modules/admin-auth/context/AdminAuthContext";

import AdminProtectedRoute from "@/modules/admin-auth/components/AdminProtectedRoute";

/*
 * W12-02: Wooly Admin.
 * Aplicación independiente servida bajo /admin.
 * Las rutas conservan su ruta absoluta histórica (/admin/...)
 * para que enlaces, navegación y redirecciones existentes
 * sigan siendo válidos sin reescritura.
 */

const ProductsAdminPage = lazy(
  () => import("@/pages/ProductsAdminPage"),
);

const SalesCatalogToolsPage = lazy(
  () => import("@/pages/SalesCatalogToolsPage"),
);

const CatalogSettingsPage = lazy(
  () => import("@/modules/catalog-settings/pages/CatalogSettingsPage"),
);

const IntegrationsPage = lazy(
  () => import("@/modules/integrations/pages/IntegrationsPage"),
);

const CommercialCenter = lazy(
  () => import("@/modules/commercial/pages/CommercialCenter"),
);

const AdminNotFoundPage = lazy(
  () => import("@/pages/AdminNotFoundPage"),
);

const queryClient =
  new QueryClient();

function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] items-center justify-center px-6 text-center text-sm text-slate-500"
    >
      Cargando contenido…
    </div>
  );
}

/*
 * W12-03B: /admin es la entrada administrativa única.
 * /admin/login se conserva solo por compatibilidad con enlaces antiguos.
 */
function LegacyAdminLoginRedirect() {
  const location =
    useLocation();

  return (
    <Navigate
      to={`/admin${location.search}${location.hash}`}
      replace
      state={location.state}
    />
  );
}

function CatalogCampaignScope() {
  return (
    <CatalogCampaignRegistryProvider>
      <Outlet />
    </CatalogCampaignRegistryProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider
      client={queryClient}
    >
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter
            future={{
              v7_startTransition:
                true,
              v7_relativeSplatPath:
                true,
            }}
          >
            <AdminAuthProvider>
              <Suspense
                fallback={
                  <RouteLoadingFallback />
                }
              >
                <Routes>
                  {/* COMPATIBILIDAD: /admin/login → /admin */}
                  <Route
                    path="/admin/login"
                    element={
                      <LegacyAdminLoginRedirect />
                    }
                  />

                  {/* ENTRADA ÚNICA /admin + PANEL ADMINISTRATIVO PROTEGIDO */}
                  <Route
                    element={
                      <AdminProtectedRoute />
                    }
                  >
                    <Route
                      element={
                        <CatalogCampaignScope />
                      }
                    >
                      <Route
                        path="/admin"
                        element={
                          <ProductsAdminPage />
                        }
                      />

                      <Route
                        path="/admin/catalogos"
                        element={
                          <SalesCatalogToolsPage />
                        }
                      />

                      <Route
                        path="/admin/configuracion/catalogo"
                        element={
                          <CatalogSettingsPage />
                        }
                      />
                    </Route>

                    <Route
                      path="/admin/commercial"
                      element={
                        <CommercialCenter />
                      }
                    />

                    <Route
                      path="/admin/integrations/*"
                      element={
                        <IntegrationsPage />
                      }
                    />
                  </Route>

                  {/* 404 ADMINISTRATIVO */}
                  <Route
                    path="*"
                    element={
                      <AdminNotFoundPage />
                    }
                  />
                </Routes>
              </Suspense>
            </AdminAuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
