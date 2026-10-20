import { useState } from "react";

import { BlogMobileNav, BlogSidebar } from "../sidebar";
import { BlogExploreSheet, BlogGuidesRail } from "../rail";
import { useBlogArticles } from "../../hooks/useBlogArticles";

import BlogGuidesPage from "./BlogGuidesPage";

export default function BlogGuidesLayout() {
  const [q, setQ] = useState("");
  const articles = useBlogArticles();

  return (
    <>
      <BlogMobileNav />

      <div className="blog-layout">
        <BlogSidebar q={q} setQ={setQ} />

        <main className="blog-main">
          <BlogGuidesPage q={q} setQ={setQ} />
        </main>

        <BlogGuidesRail articles={articles} />
      </div>

      <BlogExploreSheet articles={articles} />
    </>
  );
}
