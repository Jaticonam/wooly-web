export type ProductAdminDensity =
  | "comfortable"
  | "compact";

export type ProductAdminOptionalColumnKey =
  | "image"
  | "status"
  | "price"
  | "stock"
  | "category"
  | "priority";

export interface ProductAdminColumnVisibility {
  readonly image: boolean;
  readonly status: boolean;
  readonly price: boolean;
  readonly stock: boolean;
  readonly category: boolean;
  readonly priority: boolean;
}

export const DEFAULT_PRODUCT_ADMIN_COLUMNS:
  ProductAdminColumnVisibility = {
    image: true,
    status: true,
    price: true,
    stock: true,
    category: true,
    priority: true,
  };

export const PRODUCT_ADMIN_COLUMN_OPTIONS:
  readonly {
    key: ProductAdminOptionalColumnKey;
    label: string;
  }[] = [
    {
      key: "image",
      label: "Imagen",
    },
    {
      key: "status",
      label: "Estado",
    },
    {
      key: "price",
      label: "Precio",
    },
    {
      key: "stock",
      label: "Stock",
    },
    {
      key: "category",
      label: "Categoría",
    },
    {
      key: "priority",
      label: "Prioridad",
    },
  ];