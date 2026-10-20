import { BlogFeatured, BlogGrid } from "../cards";
import type { BlogArticle } from "../../types/blog";

type BlogGuidesContentProps = {
  featured?: BlogArticle;
  items: BlogArticle[];
  hasMore: boolean;
  onLoadMore: () => void;
};

export default function BlogGuidesContent({
  featured,
  items,
  hasMore,
  onLoadMore,
}: BlogGuidesContentProps) {
  if (!featured) return null;

  return (
    <section className="blog-guides-content">
      <BlogFeatured article={featured} />
      <BlogGrid items={items} />

      {hasMore && (
        <div className="blog-guides-action">
          <button type="button" onClick={onLoadMore}>
            Ver más guías
          </button>
        </div>
      )}
    </section>
  );
}
