import { useEffect, useRef, useState } from "react";
import type { Product } from "@wooly/contracts/types/product";
import {
  getCachedCatalogSnapshot,
  loadCatalogProgressive,
  type CatalogCategory,
} from "@wooly/shared/catalog/services/fetchProducts";

export function useProducts(activeCategory: CatalogCategory = "todas") {
  const initialSnapshot = getCachedCatalogSnapshot();

  const [data, setData] = useState<Product[]>(() => initialSnapshot.products);
  const [isLoading, setIsLoading] = useState(
    () => initialSnapshot.products.length === 0,
  );
  const [isFullCatalogLoaded, setIsFullCatalogLoaded] = useState(
    () => initialSnapshot.isFullCatalogLoaded,
  );

  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let cancelled = false;

    const hasPreviousProducts = dataRef.current.length > 0;

    /*
      Regla UX:
      - Skeleton solo en primera carga real.
      - Si ya existe data, mantenemos pantalla mientras se actualiza.
    */
    setIsLoading(!hasPreviousProducts);

    loadCatalogProgressive(activeCategory, (products, fullLoaded) => {
      if (cancelled) return;

      const hasIncomingProducts = products.length > 0;

      if (hasIncomingProducts) {
        setData(products);
      }

      setIsLoading(false);

      setIsFullCatalogLoaded((current) => current || fullLoaded);
    });

    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  return {
    data,
    isLoading,
    isFullCatalogLoaded,
  };
}
