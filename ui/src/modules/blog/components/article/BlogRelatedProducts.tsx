import {
  Link,
} from "react-router-dom";

import {
  ShoppingBag,
} from "lucide-react";

import {
  isProductPublicationDataValid,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import {
  useProducts,
} from "@/modules/catalog/hooks/useProducts";

import type {
  BlogArticle,
} from "../../types/blog";

export default function BlogRelatedProducts({
  article,
}: {
  article:
    BlogArticle;
}) {
  const {
    data:
      products = [],
  } = useProducts();

  const related =
    products.filter(
      (
        product,
      ) =>
        article
          .relatedProducts
          ?.includes(
            product.id,
          ) &&
        isProductPublicationDataValid(
          product,
        ),
    );

  if (!related.length) {
    return null;
  }

  return (
    <section className="blog-related-products">
      <div className="blog-related-products-head">
        <span>
          <ShoppingBag
            size={16}
          />{" "}
          Productos mencionados
        </span>

        <p>
          Insumos reales del catálogo Wooly relacionados con esta guía.
        </p>
      </div>

      <div className="blog-related-products-grid">
        {related.map(
          (product) => (
            <Link
              key={
                product.id
              }
              to={buildProductPublicPath(product.id, product.category)}
              className="blog-related-product"
            >
              <img
                src={
                  product.img ||
                  "/placeholder.svg"
                }
                alt={
                  product.title
                }
              />

              <div>
                <small>
                  {
                    product.id
                  }{" "}
                  •{" "}
                  {
                    product.category
                  }
                </small>

                <h4>
                  {
                    product.title
                  }
                </h4>

                <b>
                  Ver producto
                </b>
              </div>
            </Link>
          ),
        )}
      </div>
    </section>
  );
}
import { buildProductPublicPath } from "@wooly/shared/config/application";
