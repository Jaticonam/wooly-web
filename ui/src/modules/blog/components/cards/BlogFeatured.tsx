import { ChevronRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import type { BlogArticle } from "../../types/blog";
import { Sparkles } from "lucide-react";

export default function BlogFeatured({ article }: { article?: BlogArticle }) {
  if (!article) return null;

  return (
    <Link to={`/blog/${article.slug}`} className="blog-featured">
      <div className="blog-featured-img">
        <img src={article.image} alt={article.title} />
        <span>{article.category}</span>
      </div>

      <div className="blog-featured-info">
        <small className="blog-featured-kicker">
          <Sparkles size={14} /> Guía destacada
        </small>

        <h2>{article.title}</h2>
        <p>{article.excerpt}</p>

        <div className="blog-featured-meta">
          <small>{article.published}</small>
          <small>
            <Clock size={13} />
            {article.readTime} min
          </small>
        </div>

        <b>
          Leer guía <ChevronRight size={18} />
        </b>
      </div>
    </Link>
  );
}
