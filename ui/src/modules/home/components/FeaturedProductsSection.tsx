import {
  useCallback,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowRight,
  Flame,
  RefreshCw,
  SearchX,
} from "lucide-react";

import {
  isProductPurchasable,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import {
  ProductCard,
} from "@/modules/catalog/components/ProductCard";

import {
  useCartStore,
} from "@/modules/cart/store";

import {
  CartSidebar,
} from "@/modules/cart/components/CartSidebar";

import {
  AddToCartModal,
} from "@/modules/cart/components/AddToCartModal";

import {
  ImageZoomModal,
} from "@/components/media/ImageZoomModal";
import { ProductCaptureButton } from "@/modules/catalog/components/ProductCaptureButton";

import type {
  Product,
} from "@wooly/contracts/types/product";

import HomeSectionHeader from "./HomeSectionHeader";
import {
  FEATURED_PRODUCTS_LIMIT,
  useFeaturedProducts,
} from "@/modules/home/hooks/useFeaturedProducts";

export default function FeaturedProductsSection() {
  const {
    featuredProducts,
    loading,
    reshuffle:
      handleShuffle,
  } = useFeaturedProducts();

  const [
    cartOpen,
    setCartOpen,
  ] = useState(false);

  const [
    addModalOpen,
    setAddModalOpen,
  ] = useState(false);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<Product | null>(
    null,
  );

  const [
    zoomImage,
    setZoomImage,
  ] = useState<{
    src:
      string;

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

  const handleAddToCart =
    useCallback(
      (
        product:
          Product,
      ) => {
        if (
          !isProductPurchasable(
            product,
          )
        ) {
          return;
        }

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
          !selectedProduct ||
          qty <= 0 ||
          !isProductPurchasable(
            selectedProduct,
          )
        ) {
          return;
        }

        addToCart(
          selectedProduct,
          qty,
        );
      },
      [
        addToCart,
        selectedProduct,
      ],
    );

  return (
    <section className="home-container featured-products-section">
      <div className="featured-products-header">
        <div data-aos="fade-up">
          <HomeSectionHeader
            icon={
              Flame
            }
            kicker="alta rotación"
            title="Productos que se venden solos"
            description="Priorizamos productos fuertes y rotamos opciones para descubrir nuevas oportunidades."
          />
        </div>

        <div
          className="featured-products-actions"
          data-aos="fade-up"
          data-aos-delay="120"
        >
          <button
            onClick={
              handleShuffle
            }
            className="featured-products-shuffle"
          >
            <RefreshCw className="h-4 w-4" />
            Cambiar selección
          </button>

          <Link
            to="/catalogo"
            className="featured-products-link"
          >
            Ver catálogo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="featured-products-grid">
          {Array.from({
            length:
              FEATURED_PRODUCTS_LIMIT,
          }).map(
            (
              _,
              index,
            ) => (
              <div
                key={
                  index
                }
                className="featured-product-skeleton"
              />
            ),
          )}
        </div>
      ) : featuredProducts.length ===
        0 ? (
        <div
          className="featured-products-empty"
          data-aos="fade-up"
        >
          <SearchX className="mb-3 h-8 w-8 opacity-40" />

          <p>
            Aún no hay productos prioritarios disponibles.
          </p>

          <small>
            Usa prioridad 80, 90 o 100 en productos publicados y con stock.
          </small>
        </div>
      ) : (
        <div className="featured-products-grid">
          {featuredProducts.map(
            (
              product,
              index,
            ) => (
              <div
                key={
                  product.id
                }
                data-aos="fade-up"
                data-aos-delay={
                  (
                    index %
                    4
                  ) *
                  50
                }
              >
                <ProductCard
                  product={
                    product
                  }
                  cart={
                    cart
                  }
                  onAddToCart={
                    handleAddToCart
                  }
                  onImageClick={(
                    selected,
                  ) =>
                    setZoomImage({
                      src:
                        selected.img ||
                        "/placeholder.svg",

                      title:
                        selected.title,

                      product:
                        selected,
                    })
                  }
                />
              </div>
            ),
          )}
        </div>
      )}

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
        src={
          zoomImage?.src ??
          null
        }
        title={
          zoomImage?.title ??
          ""
        }
        footerAction={
          zoomImage?.product ? (
            <ProductCaptureButton
              product={
                zoomImage.product
              }
            />
          ) : undefined
        }
        onClose={() =>
          setZoomImage(
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
    </section>
  );
}
