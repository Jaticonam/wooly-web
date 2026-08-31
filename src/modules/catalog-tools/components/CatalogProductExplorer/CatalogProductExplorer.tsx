import {
  useEffect,
  useState,
} from "react";

import type {
  Product,
} from "@/shared/types/product";

import {
  getCategoryColor,
} from "@/shared/config/categoryColors";

import {
  ProductCardBadges,
} from "@/modules/catalog/components/ProductCardBadges";

import {
  ProductCardPrice,
} from "@/modules/catalog/components/ProductCardPrice";

import {
  ProductCardStock,
} from "@/modules/catalog/components/ProductCardStock";

import {
  ProductVolumePriceBadges,
} from "@/modules/catalog/components/ProductVolumePriceBadges";

import {
  resolveProductCommercialPolicy,
} from "@/modules/catalog/domain/ProductCommercialPolicy";

import "./CatalogProductExplorer.css";

export type CatalogProductExplorerViewMode =
  | "list"
  | "grid";

export type CatalogProductExplorerPresentation =
  | "operational"
  | "commercial";

export type CatalogProductExplorerStateTone =
  | "base"
  | "included"
  | "excluded"
  | "available";

export type CatalogProductExplorerActionTone =
  | "primary"
  | "danger"
  | "secondary"
  | "restore";

export interface CatalogProductExplorerItem {
  product: Product;
  stateLabel: string;
  stateTone: CatalogProductExplorerStateTone;
  actionLabel?: string;
  actionTone?: CatalogProductExplorerActionTone;
  onAction?: () => void;
}

interface CatalogProductExplorerProps {
  items: readonly CatalogProductExplorerItem[];
  isReady: boolean;
  emptyMessage: string;
  presentation?:
    CatalogProductExplorerPresentation;
}

const VIEW_STORAGE_KEY =
  "wooly_catalog_product_explorer_view";

const isViewMode = (
  value: string | null,
): value is CatalogProductExplorerViewMode =>
  value === "list" ||
  value === "grid";

const readInitialViewMode =
  (): CatalogProductExplorerViewMode => {
    if (
      typeof window ===
      "undefined"
    ) {
      return "grid";
    }

    try {
      const stored =
        window.localStorage.getItem(
          VIEW_STORAGE_KEY,
        );

      if (
        stored === "grid2" ||
        stored === "grid4"
      ) {
        return "grid";
      }

      return isViewMode(
        stored,
      )
        ? stored
        : "grid";
    } catch {
      return "grid";
    }
  };

const VIEW_OPTIONS: Array<{
  id: CatalogProductExplorerViewMode;
  icon: string;
  label: string;
}> = [
  {
    id: "grid",
    icon: "▦",
    label: "Cuadrícula",
  },
  {
    id: "list",
    icon: "☰",
    label: "Lista",
  },
];

