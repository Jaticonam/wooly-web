import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@wooly/contracts/types/product";
import type { CatalogCategoryId } from "../providers/CatalogProvider";
import {
  getCachedCatalogSnapshot,
  getCatalogCategories,
  loadCategoryProducts,
  type CatalogCategory,
} from "../services/fetchProducts";

type CategoryLoadStatus = "idle" | "loading" | "loaded" | "error";

type ProductsByCategory = Partial<Record<CatalogCategoryId, Product[]>>;
type StatusByCategory = Record<CatalogCategoryId, CategoryLoadStatus>;

const CATALOG_CATEGORIES = getCatalogCategories();

const sortProducts = (items: Product[]) =>
  [...items].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

const flattenByCategory = (byCategory: ProductsByCategory) =>
  sortProducts(Object.values(byCategory).flatMap((items) => items ?? []));

const createInitialStatus = (
  loadedCategories: CatalogCategoryId[],
): StatusByCategory => {
  const loaded = new Set<CatalogCategoryId>(loadedCategories);

  return CATALOG_CATEGORIES.reduce((acc, category) => {
    acc[category] = loaded.has(category) ? "loaded" : "idle";
    return acc;
  }, {} as StatusByCategory);
};

export function useCatalogData(activeCategory: CatalogCategory = "todas") {
  const initialSnapshotRef = useRef(getCachedCatalogSnapshot());

  const [productsByCategory, setProductsByCategory] =
    useState<ProductsByCategory>(() => initialSnapshotRef.current.byCategory);

  const [statusByCategory, setStatusByCategory] = useState<StatusByCategory>(
    () => createInitialStatus(initialSnapshotRef.current.loadedCategories),
  );

  const [isBootstrapping, setIsBootstrapping] = useState(
    () => initialSnapshotRef.current.products.length === 0,
  );

  const mountedRef = useRef(false);
  const productsByCategoryRef = useRef(productsByCategory);
  const statusByCategoryRef = useRef(statusByCategory);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const syncProductsByCategory = useCallback((next: ProductsByCategory) => {
    productsByCategoryRef.current = next;
    setProductsByCategory(next);
  }, []);

  const syncStatusByCategory = useCallback((next: StatusByCategory) => {
    statusByCategoryRef.current = next;
    setStatusByCategory(next);
  }, []);

  const setCategoryStatus = useCallback(
    (category: CatalogCategoryId, status: CategoryLoadStatus) => {
      const next = {
        ...statusByCategoryRef.current,
        [category]: status,
      };

      syncStatusByCategory(next);
    },
    [syncStatusByCategory],
  );

  const setCategoryProducts = useCallback(
    (category: CatalogCategoryId, products: Product[]) => {
      const next = {
        ...productsByCategoryRef.current,
        [category]: products,
      };

      syncProductsByCategory(next);
    },
    [syncProductsByCategory],
  );

  const ensureCategoryLoaded = useCallback(
    async (category: CatalogCategoryId) => {
      const currentStatus = statusByCategoryRef.current[category];

      if (currentStatus === "loaded" || currentStatus === "loading") {
        return;
      }

      setCategoryStatus(category, "loading");

      try {
        const products = await loadCategoryProducts(category);

        if (!mountedRef.current) return;

        setCategoryProducts(category, products);
        setCategoryStatus(category, "loaded");
      } catch (error) {
        console.error(`Error cargando categoría "${category}":`, error);

        if (!mountedRef.current) return;

        setCategoryProducts(category, []);
        setCategoryStatus(category, "error");
      } finally {
        if (mountedRef.current) {
          setIsBootstrapping(false);
        }
      }
    },
    [setCategoryProducts, setCategoryStatus],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const preferredCategory =
        activeCategory !== "todas" ? activeCategory : CATALOG_CATEGORIES[0];

      if (preferredCategory) {
        await ensureCategoryLoaded(preferredCategory);
      }

      if (cancelled) return;

      /*
        Precarga suave:
        carga el resto de categorías una por una.
        No depende de campañas ni de búsqueda.
      */
      for (const category of CATALOG_CATEGORIES) {
        if (cancelled) break;
        await ensureCategoryLoaded(category);
      }

      if (!cancelled && mountedRef.current) {
        setIsBootstrapping(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [activeCategory, ensureCategoryLoaded]);

  const data = useMemo(
    () => flattenByCategory(productsByCategory),
    [productsByCategory],
  );

  const loadedCount = useMemo(
    () =>
      CATALOG_CATEGORIES.filter(
        (category) => statusByCategory[category] === "loaded",
      ).length,
    [statusByCategory],
  );

  const isFullCatalogLoaded = loadedCount === CATALOG_CATEGORIES.length;

  const activeCategoryStatus =
    activeCategory === "todas" ? "loaded" : statusByCategory[activeCategory];

  const isCategoryLoading =
    activeCategory !== "todas" && activeCategoryStatus === "loading";

  const isLoading = isBootstrapping && data.length === 0;

  return {
    data,
    productsByCategory,
    statusByCategory,
    activeCategoryStatus,
    isCategoryLoading,
    isLoading,
    isFullCatalogLoaded,
  };
}
