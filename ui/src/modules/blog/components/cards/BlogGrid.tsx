import { ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import type { BlogArticle } from "../../types/blog";

export default function BlogGrid({ items }: { items: BlogArticle[] }) {
  if (!items.length) return null;

  return (
    <section className="blog-grid">
      {items.map((a) => (
        <Link key={a.id} to={`/blog/${a.slug}`} className="blog-card">
          <div className="blog-card-img">
            <img src={a.image} alt={a.title} loading="lazy" />
            <span>{a.category}</span>
          </div>

          <div className="blog-card-body">
            <h3>{a.title}</h3>
            <p>{a.excerpt}</p>

            <div className="blog-card-meta">
              <small>{a.published}</small>
              <small>
                <Clock size={13} />
                {a.readTime} min
              </small>
            </div>

            <b className="blog-card-cta">
              Leer guía <ArrowRight size={14} />
            </b>
          </div>
        </Link>
      ))}
    </section>
  );
}
