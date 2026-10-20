import { Link } from "react-router-dom";
import { useBlogArticles } from "../../hooks/useBlogArticles";
import type { BlogArticle } from "../../types/blog";

export function getRelatedArticles(article: BlogArticle, all: BlogArticle[]) {
  const tags = new Set(article.tags || []);

  return all
    .filter((a) => a.id !== article.id)
    .map((a) => ({
      ...a,
      score:
        (a.tags || []).filter((t) => tags.has(t)).length +
        (a.category === article.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

export default function BlogRelatedArticles({
  article,
}: {
  article: BlogArticle;
}) {
  const articles = useBlogArticles();
  const related = getRelatedArticles(article, articles);

  if (!related.length) return null;

  return (
    <section className="blog-related">
      <h3>También podría interesarte</h3>

      <div>
        {related.map((a) => (
          <Link key={a.id} to={`/blog/${a.slug}`} className="blog-related-card">
            <img src={a.image} alt={a.title} />
            <span>{a.category}</span>
            <h4>{a.title}</h4>
            <p>{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
