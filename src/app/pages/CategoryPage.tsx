import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  useCartStore,
} from "@/modules/cart/store";

import {
  useCatalogData,
} from "@/modules/catalog/hooks/useCatalogData";

import {
  useCatalogFilters,
} from "@/modules/catalog/hooks/useCatalogFilters";

import {
  isCatalogCategory,
} from "@/modules/catalog/hooks/useCatalogNavigation";

import type {
  Product,
} from "@/shared/types/product";

import {
  CartSidebar,
} from "@/modules/cart/components/CartSidebar";

import {
  AddToCartModal,
} from "@/modules/cart/components/AddToCartModal";

import {
  CategoryEmpty,
} from "@/modules/category/components/CategoryEmpty";

import {
  CatalogProductGrid,
} from "@/modules/catalog/components/CatalogProductGrid";

import {
  FloatingButtons,
} from "@/shared/components/layout/FloatingButtons";

import {
  ImageZoomModal,
} from "@/shared/components/media/ImageZoomModal";

import {
  ProductCaptureButton,
} from "@/modules/catalog/components/ProductCaptureButton";

import {
  CategorySkeleton,
} from "@/shared/components/skeletons/CategorySkeleton";

import {
  RecentActivity,
} from "@/modules/feedback/components/RecentActivity";

import {
  CATEGORY_CONFIG,
} from "@/modules/catalog";

import {
  getProductMedia,
  type ProductMedia,
} from "@/shared/lib/productMedia";

import {
  CountdownTimer,
} from "@/shared/components/commerce/CountdownTimer";

import {
  CatalogTopNav,
} from "@/modules/catalog/components/CatalogTopNav";

import {
  CatalogResultsToolbar,
} from "@/modules/catalog/components/CatalogResultsToolbar";

import {
  CatalogExploreCenter,
} from "@/modules/catalog/components/CatalogExploreCenter";

import {
  useCatalogCampaignRegistry,
} from "@/modules/catalog/context/CatalogCampaignRegistryContext";

import {
  buildCategoryCatalogRoute,
  buildCategoryCampaignRoute,
} from "@/modules/category/utils/CategoryCatalogNavigation";

import {
  sortCatalogProducts,
  type CatalogSortMode,
} from "@/modules/catalog/domain/CatalogResultsSort";

