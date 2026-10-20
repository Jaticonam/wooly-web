import {
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

import {
  isProductPublicationDataValid,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import {
  useProducts,
} from "@/modules/catalog/hooks/useProducts";

import BlogCatalogProductCard from "../BlogCatalogProductCard";

const INITIAL_LIMIT =
  4;

const STEP =
  8;

export default function BlogCatalogSection() {
  const [
    visible,
    setVisible,
  ] = useState(
    INITIAL_LIMIT,
  );

  const {
    data:
      products = [],

    isLoading,
  } = useProducts();

  const catalog =
    useMemo(
      () =>
        products
          .filter(
            isProductPublicationDataValid,
          )
          .slice()
          .sort(
            (
              a,
              b,
            ) =>
              (
                b.priority ||
                0
              ) -
              (
                a.priority ||
                0
              ),
          ),
      [
        products,
      ],
    );

  const shown =
    catalog.slice(
      0,
      visible,
    );

  const hasMore =
    visible <
    catalog.length;

  if (isLoading) {
    return (
      <section className="hub-section blog-catalog-section">
        <h2>
          Cargando catálogo...
        </h2>
      </section>
    );
  }

  if (!catalog.length) {
    return null;
  }

  return (
    <section className="hub-section blog-catalog-section">
      <ShoppingBag className="hub-ghost-icon" />

      <div className="hub-section-head">
        <span>
          <ShoppingBag size={16} />{" "}
          CATÁLOGO ESTRATÉGICO
        </span>

        <h2>
          Productos para ejecutar tus oportunidades
        </h2>

        <p>
          Un grid curado para descubrir productos con potencial comercial,
          precios mayoristas y uso estratégico.
        </p>
      </div>

      <div className="blog-catalog-grid">
        {shown.map(
          (product) => (
            <BlogCatalogProductCard
              key={
                product.id
              }
              product={
                product
              }
            />
          ),
        )}
      </div>

      <div className="blog-catalog-action">
        {hasMore && (
          <button
            type="button"
            onClick={() =>
              setVisible(
                (value) =>
                  value +
                  STEP,
              )
            }
            className="hub-button"
          >
            Ver más productos{" "}
            <ArrowRight
              size={15}
            />
          </button>
        )}

        <Link
          to="/catalogo"
          className="hub-section-more"
        >
          Explorar categorías{" "}
          <ArrowRight
            size={15}
          />
        </Link>
      </div>
    </section>
  );
}
