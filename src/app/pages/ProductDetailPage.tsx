import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  useCartStore,
} from "@/modules/cart/store";

import {
  isProductPurchasable,
} from "@/modules/catalog/domain/ProductCommercialPolicy";

import {
  getNextVolumePrice,
  getVolumeUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

import {
  useProducts,
} from "@/modules/catalog/hooks/useProducts";

import type {
  Product,
} from "@/shared/types/product";

import {
  getStockPresentation,
} from "@/modules/catalog";

import {
  useProductViewers,
} from "@/modules/product-detail/hooks/useProductViewers";

import {
  useRelatedProducts,
} from "@/modules/product-detail/hooks/useRelatedProducts";

import {
  resolveProductDetailCommercialState,
} from "@/modules/product-detail/domain/ProductDetailCommercialState";

import {
  buildProductWhatsappMessage,
  buildProductWhatsappUrl,
  type ProductWhatsappIntent,
} from "@/modules/product-detail/utils/BuildProductWhatsappMessage";

import {
  FloatingButtons,
} from "@/shared/components/layout/FloatingButtons";

import {
  ImageZoomModal,
} from "@/shared/components/media/ImageZoomModal";
import { ProductCaptureButton } from "@/modules/catalog/components/ProductCaptureButton";

import {
  ProductSkeleton,
} from "@/shared/components/skeletons/ProductSkeleton";

import {
  CartSidebar,
} from "@/modules/cart/components/CartSidebar";

import {
  AddToCartModal,
} from "@/modules/cart/components/AddToCartModal";

import {
  RecentActivity,
} from "@/modules/feedback/components/RecentActivity";

import {
  ProductDetailHeader,
} from "@/modules/product-detail/components/ProductDetailHeader";

import {
  ProductShareSheet,
} from "@/modules/product-detail/components/ProductShareSheet";

import {
  resolveProductShareImage,
} from "@/modules/product-detail/utils/ProductShareAsset";

import {
  ProductGallery,
} from "@/modules/product-detail/components/ProductGallery";

import {
  RelatedProducts,
} from "@/modules/product-detail/components/RelatedProducts";

import {
  ProductSeo,
} from "@/modules/catalog";

import {
  getProductSeo,
} from "@/modules/catalog";

import {
  getProductMedia,
} from "@/shared/lib/productMedia";
import {
  ProductDetailCommercialSection,
} from "@/modules/product-detail/components/ProductDetailCommercialSection";
import {
  ProductDetailNotFound,
} from "@/modules/product-detail/components/ProductDetailNotFound";

const ProductDetailPage =
  () => {
  const {
    id:
      paramId,
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

  const location =
    useLocation();

  const fromSearch =
    location.state
      ?.fromSearch;

  const searchQuery =
    location.state
      ?.searchQuery;

  const currentCategory =
    searchParams.get(
      "cat",
    ) ||
    "";

  const id =
    searchParams.get(
      "id",
    ) ||
    paramId;

  const productCategory =
    currentCategory ||
    "todas";

  const {
    data:
      products = [],

    isLoading:
      loading,
  } =
    useProducts(
      productCategory as never,
    );

  const [
    cartOpen,
    setCartOpen,
  ] =
    useState(false);

  const [
    addModalOpen,
    setAddModalOpen,
  ] =
    useState(false);

  const [
    shareOpen,
    setShareOpen,
  ] =
    useState(false);

  const [
    selectedRelated,
    setSelectedRelated,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    zoomGallery,
    setZoomGallery,
  ] =
    useState<{
      initialIndex:
        number;
    } | null>(
      null,
    );

  const [
    qty,
    setQty,
  ] =
    useState(1);

  const [
    qtyInput,
    setQtyInput,
  ] =
    useState("1");

  const [
    lastVolumePrice,
    setLastVolumePrice,
  ] =
    useState(1);

  const [
    showUnlock,
    setShowUnlock,
  ] =
    useState(false);

  const [
    pricePulse,
    setPricePulse,
  ] =
    useState(false);

  const [
    pageReady,
    setPageReady,
  ] =
    useState(false);

  const viewers =
    useProductViewers();

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

  const product =
    useMemo(
      () =>
        products.find(
          (
            item,
          ) =>
            item.id ===
            id,
        ),
      [
        products,
        id,
      ],
    );

  const commercialState =
    useMemo(
      () =>
        product
          ? resolveProductDetailCommercialState(
              product,
            )
          : null,
      [
        product,
      ],
    );

  const available =
    commercialState
      ?.isPurchasable ??
    false;

  const isPreventa =
    commercialState
      ?.isPreventa ??
    false;

  const isAgotado =
    commercialState
      ?.isAgotado ??
    false;

  const showWhatsAppButton =
    commercialState
      ?.isConsultOnly ??
    false;

  const canShowPricing =
    commercialState
      ?.canShowPricing ??
    false;

  const canShowVolumePricing =
    commercialState
      ?.canShowVolumePricing ??
    false;

  const canSelectQuantity =
    commercialState
      ?.canSelectQuantity ??
    false;

  /*
   * Conserva el comportamiento visual de la galería:
   * publicado y preventa permanecen activos;
   * agotado conserva su presentación no disponible.
   */
  const galleryAvailable =
    available ||
    isPreventa;

  const productMedia =
    product
      ? getProductMedia(
          product,
        )
      : [];

  const productSeo =
    getProductSeo(
      product,
      id,
    );

  const productPublicUrl =
    product
      ? buildProductPublicUrl(
          product.id,
          product.category,
        )
      : "";

  /*
   * Seam provider-neutral para compartir imágenes:
   *
   * 1) futuro artefacto comercial generado/publicado por JUNG CORE;
   * 2) media ya resuelta del producto (incluye override actual de CORE);
   * 3) imagen primaria vigente.
   *
   * Cuando CORE exponga una imagen específica para redes, solo debe
   * entregarse como commercialImageUrl al resolver; ProductShareSheet
   * no necesita conocer endpoints, R2 ni proveedores.
   */
  const productShareImage =
    product
      ? resolveProductShareImage({
          product,
          media:
            productMedia,
        })
      : {
          url:
            null,
          source:
            "none" as const,
        };

  const selectedRelatedQty =
    selectedRelated
      ? (
          cart.find(
            (
              item,
            ) =>
              item.id ===
              selectedRelated.id,
          )?.qty ??
          0
        )
      : 0;
  useEffect(
    () => {
      setPageReady(
        false,
      );

      const timer =
        window.setTimeout(
          () => {
            window.scrollTo({
              top:
                0,

              left:
                0,

              behavior:
                "smooth",
            });
          },
          0,
        );

      const readyTimer =
        window.setTimeout(
          () =>
            setPageReady(
              true,
            ),
          220,
        );

      setQty(
        1,
      );

      setQtyInput(
        "1",
      );

      setLastVolumePrice(
        1,
      );

      setShowUnlock(
        false,
      );

      setPricePulse(
        false,
      );

      return () => {
        window.clearTimeout(
          timer,
        );

        window.clearTimeout(
          readyTimer,
        );
      };
    },
    [
      id,
    ],
  );

  const parsedQtyInput =
    qtyInput.trim() !==
      "" &&
    /^\d+$/.test(
      qtyInput,
    )
      ? parseInt(
          qtyInput,
          10,
        )
      : null;

  const isQtyInputValid =
    parsedQtyInput !==
      null &&
    parsedQtyInput >=
      1;

  const effectiveQty =
    isQtyInputValid
      ? parsedQtyInput
      : qty;

  /*
   * Los cálculos comerciales solo reciben la cantidad
   * seleccionada cuando el producto es comprable.
   *
   * Agotado puede mostrar precio unitario, pero nunca
   * escalas, ahorro por cantidad ni total transaccional.
   */
  const pricingQty =
    available
      ? effectiveQty
      : 1;

  const unitPrice =
    product &&
    canShowPricing
      ? getVolumeUnitPrice(
          product,
          pricingQty,
        )
      : 0;

  const total =
    available
      ? unitPrice *
        effectiveQty
      : unitPrice;

  const nextVolumePrice =
    product &&
    canShowVolumePricing
      ? getNextVolumePrice(
          product,
          effectiveQty,
        )
      : null;

  const savingsByQty =
    product &&
    available &&
    product.price_1 >
      unitPrice
      ? (
          product.price_1 -
          unitPrice
        ) *
        effectiveQty
      : 0;

  const related =
    useRelatedProducts(
      products,
      product,
    );

  const stockPresentation =
    product
      ? getStockPresentation(
          product,
          isPreventa,
        )
      : null;

  const handleBack =
    useCallback(
      () => {
        if (
          fromSearch
        ) {
          navigate(
            "/catalogo",
            {
              state: {
                restoreSearch:
                  searchQuery,
              },
            },
          );

          return;
        }

        navigate(
          currentCategory
            ? `/catalogo/categoria.html?cat=${encodeURIComponent(
                currentCategory,
              )}`
            : "/catalogo",
        );
      },
      [
        navigate,
        currentCategory,
        fromSearch,
        searchQuery,
      ],
    );

  useEffect(
    () => {
      const onKeyDown =
        (
          event:
            KeyboardEvent,
        ) => {
          const target =
            event.target as
              HTMLElement;

          const isTyping =
            [
              "INPUT",
              "TEXTAREA",
            ].includes(
              target.tagName,
            ) ||
            target.isContentEditable;

          if (
            isTyping
          ) {
            return;
          }

          if (
            event.key ===
            "Backspace"
          ) {
            event.preventDefault();

            handleBack();
          }
        };

      window.addEventListener(
        "keydown",
        onKeyDown,
      );

      return () =>
        window.removeEventListener(
          "keydown",
          onKeyDown,
        );
    },
    [
      handleBack,
    ],
  );

  const handleShare =
    useCallback(
      () => {
        if (
          !product
        ) {
          return;
        }

        setShareOpen(
          true,
        );
      },
      [
        product,
      ],
    );

  const updateQty =
    useCallback(
      (
        nextQty:
          number,
      ) => {
        if (
          !product ||
          !canSelectQuantity
        ) {
          return;
        }

        const cleanQty =
          Math.max(
            1,
            nextQty,
          );

        setQty(
          cleanQty,
        );

        setQtyInput(
          String(
            cleanQty,
          ),
        );

        const nextUnitPrice =
          getVolumeUnitPrice(
            product,
            cleanQty,
          );

        const nextVolumePriceQty =
          cleanQty >= 100
            ? 100
            : cleanQty >= 50
              ? 50
              : cleanQty >= 12
                ? 12
                : cleanQty >= 3
                  ? 3
                  : 1;

        if (
          nextVolumePriceQty >
          lastVolumePrice
        ) {
          setShowUnlock(
            true,
          );

          window.setTimeout(
            () =>
              setShowUnlock(
                false,
              ),
            1400,
          );
        }

        if (
          nextUnitPrice !==
          unitPrice
        ) {
          setPricePulse(
            true,
          );

          window.setTimeout(
            () =>
              setPricePulse(
                false,
              ),
            220,
          );
        }

        setLastVolumePrice(
          nextVolumePriceQty,
        );
      },
      [
        product,
        canSelectQuantity,
        lastVolumePrice,
        unitPrice,
      ],
    );

  const handleQtyInputChange =
    useCallback(
      (
        value:
          string,
      ) => {
        if (
          !canSelectQuantity
        ) {
          return;
        }

        if (
          value ===
            "" ||
          /^\d+$/.test(
            value,
          )
        ) {
          setQtyInput(
            value,
          );
        }
      },
      [
        canSelectQuantity,
      ],
    );

  const handleQtyInputBlur =
    useCallback(
      () => {
        if (
          !canSelectQuantity
        ) {
          return;
        }

        if (
          !isQtyInputValid
        ) {
          setQtyInput(
            String(
              qty,
            ),
          );

          return;
        }

        updateQty(
          effectiveQty,
        );
      },
      [
        canSelectQuantity,
        effectiveQty,
        isQtyInputValid,
        qty,
        updateQty,
      ],
    );

  const handleQtyInputKeyDown =
    useCallback(
      (
        event:
          React.KeyboardEvent<HTMLInputElement>,
      ) => {
        if (
          event.key ===
          "Enter"
        ) {
          event.currentTarget
            .blur();
        }
      },
      [],
    );

  const handleAddToCart =
    useCallback(
      () => {
        if (
          !product ||
          !available ||
          !isQtyInputValid ||
          !isProductPurchasable(
            product,
          )
        ) {
          return;
        }

        addToCart(
          product,
          effectiveQty,
        );

        setCartOpen(
          true,
        );
      },
      [
        product,
        available,
        isQtyInputValid,
        addToCart,
        effectiveQty,
      ],
    );

  const handleRelatedAddToCart =
    useCallback(
      (
        relatedProduct:
          Product,
      ) => {
        if (
          !isProductPurchasable(
            relatedProduct,
          )
        ) {
          return;
        }

        setSelectedRelated(
          relatedProduct,
        );

        setAddModalOpen(
          true,
        );
      },
      [],
    );

  const handleRelatedExtra =
    useCallback(
      (
        extraQty:
          number,
      ) => {
        if (
          !selectedRelated ||
          extraQty <=
            0 ||
          !isProductPurchasable(
            selectedRelated,
          )
        ) {
          return;
        }

        addToCart(
          selectedRelated,
          extraQty,
        );
      },
      [
        selectedRelated,
        addToCart,
      ],
    );

  const handleRelatedOpenCart =
    useCallback(
      () => {
        setAddModalOpen(
          false,
        );

        setCartOpen(
          true,
        );
      },
      [],
    );

  const handleWhatsApp =
    useCallback(
      () => {
        if (
          !product
        ) {
          return;
        }

        const intent:
          ProductWhatsappIntent =
            isPreventa
              ? "preorder"
              : isAgotado
                ? "restock"
                : "information";

        const message =
          buildProductWhatsappMessage(
            product,
            {
              intent,

              productUrl:
                window.location.href,
            },
          );

        window.open(
          buildProductWhatsappUrl(
            message,
          ),
          "_blank",
        );
      },
      [
        product,
        isPreventa,
        isAgotado,
      ],
    );

  if (
    loading ||
    !pageReady
  ) {
    return (
      <ProductSkeleton />
    );
  }

  if (
    !product ||
    !commercialState
      ?.isPubliclyVisible
  ) {
    return (
      <ProductDetailNotFound
        onBack={() => {
            if (
              window.history.length >
              1
            ) {
              navigate(
                -1,
              );

              return;
            }

            navigate(
              currentCategory
                ? `/catalogo/categoria.html?cat=${encodeURIComponent(
                    currentCategory,
                  )}`
                : "/catalogo",
            );
        }}
      />
    );
  }
  return (
    <div className="min-h-screen bg-background pb-28 md:pb-40">
      <ProductSeo
        seo={
          productSeo
        }
        product={
          product
        }
      />

      <ProductDetailHeader
        product={
          product
        }
        onBack={
          handleBack
        }
        onShare={
          handleShare
        }
      />

      <main className="mx-auto mt-3 w-full max-w-[1440px] px-2.5 sm:px-4 md:mt-5 md:px-5 xl:px-6">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,540px)_minmax(420px,1fr)] lg:gap-6 xl:grid-cols-[minmax(0,580px)_minmax(460px,1fr)] xl:gap-8">
          <ProductGallery
            product={
              product
            }
            available={
              galleryAvailable
            }
            onZoom={(
              index,
            ) =>
              setZoomGallery({
                initialIndex:
                  index,
              })
            }
          />

          <div className="min-w-0 lg:sticky lg:top-[118px] xl:top-[122px]">
            <ProductDetailCommercialSection
            product={product}
            available={available}
            viewers={viewers}
            stockPresentation={stockPresentation}
            canShowVolumePricing={canShowVolumePricing}
            canShowPricing={canShowPricing}
            canSelectQuantity={canSelectQuantity}
            effectiveQty={effectiveQty}
            qtyInput={qtyInput}
            unitPrice={unitPrice}
            total={total}
            pricePulse={pricePulse}
            showUnlock={showUnlock}
            savingsByQty={savingsByQty}
            nextVolumePrice={nextVolumePrice}
            isQtyInputValid={isQtyInputValid}
            showWhatsAppButton={showWhatsAppButton}
            isPreventa={isPreventa}
            isAgotado={isAgotado}
            onSelectQty={updateQty}
            onQtyInputChange={handleQtyInputChange}
            onQtyInputBlur={handleQtyInputBlur}
            onQtyInputKeyDown={handleQtyInputKeyDown}
            onWhatsApp={handleWhatsApp}
            onAddToCart={handleAddToCart}
            />
          </div>
        </div>

        <RelatedProducts
          products={
            related
          }
          cart={
            cart
          }
          onAddToCart={
            handleRelatedAddToCart
          }
          onImageClick={(
            relatedProduct,
          ) => {
            navigate(
              buildProductPublicPath(
                relatedProduct.id,
                relatedProduct.category,
              ),
            );
          }}
        />
      </main>

      <ProductShareSheet
        open={
          shareOpen
        }
        title={
          product.title
        }
        description={
          product.description
        }
        url={
          productPublicUrl
        }
        imageUrl={
          productShareImage.url
        }
        imageSource={
          productShareImage.source
        }
        pinterestEnabled={
          false
        }
        onClose={() =>
          setShareOpen(
            false,
          )
        }
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
      />

      <RecentActivity
        products={
          products
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
          productMedia
        }
        initialIndex={
          zoomGallery
            ?.initialIndex ??
          0
        }
        open={
          !!zoomGallery &&
          productMedia.length >
            0
        }
        title={
          product.title
        }
        footerAction={
          <ProductCaptureButton
            product={product}
          />
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
          selectedRelated
        }
        currentQty={
          selectedRelatedQty
        }
        onClose={() =>
          setAddModalOpen(
            false,
          )
        }
        onConfirmQuantity={
          handleRelatedExtra
        }
        onOpenCart={
          handleRelatedOpenCart
        }
        secondaryActionLabel="Seguir viendo"
        onSecondaryAction={() =>
          setAddModalOpen(
            false,
          )
        }
      />
    </div>
  );
};

export default ProductDetailPage;
import {
  buildProductPublicPath,
  buildProductPublicUrl,
} from "@/shared/config/application";
