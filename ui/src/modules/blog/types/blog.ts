export type BlogBlockType = "paragraph" | "list" | "tip" | "warning";
export type BlogTemplate =
  | "guide"
  | "business"
  | "strategy"
  | "campaign"
  | "tutorial";
export type BlogLevel = "inicio" | "intermedio" | "avanzado";
export type BlogIntent =
  | "informacional"
  | "comercial"
  | "transaccional"
  | "comparativo";

export interface BlogSeo {
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string[];
}

export interface BlogSection {
  type?: BlogBlockType;
  title: string;
  body?: string;
  items?: string[];
}

export interface BlogArticle {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;

  seo?: BlogSeo;

  readTime: number;
  published: string;
  updatedAt?: string;

  author?: string;
  level?: BlogLevel;
  intent?: BlogIntent;

  featured?: boolean;
  popular?: boolean;
  priority?: number;

  relatedProducts?: string[];
  relatedCategories?: string[];
  relatedCampaigns?: string[];
  relatedArticles?: string[];

  tags?: string[];
  searchTerms?: string[];

  template: BlogTemplate;
  content: BlogSection[];
  faq?: { q: string; a: string }[];
}
