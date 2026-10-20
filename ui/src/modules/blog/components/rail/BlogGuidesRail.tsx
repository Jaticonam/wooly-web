import { Link } from "react-router-dom";
import type { BlogArticle } from "../../types/blog";
import BlogRailCard from "./BlogRailCard";

const CATEGORIES = [
  { label: "📦 Productos", href: "/blog/guias?cat=productos" },
  { label: "💰 Ventas", href: "/blog/guias?cat=ventas" },
  { label: "📈 Tendencias", href: "/blog/guias?cat=tendencias" },
  { label: "📅 Campañas", href: "/blog/guias?cat=campañas" },
  { label: "💡 Negocios", href: "/blog/guias?cat=negocios" },
  { label: "🚀 Estrategias", href: "/blog/guias?cat=estrategias" },
];

const CAMPAIGNS = [
  { label: "❤️ San Valentín", href: "/blog/guias?cat=campañas" },
  { label: "🌸 Día de la Madre", href: "/blog/guias?cat=campañas" },
  { label: "🎓 Graduaciones", href: "/blog/guias?cat=campañas" },
];

const TOPICS = [
  { label: "Papeles", href: "/catalogo/categoria.html?cat=papeles" },
  { label: "Flores", href: "/catalogo/categoria.html?cat=flores" },
  { label: "Packaging", href: "/blog/guias?cat=tendencias" },
  { label: "Regalos", href: "/blog/guias?cat=negocios" },
];

export default function BlogGuidesRail({
  articles,
}: {
  articles: BlogArticle[];
}) {
  const featured = articles.find((a) => a.featured) || articles[0];
  const popular = articles.filter((a) => a.popular || a.featured).slice(0, 3);

  return (
    <aside className="blog-guides-rail">
      {featured && (
        <BlogRailCard title="🚀 Guía recomendada">
          <strong>{featured.title}</strong>
          <p>{featured.excerpt}</p>
          <Link to={`/blog/${featured.slug}`}>Leer guía</Link>
        </BlogRailCard>
      )}

      <BlogRailCard title="📚 Explorar guías">
        {CATEGORIES.map((item) => (
          <Link key={item.href} to={item.href}>
            {item.label}
          </Link>
        ))}
      </BlogRailCard>

      {!!popular.length && (
        <BlogRailCard title="🔥 Más leídas">
          {popular.map((item) => (
            <Link key={item.id} to={`/blog/${item.slug}`}>
              {item.title}
            </Link>
          ))}
        </BlogRailCard>
      )}

      <BlogRailCard title="📅 Campañas clave">
        {CAMPAIGNS.map((item) => (
          <Link key={item.label} to={item.href}>
            {item.label}
          </Link>
        ))}
      </BlogRailCard>

      <BlogRailCard title="🏷 Temas que venden">
        {TOPICS.map((item) => (
          <Link key={item.label} to={item.href}>
            {item.label}
          </Link>
        ))}
      </BlogRailCard>
    </aside>
  );
}
