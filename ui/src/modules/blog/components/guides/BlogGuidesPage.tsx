import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useBlogArticles } from "../../hooks/useBlogArticles";
import { useBlogSearch } from "../../hooks/useBlogSearch";

import BlogGuidesContent from "./BlogGuidesContent";
import BlogGuidesEmptyState from "./BlogGuidesEmptyState";
import BlogGuidesHero from "./BlogGuidesHero";

const INITIAL_LIMIT = 6;
const STEP = 6;

type BlogGuidesPageProps = {
  q: string;
  setQ: (value: string) => void;
};

export default function BlogGuidesPage({ q, setQ }: BlogGuidesPageProps) {
  const articles = useBlogArticles();
  const [searchParams] = useSearchParams();

  const cat = searchParams.get("cat") || "all";

  const [visible, setVisible] = useState(INITIAL_LIMIT);

  const items = useBlogSearch(articles, q, cat);
  const [featured, ...rest] = items;

  const shown = rest.slice(0, visible);
  const hasMore = visible < rest.length;
  const hasItems = items.length > 0;

  const stats = useMemo(
    () => ({
      guides: articles.length,
      categories: new Set(articles.map((article) => article.category)).size,
      tags: new Set(articles.flatMap((article) => article.tags || [])).size,
    }),
    [articles],
  );

  useEffect(() => {
    setVisible(INITIAL_LIMIT);
  }, [q, cat]);

  const handleQueryChange = (value: string) => {
    setQ(value);
  };

  const handleLoadMore = () => {
    setVisible((current) => current + STEP);
  };

  return (
    <main className="blog-guides-page">
      <BlogGuidesHero
        q={q}
        cat={cat}
        stats={stats}
        onQueryChange={handleQueryChange}
      />

      {!hasItems ? (
        <BlogGuidesEmptyState />
      ) : (
        <BlogGuidesContent
          featured={featured}
          items={shown}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      )}
    </main>
  );
}
