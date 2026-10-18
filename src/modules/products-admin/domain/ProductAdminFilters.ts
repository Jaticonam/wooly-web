import {
  normalizeCampaignLookupKey,
} from "@/modules/catalog/domain/CampaignRules";
import {
  resolveProductCommercialPolicy,
} from "@/modules/catalog/domain/ProductCommercialPolicy";
import {
  resolveProductAdminOperationalState,
} from "@/modules/products-admin/domain/ProductAdminOperationalState";
import type {
  Product,
} from "@/shared/types/product";

export type ProductStockFilter =
  | "all"
  | "available"
  | "low"
  | "out"
  | "inconsistent";

export type ProductStatusFilter =
  | "all"
  | "publicado"
  | "preventa"
  | "agotado"
  | "oculto"
  | "borrador"
  | "invalid";

export interface ProductAdminFilterState {
  search: string;
  categoryId: string;
  campaignId: string;
  stock: ProductStockFilter;
  status: ProductStatusFilter;
}

export const EMPTY_PRODUCT_ADMIN_FILTERS:
  ProductAdminFilterState = {
    search: "",
    categoryId: "",
    campaignId: "",
    stock: "all",
    status: "all",
  };

const normalizeSearch = (
  value: unknown,
) => String(value ?? "")
  .trim()
  .toLocaleLowerCase("es")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

const matchesStock = (
  product: Product,
  filter: ProductStockFilter,
) => {
  if (filter === "all") {
    return true;
  }

  const inventoryState = resolveProductAdminOperationalState(product).inventoryState;

  return inventoryState === filter;
};

// LAB-02B.2 - SEARCH PRO V1
export function filterAdminProducts(
  products: readonly Product[],
  filters: ProductAdminFilterState,
): Product[] {
  const search = normalizeSearch(filters.search);
  const terms = search.split(/\s+/).filter(Boolean);
  const categoryId = normalizeSearch(filters.categoryId);
  const campaignId = normalizeCampaignLookupKey(filters.campaignId);

  const matches = products.flatMap((product, index) => {
    const policy = resolveProductCommercialPolicy(product);

    const code = normalizeSearch(product.code);
    const barcode = normalizeSearch(product.barcode);
    const sku = normalizeSearch(product.sku);
    const title = normalizeSearch(product.title);
    const description = normalizeSearch(product.description);

    const searchableText = [
      code,
      barcode,
      sku,
      title,
      description,
    ].join(" ");

    // Cada termino debe aparecer; su orden no importa.
    const matchesSearch = terms.every((term) =>
      searchableText.includes(term)
    );

    const matchesCategory =
      !categoryId ||
      normalizeSearch(product.category) === categoryId;

    const matchesCampaign =
      !campaignId ||
      (product.campaigns ?? []).some(
        (id) => normalizeCampaignLookupKey(id) === campaignId,
      );

    const matchesStatus =
      filters.status === "all" ||
      policy.status === filters.status;

    if (
      !matchesSearch ||
      !matchesCategory ||
      !matchesCampaign ||
      !matchesStock(product, filters.stock) ||
      !matchesStatus
    ) {
      return [];
    }

    // El codigo comercial tiene prioridad sobre nombres.
    // Sin busqueda se conserva el orden original.
    let rank = 0;

    if (search) {
      if (code && code === search) {
        rank = 0;
      } else if (code && code.startsWith(search)) {
        rank = 1;
      } else if (code && code.includes(search)) {
        rank = 2;
      } else if (barcode && barcode === search) {
        rank = 3;
      } else if (barcode && barcode.startsWith(search)) {
        rank = 4;
      } else if (title && title === search) {
        rank = 5;
      } else if (title && terms.every((term) => title.includes(term))) {
        rank = 6;
      } else {
        rank = 7;
      }
    }

    return [{ product, index, rank }];
  });

  matches.sort((a, b) =>
    a.rank - b.rank || a.index - b.index
  );

  return matches.map(({ product }) => product);
}

export const hasActiveProductAdminFilters = (
  filters: ProductAdminFilterState,
) => filters.search.trim().length > 0 ||
  filters.categoryId.length > 0 ||
  filters.campaignId.length > 0 ||
  filters.stock !== "all" ||
  filters.status !== "all";
