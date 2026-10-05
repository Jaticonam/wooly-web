import { useState, useCallback, useMemo } from "react";
import { SearchX } from "lucide-react";
import { useCartStore } from "@/modules/cart/store";
import { useCatalogData } from "@/modules/catalog/hooks/useCatalogData";
import { Product } from "@/shared/types/product";
import { CATEGORY_CONFIG } from "@/modules/catalog";
import { CountdownTimer } from "@/shared/components/commerce/CountdownTimer";
import { CatalogTopNav } from "@/modules/catalog/components/CatalogTopNav";
import { CatalogResultsToolbar } from "@/modules/catalog/components/CatalogResultsToolbar";
import { CatalogSectionHeader } from "@/modules/catalog/components/CatalogSectionHeader";
import { FloatingButtons } from "@/shared/components/layout/FloatingButtons";
import { ImageZoomModal } from "@/shared/components/media/ImageZoomModal";
import { CatalogSkeleton } from "@/shared/components/skeletons/CatalogSkeleton";
import { CatalogProductGrid } from "@/modules/catalog/components/CatalogProductGrid";
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

    return "Todos los productos";
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

  const handleImageClick = useCallback(
    (product: Product) => {
      const gallery =
        getProductMedia(
          product,
        );

      setZoomGallery({
        media:
          gallery,
        initialIndex:
          0,
        title:
          product.title,
        product,
      });
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

  const firstVisibleProducts =
    displayPriorityBlocks
      ? topProducts.length > 0
        ? topProducts
        : strongProducts.length > 0
          ? strongProducts
          : highlightProducts.length > 0
            ? highlightProducts
            : displayRegularProducts
      : displayRegularProducts;

  const priorityImageIds = useMemo(
    () =>
      new Set(
        firstVisibleProducts
          .slice(0, 6)
          .map(
            (product) =>
              product.id,
          ),
      ),
    [firstVisibleProducts],
  );

  const seo = getCatalogSeo(activeCategory);

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-36">
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
          <div className="space-y-3">
            <CatalogResultsToolbar
              title={resultsTitle}
              count={filteredProducts.length}
              filterCount={activeFilterCount}
              sortMode={sortMode}
              onSortChange={setSortMode}
              onOpenFilters={() => setExploreOpen(true)}
            />

            {displayPriorityBlocks && topProducts.length > 0 && (
              <section className="min-w-0 space-y-1.5">
                <CatalogSectionHeader
                  title="🔥 Más vendidos"
                  count={topProducts.length}
                />

                <CatalogProductGrid
                  products={topProducts}
                  cart={cart}
                  imagePriorityIds={priorityImageIds}
                  onAddToCart={handleAddToCart}
                  onImageClick={handleImageClick}
                />
              </section>
            )}

            {displayPriorityBlocks && strongProducts.length > 0 && (
              <section className="min-w-0 space-y-1.5">
                <CatalogSectionHeader
                  title="⭐ Recomendados"
                  count={strongProducts.length}
                />

                <CatalogProductGrid
                  products={strongProducts}
                  cart={cart}
                  imagePriorityIds={priorityImageIds}
                  onAddToCart={handleAddToCart}
                  onImageClick={handleImageClick}
                />
              </section>
            )}

            {displayPriorityBlocks && highlightProducts.length > 0 && (
              <section className="min-w-0 space-y-1.5">
                <CatalogSectionHeader
                  title="🟡 Oportunidades"
                  count={highlightProducts.length}
                />

                <CatalogProductGrid
                  products={highlightProducts}
                  cart={cart}
                  imagePriorityIds={priorityImageIds}
                  onAddToCart={handleAddToCart}
                  onImageClick={handleImageClick}
                />
              </section>
            )}

            {displayRegularProducts.length > 0 && (
              <section className="min-w-0 space-y-1.5">
                {displayPriorityBlocks && (
                  <CatalogSectionHeader
                    title="🛍️ Catálogo"
                    count={displayRegularProducts.length}
                  />
                )}

                <CatalogProductGrid
                  products={displayRegularProducts}
                  cart={cart}
                  imagePriorityIds={priorityImageIds}
                  onAddToCart={handleAddToCart}
                  onImageClick={handleImageClick}
                />
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
