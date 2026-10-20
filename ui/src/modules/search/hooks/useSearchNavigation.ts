import { useNavigate } from "react-router-dom";
import type { Product } from "@wooly/contracts/types/product";

export function useSearchNavigation(
  value: string,
  onChange: (value: string) => void,
  setActiveIndex: (n: number) => void,
  setFocused: (v: boolean) => void,
) {
  const navigate = useNavigate();

  const closeSearch = () => {
    setActiveIndex(-1);
    setFocused(false);
  };

  const reset = () => {
    onChange("");
    closeSearch();
  };

  const goToProduct = (product: Product) => {
    const current = value.trim();

    if (current) {
      sessionStorage.setItem("wooly_restore_search", current);
    }

    closeSearch();

    navigate(
      buildProductPublicPath(product.id, product.category),
      {
        state: {
          fromSearch: true,
          searchQuery: current,
        },
      },
    );
  };

  const goToCategory = (category: string) => {
    reset();
    navigate(`/catalogo/categoria.html?cat=${encodeURIComponent(category)}`);
  };

  return { goToProduct, goToCategory };
}
import { buildProductPublicPath } from "@wooly/shared/config/application";
