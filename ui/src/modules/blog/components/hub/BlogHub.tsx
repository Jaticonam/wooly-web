import { useState } from "react";

import BlogHero from "./BlogHero";
import BlogHubCatalogBanner from "./BlogHubCatalogBanner";
import BlogHubEmptyState from "./BlogHubEmptyState";
import BlogHubMainSections from "./BlogHubMainSections";

import { BlogArticlesSection } from "../sections";
import { BlogHubRail } from "../rail";
import BlogSidebar from "../sidebar/BlogSidebar";
import BlogMobileNav from "../sidebar/BlogMobileNav";

import { useBlogArticles } from "../../hooks/useBlogArticles";
import { useBlogSearch } from "../../hooks/useBlogSearch";

export default function BlogHub() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const articles = useBlogArticles();
  const items = useBlogSearch(articles, q, cat);
  const [featured, ...rest] = items;

  const hasArticles = items.length > 0;

  return (
    <>
      <BlogMobileNav />

      <div className="blog-layout">
        <BlogSidebar q={q} setQ={setQ} />

        <main className="blog-main">
          <section id="inicio">
            <BlogHero q={q} setQ={setQ} setCat={setCat} />
          </section>

          <BlogHubMainSections />

          {!hasArticles ? (
            <BlogHubEmptyState />
          ) : (
            <>
              <BlogHubCatalogBanner />

              <section id="guias">
                <BlogArticlesSection featured={featured} items={rest} />
              </section>
            </>
          )}
        </main>

        <BlogHubRail />
      </div>
    </>
  );
}
