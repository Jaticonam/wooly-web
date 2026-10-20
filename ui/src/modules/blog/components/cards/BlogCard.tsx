import { ArrowRight, Clock, Flame, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { BlogArticle } from "../../types/blog";

export default function BlogCard({ article }: { article: BlogArticle }) {
  return (
    <Link to={`/blog/${article.slug}`} className="blog-card">
      <div className="blog-card-img">
        <img src={article.image} alt={article.title} loading="lazy" />

        <span>{article.category}</span>

        <div className="blog-card-floating-badges">
          {article.popular && (
            <b>
              <Flame size={12} /> Popular
            </b>
          )}

          {article.featured && (
            <b>
              <Sparkles size={12} /> Recomendada
            </b>
          )}
        </div>
      </div>

      <div className="blog-card-body">
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>

        <div className="blog-card-meta">
          <small>{article.published}</small>

          <small>
            <Clock size={13} />
            {article.readTime} min
          </small>
        </div>

        <div className="blog-card-cta">
          Leer guía <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}
