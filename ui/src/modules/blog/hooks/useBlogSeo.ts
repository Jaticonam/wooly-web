import { useEffect } from "react";
import type { BlogArticle } from "../types/blog";
import { getBlogSeo } from "../utils/getBlogSeo";
import {
  buildPublicUrl,
  getApplicationConfig,
} from "@wooly/shared/config/application";

const SITE_NAME = "Wooly Hub";
const applicationConfig = getApplicationConfig();

const setMeta = (
  key: string,
  value: string,
  attr: "name" | "property" = "name",
) => {
  if (!value) return;

  let el = document.querySelector(
    `meta[${attr}="${key}"]`,
  ) as HTMLMetaElement | null;

  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }

  el.content = value;
};

const setCanonical = (url: string) => {
  let link = document.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }

  link.href = url;
};

const setJsonLd = (id: string, data: object) => {
  let el = document.querySelector(
    `script[data-schema="${id}"]`,
  ) as HTMLScriptElement | null;

  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-schema", id);
    document.head.appendChild(el);
  }

  el.textContent = JSON.stringify(data);
};

export function useBlogSeo(article?: BlogArticle) {
  useEffect(() => {
    if (!article) return;

    const seo = getBlogSeo(article);
    const url = seo.canonical;
    const metaTitle = seo.metaTitle;
    const metaDescription = seo.metaDescription;
    const ogTitle = seo.ogTitle;
    const ogDescription = seo.ogDescription;
    const ogImage = seo.ogImage;

    document.title = metaTitle;

    setMeta("description", metaDescription);
    setMeta("keywords", seo.keywords.join(", "));
    setMeta("author", article.author || "Wooly");

    setMeta("og:type", "article", "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:title", ogTitle, "property");
    setMeta("og:description", ogDescription, "property");
    setMeta("og:image", ogImage, "property");
    setMeta("og:url", url, "property");

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", ogTitle);
    setMeta("twitter:description", ogDescription);
    setMeta("twitter:image", ogImage);

    setCanonical(url);

    setJsonLd("blog-article", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: metaDescription,
      image: ogImage,
      datePublished: article.published,
      dateModified: article.updatedAt || article.published,
      author: {
        "@type": "Organization",
        name: article.author || "Wooly",
      },
      publisher: {
        "@type": "Organization",
        name: applicationConfig.app.name,
        logo: {
          "@type": "ImageObject",
          url: buildPublicUrl(
            applicationConfig.assets.logoUrl,
            applicationConfig,
          ),
        },
      },
      mainEntityOfPage: url,
    });

    if (article.faq?.length) {
      setJsonLd("blog-faq", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      });
    }
  }, [article]);
}
