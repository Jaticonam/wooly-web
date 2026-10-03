import { useState, useEffect, useCallback } from "react";
import { SearchX } from "lucide-react";
import { useCartStore } from "@/modules/cart/store";
import { useCatalogData } from "@/modules/catalog/hooks/useCatalogData";
import { Product } from "@/shared/types/product";
import { CATEGORY_CONFIG } from "@/modules/catalog";
import { CountdownTimer } from "@/shared/components/commerce/CountdownTimer";
import { CatalogTopNav } from "@/modules/catalog/components/CatalogTopNav";
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
    <div className="grid grid-cols-2 gap-[3px] md:grid-cols-3 md:gap-2 xl:grid-cols-5 xl:gap-2">
      {items.map((p, index) => (
        <div key={p.id} data-aos="fade-up" data-aos-delay={(index % 5) * 40}>
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
        />
      </header>

      <main className="mx-auto mt-6 max-w-7xl px-2 md:mt-8 md:px-4">
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
          <div className="space-y-8">
            {showPriorityBlocks && topProducts.length > 0 && (
              <section className="space-y-3">
                <div className="px-2 md:px-0">
                  <h2 className="text-lg font-black text-foreground md:text-xl">
                    🔥 Lo más vendido hoy
                  </h2>
                  <p className="text-[12px] font-medium text-muted-foreground">
                    Productos con mayor rotación ahora mismo.
                  </p>
                </div>

                {renderGrid(topProducts)}
              </section>
            )}

            {showPriorityBlocks && strongProducts.length > 0 && (
              <section className="space-y-3">
                <div className="px-2 md:px-0">
                  <h2 className="text-lg font-black text-foreground md:text-xl">
                    ⭐ Recomendados para vender rápido
                  </h2>
                  <p className="text-[12px] font-medium text-muted-foreground">
                    Seleccionados para vender fácil y mover stock.
                  </p>
                </div>

                {renderGrid(strongProducts)}
              </section>
            )}

            {showPriorityBlocks && highlightProducts.length > 0 && (
              <section className="space-y-3">
                <div className="px-2 md:px-0">
                  <h2 className="text-lg font-black text-foreground md:text-xl">
                    🟡 Oportunidades del catálogo
                  </h2>
                  <p className="text-[12px] font-medium text-muted-foreground">
                    Opciones para ampliar tu oferta y comprar con estrategia.
                  </p>
                </div>

                {renderGrid(highlightProducts)}
              </section>
            )}

            {regularProducts.length > 0 && (
              <section className="space-y-3">
                <div className="px-2 md:px-0">
                  <h2 className="text-lg font-black text-foreground md:text-xl">
                    {showPriorityBlocks
                      ? "🛍️ Todo el catálogo"
                      : "🛍️ Resultados"}
                  </h2>

                  <p className="text-[12px] font-medium text-muted-foreground">
                    {showPriorityBlocks
                      ? "Explora todos los productos disponibles para tu negocio."
                      : "Productos encontrados según tu búsqueda, campaña o categoría."}
                  </p>
                </div>

                {renderGrid(regularProducts)}
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
        onExploreClick={() => setExploreOpen(true)}
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
