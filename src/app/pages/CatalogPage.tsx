import { useState, useEffect, useCallback, useMemo } from "react";
import { SearchX } from "lucide-react";
import { useCartStore } from "@/modules/cart/store";
import { useCatalogData } from "@/modules/catalog/hooks/useCatalogData";
import { Product } from "@/shared/types/product";
import { CATEGORY_CONFIG } from "@/modules/catalog";
import { CountdownTimer } from "@/shared/components/commerce/CountdownTimer";
import { CatalogTopNav } from "@/modules/catalog/components/CatalogTopNav";
import { CatalogResultsToolbar } from "@/modules/catalog/components/CatalogResultsToolbar";
import { FloatingButtons } from "@/shared/components/layout/FloatingButtons";
import { ImageZoomModal } from "@/shared/components/media/ImageZoomModal";
import { CatalogSkeleton } from "@/shared/components/skeletons/CatalogSkeleton";
import { ProductCard } from "@/modules/catalog/components/ProductCard";
import { ProductCaptureButton } from "@/modules/catalog/components/ProductCaptureButton";
import { CartSidebar } from "@/modules/cart/components/CartSidebar";
import { AddToCartModal } from "@/modules/cart/components/AddToCartModal";
import { RecentActivity } from "@/modules/feedback/components/RecentActivity";
import { useCatalogFilters } from "@/modules/catalog/hooks/useCatalogFilters";
import { useCatalogCampaignRegistry } from "@/modules/catalog/context/CatalogCampaignRegistryContext";
import { useCatalogPrioritySections } from "@/modules/catalog/hooks/useCatalogPrioritySections";
import { CatalogExploreCenter } from "@/modules/catalog/components/CatalogExploreCenter";
import { CatalogSeo } from "@/shared/seo/catalogSeoComponent";
import { getCatalogSeo } from "@/shared/seo/catalogSeo";
import { getProductMedia, ProductMedia } from "@/shared/lib/productMedia";
import AOS from "aos";
import {
  sortCatalogProducts,
  type CatalogSortMode,
} from "@/modules/catalog/domain/CatalogResultsSort";
import {
  useCatalogNavigation,
} from "@/modules/catalog/hooks/useCatalogNavigation";

