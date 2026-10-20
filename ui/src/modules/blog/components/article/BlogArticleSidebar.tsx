import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  CalendarDays,
  Flame,
  MessageCircle,
  PlusCircle,
  ShoppingBag,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

import {
  resolveProductCommercialPolicy,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import {
  resolveProductCommercialState,
} from "@wooly/contracts/domain/commercialPolicy";

import {
  useProducts,
} from "@/modules/catalog/hooks/useProducts";

import {
  useCart,
} from "@/modules/cart/store";

import type {
  BlogArticle,
} from "../../types/blog";

import {
  useBlogArticles,
} from "../../hooks/useBlogArticles";

import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/SocialIcons";

import {
  getBaseUnitPrice,
} from "@wooly/contracts/domain/volumePricing/VolumePricing";
import {
  buildApplicationWhatsAppUrl,
} from "@wooly/shared/config/application";

const CAMPAIGNS = [
  "❤️ San Valentín",
  "🏎️ Hot Wheels",
  "🌷 Día de la Madre",
];

const SOCIALS = [
  {
    label:
      "WhatsApp",

    href:
      buildApplicationWhatsAppUrl(),

    Icon:
      WhatsAppIcon,
  },
  {
    label:
      "Instagram",

    href:
      "https://instagram.com/woolyimports",

    Icon:
      InstagramIcon,
  },
  {
    label:
      "Facebook",

    href:
      "#",

    Icon:
      FacebookIcon,
  },
  {
    label:
      "TikTok",

    href:
      "#",

    Icon:
      TikTokIcon,
  },
];

export default function BlogArticleSidebar({
  article,
}: {
  article:
    BlogArticle;
}) {
  const navigate =
    useNavigate();

  const articles =
    useBlogArticles();

  const {
    data:
      products = [],
  } = useProducts();

  const {
    addToCart,
  } = useCart();

  const topArticles =
    articles
      .filter(
        (item) =>
          item.slug !==
          article.slug,
      )
      .slice(
        0,
        5,
      );

  const topProducts =
    products
      .filter(
        (
          product,
        ) =>
          article
            .relatedProducts
            ?.includes(
              product.id,
            ) &&
          resolveProductCommercialPolicy(
            product,
          ).isPubliclyVisible,
      )
      .slice(
        0,
        3,
      );

  return (
    <aside className="blog-article-sidebar">
      <Card
        icon={
          <ShoppingBag
            size={16}
          />
        }
        title="Productos oportunidad"
      >
        <div className="blog-side-products">
          {topProducts.map(
            (product) => {
              const policy =
                resolveProductCommercialPolicy(
                  product,
                );

              const commercialState =
                resolveProductCommercialState(
                  product,
                );

              const primaryPrice =
                getBaseUnitPrice(
                  product,
                );

              const detailUrl =
                buildProductPublicPath(product.id, product.category);

              const ctaLabel =
                commercialState
                  .purchaseMode ===
                "CART"
                  ? "Agregar"
                  : commercialState
                        .availability ===
                      "OUT_OF_STOCK"
                    ? "Reposición"
                    : "Consultar";

              return (
                <div
                  key={
                    product.id
                  }
                  className="blog-side-product-card"
                >
                  <Link
                    to={
                      detailUrl
                    }
                    className="blog-side-product-info"
                  >
                    <img
                      src={
                        product.img
                      }
                      alt={
                        product.title
                      }
                    />

                    <div>
                      <small>
                        {
                          product.category
                        }
                      </small>

                      <strong>
                        {
                          product.title
                        }
                      </strong>

                      <b>
                        {policy
                          .canShowPricing
                          ? `S/ ${primaryPrice.toFixed(
                              2,
                            )}`
                          : "Consultar"}
                      </b>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        policy
                          .isPurchasable
                      ) {
                        addToCart(
                          product,
                          1,
                        );

                        return;
                      }

                      navigate(
                        detailUrl,
                      );
                    }}
                  >
                    {policy
                      .isPurchasable ? (
                      <PlusCircle
                        size={15}
                      />
                    ) : (
                      <MessageCircle
                        size={15}
                      />
                    )}

                    {ctaLabel}
                  </button>
                </div>
              );
            },
          )}
        </div>
      </Card>

      <Card
        icon={
          <Flame
            size={16}
          />
        }
        title="Más leído"
      >
        <div className="blog-side-articles">
          {topArticles.map(
            (item) => (
              <Link
                key={
                  item.slug
                }
                to={`/blog/${item.slug}`}
                className="blog-side-article"
              >
                <img
                  src={
                    item.image
                  }
                  alt={
                    item.title
                  }
                />

                <div>
                  <strong>
                    {
                      item.title
                    }
                  </strong>

                  <small>
                    {
                      item.readTime
                    }{" "}
                    min lectura
                  </small>
                </div>
              </Link>
            ),
          )}
        </div>
      </Card>

      <Card
        icon={
          <CalendarDays
            size={16}
          />
        }
        title="Próximas campañas"
      >
        <div className="blog-side-campaigns">
          {CAMPAIGNS.map(
            (campaign) => (
              <Link
                key={
                  campaign
                }
                to="/blog"
                className="blog-side-campaign"
              >
                {campaign}
              </Link>
            ),
          )}
        </div>
      </Card>

      <Card
        icon={
          <MessageCircle
            size={16}
          />
        }
        title="Conecta con Wooly"
      >
        <div className="blog-side-socials">
          {SOCIALS.map(
            ({
              label,
              href,
              Icon,
            }) => (
              <a
                key={
                  label
                }
                href={
                  href
                }
                target="_blank"
                rel="noreferrer"
              >
                <Icon
                  width={16}
                  height={16}
                />

                {label}
              </a>
            ),
          )}
        </div>
      </Card>
    </aside>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon:
    ReactNode;

  title:
    string;

  children:
    ReactNode;
}) {
  return (
    <div className="blog-side-card">
      <h3>
        {icon}
        {title}
      </h3>

      {children}
    </div>
  );
}
import { buildProductPublicPath } from "@wooly/shared/config/application";
