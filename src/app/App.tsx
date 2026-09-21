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
} from "react-router-dom";

import {
  HelmetProvider,
} from "react-helmet-async";

import {
  Toaster,
} from "@/shared/components/ui/toaster";

import {
  Toaster as Sonner,
} from "@/shared/components/ui/sonner";

import {
  TooltipProvider,
} from "@/shared/components/ui/tooltip";

const HomePage = lazy(
  () => import("@/app/pages/HomePage"),
);

const CatalogPage = lazy(
  () => import("@/app/pages/CatalogPage"),
);

const CatalogPdfPage = lazy(
  () => import("@/app/pages/CatalogPdfPage"),
);

const SalesCatalogToolsPage = lazy(
  () => import("@/app/pages/SalesCatalogToolsPage"),
);

const ProductsAdminPage = lazy(
  () => import("@/app/pages/ProductsAdminPage"),
);

const ProductDetailPage = lazy(
  () => import("@/app/pages/ProductDetailPage"),
);

const CategoryPage = lazy(
  () => import("@/app/pages/CategoryPage"),
);

const BlogPage = lazy(
  () => import("@/app/pages/BlogPage"),
);

const BlogArticlePage = lazy(
  () => import("@/app/pages/BlogArticlePage"),
);

const BlogSectionPage = lazy(
  () => import("@/app/pages/BlogSectionPage"),
);

const NotFound = lazy(
  () => import("@/app/pages/NotFound"),
);

const IntegrationsPage = lazy(
  () => import("@/modules/integrations/pages/IntegrationsPage"),
);

const CommercialCenter = lazy(
  () => import("@/modules/commercial/pages/CommercialCenter"),
);

import {
  CatalogCampaignRegistryProvider,
} from "@/modules/catalog/context/CatalogCampaignRegistryContext";

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

function CommerceCampaignScope() {
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
            <Suspense
              fallback={
                <RouteLoadingFallback />
              }
            >
              <Routes>
              {/* SUPERFICIES COMERCIALES */}
              <Route
                element={
                  <CommerceCampaignScope />
                }
              >
                <Route
                  path="/"
                  element={
                    <HomePage />
                  }
                />

                <Route
                  path="/catalogo"
                  element={
                    <CatalogPage />
                  }
                />

                <Route
                  path="/catalogo/pdf"
                  element={
                    <CatalogPdfPage />
                  }
                />

                {/* PANEL ADMINISTRATIVO */}
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

                {/* COMPATIBILIDAD DE RUTA */}
                <Route
                  path="/ventas/catalogos"
                  element={
                    <Navigate
                      to="/admin/catalogos"
                      replace
                    />
                  }
                />

                <Route
                  path="/catalogo/producto.html"
                  element={
                    <ProductDetailPage />
                  }
                />

                <Route
                  path="/catalogo/categoria.html"
                  element={
                    <CategoryPage />
                  }
                />

                {/* COMPATIBILIDAD COMERCIAL */}
                <Route
                  path="/producto/:id"
                  element={
                    <ProductDetailPage />
                  }
                />

                <Route
                  path="/categoria/:id"
                  element={
                    <CategoryPage />
                  }
                />
              </Route>

              {/* BLOG */}
              <Route
                path="/blog"
                element={
                  <BlogPage />
                }
              />

              <Route
                path="/blog/laboratorio"
                element={
                  <BlogSectionPage />
                }
              />

              <Route
                path="/blog/tendencias"
                element={
                  <BlogSectionPage />
                }
              />

              <Route
                path="/blog/oportunidades"
                element={
                  <BlogSectionPage />
                }
              />

              <Route
                path="/blog/herramientas"
                element={
                  <BlogSectionPage />
                }
              />

              <Route
                path="/blog/herramientas/:tool"
                element={
                  <BlogSectionPage />
                }
              />

              <Route
                path="/blog/campanas"
                element={
                  <BlogSectionPage />
                }
              />

              <Route
                path="/blog/campanas/:campaign"
                element={
                  <BlogSectionPage />
                }
              />

              <Route
                path="/blog/catalogo"
                element={
                  <BlogSectionPage />
                }
              />

              <Route
                path="/blog/guias"
                element={
                  <BlogSectionPage />
                }
              />

              <Route
                path="/blog/:slug"
                element={
                  <BlogArticlePage />
                }
              />

              {/* COMMERCIAL CENTER */}
              <Route
                path="/admin/commercial"
                element={
                  <CommercialCenter />
                }
              />

              {/* WOOLY CONNECT */}
              <Route
                path="/admin/integrations"
                element={
                  <IntegrationsPage />
                }
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <NotFound />
                }
              />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
