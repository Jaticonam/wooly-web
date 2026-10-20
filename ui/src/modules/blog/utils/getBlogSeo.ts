import type { BlogArticle, BlogSeo } from "../types/blog";
import { buildPublicUrl } from "@wooly/shared/config/application";

export function getBlogSeo(article: BlogArticle): BlogSeo {
  const url = buildPublicUrl(`/blog/${article.slug}`);

  return {
    metaTitle: article.seo?.metaTitle || `${article.title} | Wooly Hub`,

    metaDescription: article.seo?.metaDescription || article.excerpt,

    canonical: article.seo?.canonical || url,

    ogTitle: article.seo?.ogTitle || article.title,

    ogDescription: article.seo?.ogDescription || article.excerpt,

    ogImage: article.seo?.ogImage || article.image,

    keywords: article.seo?.keywords || [
      article.category,
      ...(article.tags || []),
      ...(article.searchTerms || []),
    ],
  };
}
