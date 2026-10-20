export {
  CATEGORY_CONFIG,
  type CategoryConfig,
} from "./config/categories";
export { getStockPresentation } from "@wooly/contracts/catalog/domain/stock/getStockPresentation";
export { ProductSeo } from "./seo/ProductSeoComponent";
export {
  getProductSeo,
  type ProductSeoData,
} from "./seo/productSeo";
export {
  buildProductSeoSchema,
  type ProductJsonLdSchema,
  type SeoSchemaIssue,
  type SeoSchemaIssueCode,
  type SeoSchemaResult,
} from "./seo/ProductSeoSchema";
