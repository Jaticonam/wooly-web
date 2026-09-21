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

export function filterAdminProducts(
  products: readonly Product[],
  filters: ProductAdminFilterState,
): Product[] {
  const search = normalizeSearch(filters.search);
  const categoryId = normalizeSearch(filters.categoryId);
  const campaignId = normalizeCampaignLookupKey(filters.campaignId);

  return products.filter((product) => {
    const policy = resolveProductCommercialPolicy(product);
    const searchableText = normalizeSearch([
      product.id,
      product.title,
      product.description,
    ].join(" "));

    const matchesSearch = !search || searchableText.includes(search);
    const matchesCategory = !categoryId ||
      normalizeSearch(product.category) === categoryId;
    const matchesCampaign = !campaignId ||
      (product.campaigns ?? []).some(
        (id) => normalizeCampaignLookupKey(id) === campaignId,
      );
    const matchesStatus = filters.status === "all" || policy.status === filters.status;

    return matchesSearch &&
      matchesCategory &&
      matchesCampaign &&
      matchesStock(product, filters.stock) &&
      matchesStatus;
  });
}

export const hasActiveProductAdminFilters = (
  filters: ProductAdminFilterState,
) => filters.search.trim().length > 0 ||
  filters.categoryId.length > 0 ||
  filters.campaignId.length > 0 ||
  filters.stock !== "all" ||
  filters.status !== "all";
