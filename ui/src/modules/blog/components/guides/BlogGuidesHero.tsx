import { ArrowLeft, BookOpen, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { BLOG_GUIDE_CATEGORIES } from "../../config/blogGuideCategories";
import BlogGuidesStats from "./BlogGuidesStats";

type BlogGuidesHeroProps = {
  q: string;
  cat: string;
  stats: {
    guides: number;
    categories: number;
    tags: number;
  };
  onQueryChange: (value: string) => void;
};

export default function BlogGuidesHero({
  q,
  cat,
  stats,
  onQueryChange,
}: BlogGuidesHeroProps) {
  return (
    <section className="blog-guides-hero">
      <Sparkles className="blog-guides-ghost" />

      <Link to="/blog" className="blog-guides-back">
        <ArrowLeft size={15} /> Volver al Centro Wooly
      </Link>

      <br />

      <span>
        <BookOpen size={15} /> CENTRO DE GUÍAS WOOLY
      </span>

      <h1>Guías para comprar mejor, vender mejor y crecer más rápido.</h1>

      <p>
        Biblioteca práctica para emprendedores, florerías y tiendas de regalos
        que quieren convertir información en ventas.
      </p>

      <div className="blog-guides-search">
        <Search size={18} />
        <input
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar guías, campañas, productos o ideas..."
        />
      </div>

      <div className="blog-guides-filters">
        {BLOG_GUIDE_CATEGORIES.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className={cat === item.id ? "active" : ""}
          >
            {item.emoji} {item.label}
          </Link>
        ))}
      </div>

      <BlogGuidesStats stats={stats} />
    </section>
  );
}
