import { BlogFeatured, BlogGrid } from "../cards";
import type { BlogArticle } from "../../types/blog";
import { BookOpen } from "lucide-react";

export default function BlogArticlesSection({
  featured,
  items,
}: {
  featured?: BlogArticle;
  items: BlogArticle[];
}) {
  const total = items.length + (featured ? 1 : 0);
  const categories = new Set(
    [featured, ...items].filter(Boolean).map((a) => a!.category),
  ).size;

  return (
    <section className="blog-articles-section">
      <div className="blog-articles-head">
        <span>
          <BookOpen size={16} />
          GUÍAS Y ESTRATEGIAS
        </span>

        <h2>Aprende con contenido práctico</h2>

        <p>
          Artículos pensados para emprendedores que quieren comprar mejor,
          vender más y tomar mejores decisiones.
        </p>

        <div className="blog-articles-stats">
          <div>
            <strong>📚 {total}</strong>
            <small>Guías</small>
          </div>

          <div>
            <strong>📦 {categories}</strong>
            <small>Categorías</small>
          </div>

          <div>
            <strong>🚀</strong>
            <small>Actualizado semanalmente</small>
          </div>
        </div>
      </div>

      <BlogFeatured article={featured} />

      <BlogGrid items={items} />
      <div className="hub-section-footer"></div>
    </section>
  );
}