const CategoryPage =
  () => {
  const {
    id:
      paramCategoryId,
  } =
    useParams<{
      id:
        string;
    }>();

  const [
    searchParams,
  ] =
    useSearchParams();

  const navigate =
    useNavigate();

  const requestedCategory =
    searchParams.get(
      "cat",
    ) ||
    paramCategoryId ||
    "todas";

  const activeCategory =
    isCatalogCategory(
      requestedCategory,
    )
      ? requestedCategory
      : "todas";

  const {
    data:
      allProducts = [],
    isLoading:
      loading,
    isCategoryLoading,
    isFullCatalogLoaded,
  } =
    useCatalogData(
      activeCategory,
    );

  const {
    activeCampaigns,
  } =
    useCatalogCampaignRegistry();

  const [
    cartOpen,
    setCartOpen,
  ] =
    useState(false);

  const [
    exploreOpen,
    setExploreOpen,
  ] =
    useState(false);

  const [
    categorySearch,
    setCategorySearch,
  ] =
    useState("");

  const [
    sortMode,
    setSortMode,
  ] =
    useState<CatalogSortMode>(
      "featured",
    );

  const [
    addModalOpen,
    setAddModalOpen,
  ] =
    useState(false);

  const [
    selectedProduct,
    setSelectedProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    zoomGallery,
    setZoomGallery,
  ] =
    useState<{
      media:
        ProductMedia[];
      initialIndex:
        number;
      title:
        string;
      product:
        Product;
    } | null>(
      null,
    );

  const {
    cart,
    addToCart,
    removeFromCart,
    changeQty,
    setExactQty,
    setItemNote,
    replaceCart,
    clearCart,
    totalItems,
    totalPrice,
    savings,
  } =
    useCartStore();

  useEffect(
    () => {
      if (
        requestedCategory ===
          "todas" ||
        !isCatalogCategory(
          requestedCategory,
        )
      ) {
        navigate(
          "/catalogo",
          {
            replace:
              true,
          },
        );
      }
    },
    [
      navigate,
      requestedCategory,
    ],
  );

  useEffect(
    () => {
      const campaignId =
        searchParams.get(
          "cpg",
        );

      if (
        !campaignId
      ) {
        return;
      }

      navigate(
        buildCategoryCampaignRoute(
          activeCategory,
          campaignId,
        ),
        {
          replace:
            true,
        },
      );
    },
    [
      activeCategory,
      navigate,
      searchParams,
    ],
  );

  useEffect(
    () => {
      setCategorySearch(
        "",
      );

      setSortMode(
        "featured",
      );
    },
    [
      activeCategory,
    ],
  );

  const {
    filteredProducts,
    categoryCounts,
    campaignCounts,
    visibleCategories,
  } =
    useCatalogFilters({
      products:
        allProducts,
      activeCategory,
      activeCampaign:
        "",
      searchQuery:
        categorySearch,
      showCounts:
        isFullCatalogLoaded,
    });

  const categoryProducts =
    useMemo(
      () =>
        activeCategory ===
        "todas"
          ? allProducts
          : allProducts.filter(
              (
                product,
              ) =>
                product.category ===
                activeCategory,
            ),
      [
        activeCategory,
        allProducts,
      ],
    );

  const sortedProducts =
    useMemo(
      () =>
        sortCatalogProducts(
          filteredProducts,
          sortMode,
        ),
      [
        filteredProducts,
        sortMode,
      ],
    );

  const priorityImageIds =
    useMemo(
      () =>
        new Set(
          sortedProducts
            .slice(
              0,
              6,
            )
            .map(
              (
                product,
              ) =>
                product.id,
            ),
        ),
      [
        sortedProducts,
      ],
    );

  const categoryInfo =
    CATEGORY_CONFIG.find(
      (
        category,
      ) =>
        category.id ===
        activeCategory,
    );

  const hasSearch =
    categorySearch
      .trim()
      .length >
    0;

  const title =
    categoryInfo
      ?.name ||
    "Categoría";

  const handleCategorySelect =
    useCallback(
      (
        id:
          string,
      ) => {
        setExploreOpen(
          false,
        );

        navigate(
          buildCategoryCatalogRoute(
            id,
          ),
        );
      },
      [
        navigate,
      ],
    );

  const handleCampaignSelect =
    useCallback(
      (
        campaignId:
          string,
      ) => {
        setExploreOpen(
          false,
        );

        if (
          !campaignId
        ) {
          return;
        }

        navigate(
          buildCategoryCampaignRoute(
            activeCategory,
            campaignId,
          ),
        );
      },
      [
        activeCategory,
        navigate,
      ],
    );

  const handleResetCatalog =
    useCallback(
      () => {
        setExploreOpen(
          false,
        );

        navigate(
          "/catalogo",
        );
      },
      [
        navigate,
      ],
    );

  const handleAddToCart =
    useCallback(
      (
        product:
          Product,
      ) => {
        setSelectedProduct(
          product,
        );

        setAddModalOpen(
          true,
        );
      },
      [],
    );

  const handleImageClick =
    useCallback(
      (
        product:
          Product,
      ) => {
        setZoomGallery({
          media:
            getProductMedia(
              product,
            ),
          initialIndex:
            0,
          title:
            product.title,
          product,
        });
      },
      [],
    );

  const handleAddExtra =
    useCallback(
      (
        qty:
          number,
      ) => {
        if (
          selectedProduct &&
          qty >
            0
        ) {
          addToCart(
            selectedProduct,
            qty,
          );
        }
      },
      [
        addToCart,
        selectedProduct,
      ],
    );

  const currentQtyInCart =
    selectedProduct
      ? (
          cart.find(
            (
              item,
            ) =>
              item.id ===
              selectedProduct.id,
          )?.qty ??
          0
        )
      : 0;

  const showLoading =
    loading ||
    (
      isCategoryLoading &&
      filteredProducts.length ===
        0
    );

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-36">
      <header className="sticky top-0 z-[100] flex w-full flex-col">
        <CountdownTimer />

        <CatalogTopNav
          products={
            categoryProducts
          }
          searchQuery={
            categorySearch
          }
          onSearchChange={
            setCategorySearch
          }
          categories={
            visibleCategories
          }
          activeCategory={
            activeCategory
          }
          categoryCounts={
            categoryCounts
          }
          onCategorySelect={
            handleCategorySelect
          }
          campaigns={
            activeCampaigns
          }
          activeCampaign=""
          campaignCounts={
            campaignCounts
          }
          showCampaigns={
            activeCampaigns.length >
            0
          }
          onCampaignSelect={
            handleCampaignSelect
          }
          cartCount={
            totalItems
          }
          onCartClick={() =>
            setCartOpen(
              true,
            )
          }
          onExploreClick={() =>
            setExploreOpen(
              true,
            )
          }
          searchPlaceholder={`¿Qué buscas en ${title.toLowerCase()}?`}
        />
      </header>

      <main className="mx-auto mt-3 w-full max-w-[1680px] px-2 sm:px-3 md:mt-4 md:px-4 xl:px-5">
        {showLoading ? (
          <CategorySkeleton />
        ) : (
          <div className="space-y-3">
            <CatalogResultsToolbar
              title={
                title
              }
              count={
                sortedProducts.length
              }
              filterCount={
                activeCategory ===
                "todas"
                  ? 0
                  : 1
              }
              sortMode={
                sortMode
              }
              onSortChange={
                setSortMode
              }
              onOpenFilters={() =>
                setExploreOpen(
                  true,
                )
              }
            />

            {sortedProducts.length ===
            0 ? (
              <CategoryEmpty
                hasSearch={
                  hasSearch
                }
                onClearSearch={() =>
                  setCategorySearch(
                    "",
                  )
                }
              />
            ) : (
              <CatalogProductGrid
                products={
                  sortedProducts
                }
                cart={
                  cart
                }
                imagePriorityIds={
                  priorityImageIds
                }
                onAddToCart={
                  handleAddToCart
                }
                onImageClick={
                  handleImageClick
                }
              />
            )}
          </div>
        )}
      </main>

      <CatalogExploreCenter
        open={
          exploreOpen
        }
        activeCampaign=""
        activeCategory={
          activeCategory
        }
        activeCategoryName={
          title
        }
        campaignCounts={
          campaignCounts
        }
        categoryCounts={
          categoryCounts
        }
        categories={
          visibleCategories
        }
        campaigns={
          activeCampaigns
        }
        cartCount={
          totalItems
        }
        onClose={() =>
          setExploreOpen(
            false,
          )
        }
        onResetCatalog={
          handleResetCatalog
        }
        onCampaignSelect={
          handleCampaignSelect
        }
        onCategorySelect={
          handleCategorySelect
        }
        onOpenCart={() => {
          setExploreOpen(
            false,
          );

          setCartOpen(
            true,
          );
        }}
      />

      <FloatingButtons
        cartCount={
          totalItems
        }
        onCartClick={() =>
          setCartOpen(
            true,
          )
        }
        showCart={
          false
        }
      />

      <RecentActivity
        products={
          allProducts
        }
      />

      <CartSidebar
        isOpen={
          cartOpen
        }
        onClose={() =>
          setCartOpen(
            false,
          )
        }
        cart={
          cart
        }
        totalItems={
          totalItems
        }
        totalPrice={
          totalPrice
        }
        savings={
          savings
        }
        onRemove={
          removeFromCart
        }
        onChangeQty={
          changeQty
        }
        onSetQty={
          setExactQty
        }
        onChangeNote={
          setItemNote
        }
        onClearCart={
          clearCart
        }
        onReplaceCart={
          replaceCart
        }
      />

      <ImageZoomModal
        media={
          zoomGallery
            ?.media ??
          []
        }
        initialIndex={
          zoomGallery
            ?.initialIndex ??
          0
        }
        open={
          !!zoomGallery
        }
        title={
          zoomGallery
            ?.title ??
          ""
        }
        footerAction={
          zoomGallery
            ?.product ? (
              <ProductCaptureButton
                product={
                  zoomGallery.product
                }
              />
            ) : undefined
        }
        onClose={() =>
          setZoomGallery(
            null,
          )
        }
      />

      <AddToCartModal
        open={
          addModalOpen
        }
        product={
          selectedProduct
        }
        currentQty={
          currentQtyInCart
        }
        onClose={() =>
          setAddModalOpen(
            false,
          )
        }
        onConfirmQuantity={
          handleAddExtra
        }
        onOpenCart={() => {
          setAddModalOpen(
            false,
          );

          setCartOpen(
            true,
          );
        }}
      />
    </div>
  );
};

export default CategoryPage;
