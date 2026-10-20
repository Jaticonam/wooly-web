import { lazy, Suspense } from "react";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
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

import ExternalRedirect from "@/app/ExternalRedirect";

/*
 * W12-02: Wooly Público.
 * Las superficies administrativas (/admin/*) viven en
 * la aplicación independiente admin/ui.
 */

const HomePage = lazy(
  () => import("@/pages/HomePage"),
);

const CatalogPage = lazy(
  () => import("@/pages/CatalogPage"),
);

const CatalogPdfPage = lazy(
  () => import("@/pages/CatalogPdfPage"),
);

const ProductDetailPage = lazy(
  () => import("@/pages/ProductDetailPage"),
);

const CategoryPage = lazy(
  () => import("@/pages/CategoryPage"),
);

const BlogPage = lazy(
  () => import("@/pages/BlogPage"),
);

const BlogArticlePage = lazy(
  () => import("@/pages/BlogArticlePage"),
);

const BlogSectionPage = lazy(
  () => import("@/pages/BlogSectionPage"),
);

const NotFound = lazy(
  () => import("@/pages/NotFound"),
);

const queryClient =
  new QueryClient();

const BLOG_SECTION_PATHS = [
  "/blog/laboratorio",
  "/blog/tendencias",
  "/blog/oportunidades",
  "/blog/herramientas",
  "/blog/herramientas/:tool",
  "/blog/campanas",
  "/blog/campanas/:campaign",
  "/blog/catalogo",
  "/blog/guias",
] as const;

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
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalogo" element={<CatalogPage />} />
                  <Route path="/catalogo/pdf" element={<CatalogPdfPage />} />
                  <Route path="/catalogo/producto.html" element={<ProductDetailPage />} />
                  <Route path="/catalogo/categoria.html" element={<CategoryPage />} />

                  {/* COMPATIBILIDAD COMERCIAL */}
                  <Route path="/producto/:id" element={<ProductDetailPage />} />
                  <Route path="/categoria/:id" element={<CategoryPage />} />
                </Route>

                {/* COMPATIBILIDAD DE RUTA → Wooly Admin (otra aplicación) */}
                <Route
                  path="/ventas/catalogos"
                  element={
                    <ExternalRedirect to="/admin/catalogos" />
                  }
                />

                {/* BLOG */}
                <Route path="/blog" element={<BlogPage />} />

                {BLOG_SECTION_PATHS.map((path) => (
                  <Route
                    key={path}
                    path={path}
                    element={<BlogSectionPage />}
                  />
                ))}

                <Route path="/blog/:slug" element={<BlogArticlePage />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
