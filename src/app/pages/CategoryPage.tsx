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
  useCategoryProducts,
} from "@/modules/category/hooks/useCategoryProducts";

import {
  filterCategoryProducts,
} from "@/modules/category/utils/filterCategoryProducts";

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
  CategoryGrid,
} from "@/modules/category/components/CategoryGrid";

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

  const categoryId =
    searchParams.get(
      "cat",
    ) ||
    paramCategoryId;

  const activeCategory =
    categoryId ||
    "todas";

  const {
    products:
      allProducts,
    loading,
  } =
    useCategoryProducts();

  const [
    cartOpen,
    setCartOpen,
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
        categoryId ===
        "todas"
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
      categoryId,
      navigate,
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
      categoryId,
    ],
  );

  const categoryInfo =
    CATEGORY_CONFIG.find(
      (category) =>
        category.id ===
        activeCategory,
    );

  const {
    categoryProducts,
    filteredProducts,
  } =
    useMemo(
      () =>
        filterCategoryProducts(
          allProducts,
          activeCategory,
          categorySearch,
        ),
      [
        allProducts,
        activeCategory,
        categorySearch,
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

  const categoryCounts =
    useMemo(
      () => {
        const counts:
          Record<
            string,
            number
          > = {
            todas:
              allProducts.length,
          };

        for (
          const product of
          allProducts
        ) {
          counts[
            product.category
          ] =
            (
              counts[
                product.category
              ] ||
              0
            ) +
            1;
        }

        return counts;
      },
      [
        allProducts,
      ],
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
        if (
          id ===
          "todas"
        ) {
          navigate(
            "/catalogo",
          );

          return;
        }

        navigate(
          `/catalogo/categoria.html?cat=${encodeURIComponent(
            id,
          )}`,
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
            CATEGORY_CONFIG
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
            []
          }
          activeCampaign=""
          campaignCounts={{
          }}
          showCampaigns={
            false
          }
          onCampaignSelect={() => {
            return;
          }}
          cartCount={
            totalItems
          }
          onCartClick={() =>
            setCartOpen(
              true,
            )
          }
          onExploreClick={() =>
            navigate(
              "/catalogo",
            )
          }
          searchPlaceholder={`¿Qué buscas en ${title.toLowerCase()}?`}
        />
      </header>

      <main className="mx-auto mt-3 w-full max-w-[1680px] px-2 sm:px-3 md:mt-4 md:px-4 xl:px-5">
        {loading ? (
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
                1
              }
              sortMode={
                sortMode
              }
              onSortChange={
                setSortMode
              }
              onOpenFilters={() => {
                return;
              }}
              showFilter={
                false
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
              <CategoryGrid
                products={
                  sortedProducts
                }
                cart={
                  cart
                }
                onAddToCart={
                  handleAddToCart
                }
                onImageClick={(
                  product,
                ) =>
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
                  })
                }
              />
            )}
          </div>
        )}
      </main>

      <FloatingButtons
        cartCount={
          totalItems
        }
        onCartClick={() =>
          setCartOpen(
            true,
          )
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