export default function CatalogProductExplorer({
  items,
  isReady,
  emptyMessage,
  presentation = "operational",
}: CatalogProductExplorerProps) {
  const [
    viewMode,
    setViewMode,
  ] =
    useState<CatalogProductExplorerViewMode>(
      readInitialViewMode,
    );

  useEffect(
    () => {
      try {
        window.localStorage.setItem(
          VIEW_STORAGE_KEY,
          viewMode,
        );
      } catch {
        // La preferencia visual no es crítica.
      }
    },
    [viewMode],
  );

  return (
    <section
      className={`catalog-product-explorer catalog-product-explorer--${viewMode}`}
    >
      <header className="catalog-product-explorer__toolbar">
        <span className="catalog-product-explorer__resultCount">
          {items.length}
          {" "}
          productos en esta vista
        </span>

        <div
          className="catalog-product-explorer__viewModes"
          aria-label="Vista de productos"
        >
          {VIEW_OPTIONS.map(
            (option) => (
              <button
                key={
                  option.id
                }
                type="button"
                className={
                  viewMode ===
                  option.id
                    ? "is-active"
                    : ""
                }
                aria-pressed={
                  viewMode ===
                  option.id
                }
                title={
                  option.label
                }
                onClick={() =>
                  setViewMode(
                    option.id,
                  )
                }
              >
                <span aria-hidden="true">
                  {option.icon}
                </span>

                <small>
                  {option.label}
                </small>
              </button>
            ),
          )}
        </div>
      </header>

      {!isReady ? (
        <div className="catalog-product-explorer__empty">
          Esperando que termine de cargar el catálogo.
        </div>
      ) : items.length === 0 ? (
        <div className="catalog-product-explorer__empty">
          {emptyMessage}
        </div>
      ) : (
        <div className="catalog-product-explorer__viewport">
          <div className="catalog-product-explorer__items">
            {items.map(
              (item) => {
                const {
                  product,
                } = item;

                const commercialPolicy =
                  presentation ===
                  "commercial"
                    ? resolveProductCommercialPolicy(
                        product,
                      )
                    : null;

                const isPreventa =
                  commercialPolicy?.status ===
                  "preventa";

                const isAgotado =
                  commercialPolicy?.status ===
                  "agotado";

                const available =
                  commercialPolicy
                    ?.isPurchasable ??
                  false;

                return (
                  <article
                    key={
                      product.id
                    }
                    className={[
                      "catalog-product-explorer__card",
                      `is-${item.stateTone}`,
                      presentation ===
                      "commercial"
                        ? "is-commercial"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {presentation ===
                    "commercial" ? (
                      <>
                        <div className="catalog-product-explorer__image catalog-product-explorer__commercialImage">
                          <ProductCardBadges
                            product={
                              product
                            }
                          />

                          {isAgotado ? (
                            <span className="catalog-product-explorer__soldOut">
                              Agotado
                            </span>
                          ) : null}

                          {product.img ? (
                            <img
                              src={
                                product.img
                              }
                              alt={
                                product.title
                              }
                              loading="lazy"
                            />
                          ) : (
                            <span>
                              Sin imagen
                            </span>
                          )}
                        </div>

                        <div className="catalog-product-explorer__commercialInfo">
                          <div className="catalog-product-explorer__commercialIdentity">
                            <span className="catalog-product-explorer__id">
                              {product.id}
                            </span>

                            <span
                              className={[
                                "catalog-product-explorer__category",
                                getCategoryColor(
                                  product.category,
                                ),
                              ].join(
                                " ",
                              )}
                            >
                              {
                                product.category
                              }
                            </span>
                          </div>

                          <strong className="catalog-product-explorer__commercialTitle">
                            {
                              product.title
                            }
                          </strong>

                          <ProductCardPrice
                            product={
                              product
                            }
                            isPreventa={
                              isPreventa
                            }
                          />

                          <ProductCardStock
                            stock={
                              product.stock
                            }
                            price={
                              product.price_1
                            }
                            status={
                              product.status
                            }
                          />

                          <ProductVolumePriceBadges
                            product={
                              product
                            }
                            available={
                              available
                            }
                            isPreventa={
                              isPreventa
                            }
                          />

                          <div className="catalog-product-explorer__state">
                            {
                              item.stateLabel
                            }
                          </div>

                          {item.actionLabel &&
                          item.onAction ? (
                            <button
                              type="button"
                              className={`catalog-product-explorer__action is-${item.actionTone ?? "secondary"}`}
                              onClick={
                                item.onAction
                              }
                            >
                              {
                                item.actionLabel
                              }
                            </button>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="catalog-product-explorer__image">
                          {product.img ? (
                            <img
                              src={
                                product.img
                              }
                              alt={
                                product.title
                              }
                              loading="lazy"
                            />
                          ) : (
                            <span>
                              Sin imagen
                            </span>
                          )}
                        </div>

                        <div className="catalog-product-explorer__info">
                          <span className="catalog-product-explorer__id">
                            {
                              product.id
                            }
                          </span>

                          <strong>
                            {
                              product.title
                            }
                          </strong>

                          <small>
                            {
                              product.category
                            }
                          </small>
                        </div>

                        <div className="catalog-product-explorer__state">
                          {
                            item.stateLabel
                          }
                        </div>

                        {item.actionLabel &&
                        item.onAction ? (
                          <button
                            type="button"
                            className={`catalog-product-explorer__action is-${item.actionTone ?? "secondary"}`}
                            onClick={
                              item.onAction
                            }
                          >
                            {
                              item.actionLabel
                            }
                          </button>
                        ) : null}
                      </>
                    )}
                  </article>
                );
              },
            )}
          </div>
        </div>
      )}
    </section>
  );
}
