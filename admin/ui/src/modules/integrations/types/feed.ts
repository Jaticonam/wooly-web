import type { Product } from "@wooly/contracts/types/product";

export type FeedProduct = Product;

export type MetaFeedItem = {
  id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  price: string;
  link: string;
  image_link: string;
  brand: string;
  google_product_category: string;
};