const CatalogPage = () => {
  const { activeCampaigns: catalogCampaigns } = useCatalogCampaignRegistry();
  const CATALOG_CAMPAIGNS = catalogCampaigns;
  const {
    activeCategory,
    activeCampaign,
    searchQuery,
    setSearchQuery,
    selectCategory:
      handleCategorySelect,
    selectCampaign:
      handleCampaignSelect,
    resetCatalog:
      handleResetCatalog,
  } = useCatalogNavigation(
    CATALOG_CAMPAIGNS,
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [zoomGallery, setZoomGallery] = useState<{
    media: ProductMedia[];
    initialIndex: number;
    title: string;
    product: Product;
  } | null>(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [sortMode, setSortMode] = useState<CatalogSortMode>("featured");

  const {
    cart,
    addToCart,
    totalItems,
    totalPrice,
    savings,
    removeFromCart,
    changeQty,
    setExactQty,
    setItemNote,
    replaceCart,
    clearCart,
  } = useCartStore();

  const {
    data: products = [],
    isLoading: loading,
    isFullCatalogLoaded,
    isCategoryLoading,
  } = useCatalogData(activeCategory);

  const {
    filteredProducts,
    categoryCounts,
    campaignCounts,
    visibleCategories,
  } = useCatalogFilters({
    products,
    activeCategory,
    activeCampaign,
    searchQuery,
    showCounts: isFullCatalogLoaded,
  });

  const activeCat =
    activeCategory !== "todas"
      ? CATEGORY_CONFIG.find((c) => c.id === activeCategory)
      : null;

  const activeCampaignData = activeCampaign
    ? CATALOG_CAMPAIGNS.find((c) => c.id === activeCampaign)
    : null;

  const isDefaultCatalogContext =
    activeCategory === "todas" &&
    !activeCampaign &&
    !searchQuery.trim();

  const resultsTitle = useMemo(() => {
    const term = searchQuery.trim();

    if (term) {
      return `Resultados para “${term}”`;
    }

    if (activeCat && activeCampaignData) {
      return `${activeCat.name} · ${activeCampaignData.name}`;
    }

    if (activeCampaignData) {
      return activeCampaignData.name;
    }

    if (activeCat) {
      return activeCat.name;
    }

    return "";
  }, [searchQuery, activeCat, activeCampaignData]);

  const activeFilterCount =
    (activeCategory !== "todas" ? 1 : 0) +
    (activeCampaign ? 1 : 0);

  const sortedFilteredProducts = useMemo(
    () => sortCatalogProducts(filteredProducts, sortMode),
    [filteredProducts, sortMode],
  );

  const hasCustomSort = sortMode !== "featured";

  const handleAddToCart = useCallback(
    (product: Product) => {
      setSelectedProduct(product);
      setAddModalOpen(true);
    },
    [],
  );

  const handleCloseAddModal = useCallback(() => setAddModalOpen(false), []);

  const handleAddExtra = useCallback(
    (qty: number) => {
      if (selectedProduct && qty > 0) addToCart(selectedProduct, qty);
    },
    [addToCart, selectedProduct],
  );

  const currentQtyInCart = selectedProduct
    ? (cart.find((item) => item.id === selectedProduct.id)?.qty ?? 0)
    : 0;

  const renderGrid = (items: Product[]) => (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1.5 md:grid-cols-4 md:gap-2 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {items.map((p, index) => (
        <div key={p.id} data-aos="fade-up" data-aos-delay={(index % 7) * 30}>
          <ProductCard
            product={p}
            cart={cart}
            onAddToCart={handleAddToCart}
            onImageClick={(product) => {
              const gallery = getProductMedia(product);

              setZoomGallery({
                media: gallery,
                initialIndex: 0,
                title: product.title,
                product,
              });
            }}
          />
        </div>
      ))}
    </div>
  );

  const {
    showPriorityBlocks,
    topProducts,
    strongProducts,
    highlightProducts,
    regularProducts,
  } = useCatalogPrioritySections({
    products,
    filteredProducts,
    activeCategory,
    activeCampaign,
    searchQuery,
  });

  const displayPriorityBlocks =
    showPriorityBlocks && !hasCustomSort;

  const displayRegularProducts =
    hasCustomSort
      ? sortedFilteredProducts
      : regularProducts;

  const seo = getCatalogSeo(activeCategory);

  useEffect(() => {
    if (loading || products.length === 0) return;

    const timer = setTimeout(() => {
      AOS.refresh();
    }, 120);

    return () => clearTimeout(timer);
  }, [loading, products.length]);

  return (
    <div className="min-h-screen bg-background pb-40">
      <CatalogSeo seo={seo} />

      <header className="sticky top-0 z-[100] flex w-full flex-col">
        <CountdownTimer />

        <CatalogTopNav
          products={products}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={visibleCategories}
          activeCategory={activeCategory}
          categoryCounts={categoryCounts}
          onCategorySelect={handleCategorySelect}
          campaigns={CATALOG_CAMPAIGNS}
          activeCampaign={activeCampaign}
          campaignCounts={campaignCounts}
          showCampaigns={CATALOG_CAMPAIGNS.length > 0}
          onCampaignSelect={handleCampaignSelect}
          cartCount={totalItems}
          onCartClick={() => setCartOpen(true)}
          onExploreClick={() => setExploreOpen(true)}
        />
      </header>

      <main className="mx-auto mt-3 w-full max-w-[1680px] px-2 sm:px-3 md:mt-4 md:px-4 xl:px-5">
        {loading ? (
          <CatalogSkeleton />
        ) : isCategoryLoading && filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="mb-4 rounded-full bg-muted p-6">
              <SearchX className="h-10 w-10 opacity-30" />
            </div>

            <p className="text-center text-sm font-black tracking-widest">
              Cargando categoría...
            </p>

            <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
              Estamos preparando los productos de esta sección.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="mb-4 rounded-full bg-muted p-6">
              <SearchX className="h-10 w-10 opacity-30" />
            </div>

            <p className="text-center text-sm font-black tracking-widest">
              Sin resultados
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <CatalogResultsToolbar
              title={resultsTitle}
              count={filteredProducts.length}
              compact={isDefaultCatalogContext}
              filterCount={activeFilterCount}
              sortMode={sortMode}
              onSortChange={setSortMode}
              onOpenFilters={() => setExploreOpen(true)}
            />

            {displayPriorityBlocks && topProducts.length > 0 && (
              <section className="space-y-2">
                <div className="px-1 md:px-0">
                  <h2 className="text-[15px] font-black text-foreground md:text-base">
                    🔥 Más vendidos
                  </h2>
                </div>

                {renderGrid(topProducts)}
              </section>
            )}

            {displayPriorityBlocks && strongProducts.length > 0 && (
              <section className="space-y-2">
                <div className="px-1 md:px-0">
                  <h2 className="text-[15px] font-black text-foreground md:text-base">
                    ⭐ Recomendados
                  </h2>
                </div>

                {renderGrid(strongProducts)}
              </section>
            )}

            {displayPriorityBlocks && highlightProducts.length > 0 && (
              <section className="space-y-2">
                <div className="px-1 md:px-0">
                  <h2 className="text-[15px] font-black text-foreground md:text-base">
                    🟡 Oportunidades
                  </h2>
                </div>

                {renderGrid(highlightProducts)}
              </section>
            )}

            {displayRegularProducts.length > 0 && (
              <section className="space-y-2">
                {displayPriorityBlocks && (
                  <div className="px-1 md:px-0">
                    <h2 className="text-[15px] font-black text-foreground md:text-base">
                      🛍️ Catálogo
                    </h2>
                  </div>
                )}

                {renderGrid(displayRegularProducts)}
              </section>
            )}
          </div>
        )}
      </main>

      <CatalogExploreCenter
        open={exploreOpen}
        activeCampaign={activeCampaign}
        activeCategory={activeCategory}
        activeCampaignName={activeCampaignData?.name}
        activeCategoryName={activeCat?.name}
        campaigns={CATALOG_CAMPAIGNS}
        campaignCounts={campaignCounts}
        categoryCounts={categoryCounts}
        categories={visibleCategories}
        cartCount={totalItems}
        onClose={() => setExploreOpen(false)}
        onResetCatalog={handleResetCatalog}
        onCampaignSelect={handleCampaignSelect}
        onCategorySelect={handleCategorySelect}
        onOpenCart={() => setCartOpen(true)}
      />

      <RecentActivity products={products} />

      <FloatingButtons
        cartCount={totalItems}
        onCartClick={() => setCartOpen(true)}
        showCart={false}
      />

      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        totalItems={totalItems}
        totalPrice={totalPrice}
        savings={savings}
        onRemove={removeFromCart}
        onChangeQty={changeQty}
        onSetQty={setExactQty}
        onChangeNote={setItemNote}
        onClearCart={clearCart}
        onReplaceCart={replaceCart}
      />

      <ImageZoomModal
        media={zoomGallery?.media ?? []}
        initialIndex={zoomGallery?.initialIndex ?? 0}
        open={!!zoomGallery}
        title={zoomGallery?.title ?? ""}
        footerAction={
          zoomGallery?.product ? (
            <ProductCaptureButton product={zoomGallery.product} />
          ) : undefined
        }
        onClose={() => setZoomGallery(null)}
      />

      <AddToCartModal
        open={addModalOpen}
        product={selectedProduct}
        currentQty={currentQtyInCart}
        onClose={handleCloseAddModal}
        onConfirmQuantity={handleAddExtra}
        onOpenCart={() => {
          setAddModalOpen(false);
          setCartOpen(true);
        }}
      />
    </div>
  );
};

export default CatalogPage;
