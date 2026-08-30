import {
  useEffect,
  useState,
} from "react";

import type {
  Product,
} from "@/shared/types/product";

import "./CatalogProductExplorer.css";

export type CatalogProductExplorerViewMode =
  | "list"
  | "grid";

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

                return (
                  <article
                    key={
                      product.id
                    }
                    className={`catalog-product-explorer__card is-${item.stateTone}`}
                  >
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
                        {product.id}
                      </span>

                      <strong>
                        {product.title}
                      </strong>

                      <small>
                        {product.category}
                      </small>
                    </div>

                    <div className="catalog-product-explorer__state">
                      {item.stateLabel}
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
                        {item.actionLabel}
                      </button>
                    ) : null}
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