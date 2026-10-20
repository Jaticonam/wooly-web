import {
  useMemo,
  useState,
} from "react";

import {
  CATEGORY_CONFIG,
} from "@wooly/shared/catalog/config/categories";

import {
  isProductPubliclyVisible,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import CatalogProductExplorer, {
  type CatalogProductExplorerItem,
} from "@/modules/catalog-tools/components/CatalogProductExplorer/CatalogProductExplorer";

import type {
  Product,
} from "@wooly/contracts/types/product";

import "./CatalogHybridAdjuster.css";

export type CatalogHybridAction =
  | "include"
  | "remove-included"
  | "exclude"
  | "restore";

interface CatalogHybridAdjusterProps {
  products: readonly Product[];
  automaticProductIds: readonly string[];
  includedProductIds: readonly string[];
  excludedProductIds: readonly string[];
  isReady: boolean;
  onProductAction: (
    productId: string,
    action: CatalogHybridAction,
  ) => void;
}

type HybridStatusFilter =
  | "all"
  | "base"
  | "included"
  | "excluded";

const normalizeValue = (
  value?: string | null,
) =>
  String(
    value ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );

const STATUS_OPTIONS: Array<{
  id: HybridStatusFilter;
  label: string;
}> = [
  {
    id: "all",
    label: "Todos",
  },
  {
    id: "base",
    label: "Base",
  },
  {
    id: "included",
    label: "Agregados",
  },
  {
    id: "excluded",
    label: "Retirados",
  },
];

export default function CatalogHybridAdjuster({
  products,
  automaticProductIds,
  includedProductIds,
  excludedProductIds,
  isReady,
  onProductAction,
}: CatalogHybridAdjusterProps) {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    categoryId,
    setCategoryId,
  ] = useState("todas");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<HybridStatusFilter>(
      "all",
    );

  const visibleProducts =
    useMemo(
      () =>
        products.filter(
          isProductPubliclyVisible,
        ),
      [products],
    );

  const automaticIds =
    useMemo(
      () =>
        new Set(
          automaticProductIds.map(
            normalizeValue,
          ),
        ),
      [automaticProductIds],
    );

  const includedIds =
    useMemo(
      () =>
        new Set(
          includedProductIds.map(
            normalizeValue,
          ),
        ),
      [includedProductIds],
    );

  const excludedIds =
    useMemo(
      () =>
        new Set(
          excludedProductIds.map(
            normalizeValue,
          ),
        ),
      [excludedProductIds],
    );

  const availableCategoryIds =
    useMemo(
      () =>
        new Set(
          visibleProducts.map(
            (product) =>
              normalizeValue(
                product.category,
              ),
          ),
        ),
      [visibleProducts],
    );

  const categoryOptions =
    useMemo(
      () =>
        CATEGORY_CONFIG.filter(
          (category) =>
            category.id === "todas" ||
            availableCategoryIds.has(
              normalizeValue(
                category.id,
              ),
            ),
        ),
      [
        availableCategoryIds,
      ],
    );

  const manuallyIncludedCount =
    useMemo(
      () =>
        Array.from(
          includedIds,
        ).filter(
          (productId) =>
            !automaticIds.has(
              productId,
            ),
        ).length,
      [
        automaticIds,
        includedIds,
      ],
    );

  const manuallyExcludedCount =
    useMemo(
      () =>
        Array.from(
          excludedIds,
        ).filter(
          (productId) =>
            automaticIds.has(
              productId,
            ),
        ).length,
      [
        automaticIds,
        excludedIds,
      ],
    );

  const finalProductCount =
    useMemo(
      () => {
        const finalIds =
          new Set(
            automaticIds,
          );

        excludedIds.forEach(
          (productId) =>
            finalIds.delete(
              productId,
            ),
        );

        includedIds.forEach(
          (productId) =>
            finalIds.add(
              productId,
            ),
        );

        return finalIds.size;
      },
      [
        automaticIds,
        includedIds,
        excludedIds,
      ],
    );

  const filteredProducts =
    useMemo(
      () => {
        const normalizedSearch =
          normalizeValue(
            search,
          );

        const normalizedCategory =
          normalizeValue(
            categoryId,
          );

        return visibleProducts.filter(
          (product) => {
            const productId =
              normalizeValue(
                product.id,
              );

            const isAutomatic =
              automaticIds.has(
                productId,
              );

            const isIncluded =
              includedIds.has(
                productId,
              ) &&
              !isAutomatic;

            const isExcluded =
              excludedIds.has(
                productId,
              ) &&
              isAutomatic;

            const matchesCategory =
              normalizedCategory ===
                "todas" ||
              normalizeValue(
                product.category,
              ) ===
                normalizedCategory;

            if (!matchesCategory) {
              return false;
            }

            const matchesStatus =
              statusFilter === "all" ||
              (
                statusFilter === "base" &&
                isAutomatic &&
                !isExcluded
              ) ||
              (
                statusFilter ===
                  "included" &&
                isIncluded
              ) ||
              (
                statusFilter ===
                  "excluded" &&
                isExcluded
              );

            if (!matchesStatus) {
              return false;
            }

            if (!normalizedSearch) {
              return true;
            }

            return normalizeValue(
              [
                product.id,
                product.title,
                product.description,
                product.category,
              ].join(" "),
            ).includes(
              normalizedSearch,
            );
          },
        );
      },
      [
        visibleProducts,
        search,
        categoryId,
        statusFilter,
        automaticIds,
        includedIds,
        excludedIds,
      ],
    );

  const explorerItems =
    useMemo<
      CatalogProductExplorerItem[]
    >(
      () =>
        filteredProducts.map(
          (product) => {
            const productId =
              normalizeValue(
                product.id,
              );

            const isAutomatic =
              automaticIds.has(
                productId,
              );

            const isExcluded =
              excludedIds.has(
                productId,
              ) &&
              isAutomatic;

            const isIncluded =
              includedIds.has(
                productId,
              ) &&
              !isAutomatic;

            if (isExcluded) {
              return {
                product,
                stateLabel:
                  "Retirado",
                stateTone:
                  "excluded",
                actionLabel:
                  "Restaurar",
                actionTone:
                  "restore",
                onAction: () =>
                  onProductAction(
                    product.id,
                    "restore",
                  ),
              };
            }

            if (isAutomatic) {
              return {
                product,
                stateLabel:
                  "Selección base",
                stateTone:
                  "base",
                actionLabel:
                  "Excluir",
                actionTone:
                  "danger",
                onAction: () =>
                  onProductAction(
                    product.id,
                    "exclude",
                  ),
              };
            }

            if (isIncluded) {
              return {
                product,
                stateLabel:
                  "Agregado",
                stateTone:
                  "included",
                actionLabel:
                  "Quitar agregado",
                actionTone:
                  "secondary",
                onAction: () =>
                  onProductAction(
                    product.id,
                    "remove-included",
                  ),
              };
            }

            return {
              product,
              stateLabel:
                "Fuera de la selección",
              stateTone:
                "available",
              actionLabel:
                "+ Agregar",
              actionTone:
                "primary",
              onAction: () =>
                onProductAction(
                  product.id,
                  "include",
                ),
            };
          },
        ),
      [
        filteredProducts,
        automaticIds,
        excludedIds,
        includedIds,
        onProductAction,
      ],
    );

  return (
    <article className="catalog-hybrid-adjuster">
      <div className="catalog-hybrid-adjuster__workspaceToolbar">
  <div className="catalog-hybrid-adjuster__controls">
    <label
      className="catalog-hybrid-adjuster__search"
      aria-label="Buscar producto"
    >
      <input
        type="search"
        value={
          search
        }
        placeholder="Buscar ID, nombre o descripción..."
        disabled={
          !isReady
        }
        onChange={(event) =>
          setSearch(
            event.target.value,
          )
        }
      />
    </label>

    <label aria-label="Categoría">
      <select
        value={
          categoryId
        }
        disabled={
          !isReady
        }
        onChange={(event) =>
          setCategoryId(
            event.target.value,
          )
        }
      >
        {categoryOptions.map(
          (category) => (
            <option
              key={
                category.id
              }
              value={
                category.id
              }
            >
              {category.id ===
              "todas"
                ? "Todas las categorías"
                : category.name}
            </option>
          ),
        )}
      </select>
    </label>
  </div>

  <div className="catalog-hybrid-adjuster__metrics">
    <div>
      <strong>
        {automaticIds.size}
      </strong>

      <span>
        base
      </span>
    </div>

    <div>
      <strong>
        +{manuallyIncludedCount}
      </strong>

      <span>
        agregados
      </span>
    </div>

    <div>
      <strong>
        -{manuallyExcludedCount}
      </strong>

      <span>
        retirados
      </span>
    </div>

    <div className="is-final">
      <strong>
        {finalProductCount}
      </strong>

      <span>
        final
      </span>
    </div>
  </div>
</div>
<div className="catalog-hybrid-adjuster__statusFilters">
        <div>
          {STATUS_OPTIONS.map(
            (option) => (
              <button
                key={
                  option.id
                }
                type="button"
                className={
                  statusFilter ===
                  option.id
                    ? "is-active"
                    : ""
                }
                aria-pressed={
                  statusFilter ===
                  option.id
                }
                onClick={() =>
                  setStatusFilter(
                    option.id,
                  )
                }
              >
                {option.label}
              </button>
            ),
          )}
        </div>
      </div>

      <CatalogProductExplorer
        items={
          explorerItems
        }
        isReady={
          isReady
        }
        emptyMessage="No encontramos productos con estos filtros."
      />
    </article>
  );
}