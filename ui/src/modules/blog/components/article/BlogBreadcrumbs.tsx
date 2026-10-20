import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import type { BlogArticle } from "../../types/blog";

export default function BlogBreadcrumbs({ article }: { article: BlogArticle }) {
  return (
    <nav className="blog-breadcrumb">
      <Link to="/">
        <Home size={14} /> Inicio
      </Link>
      <ChevronRight size={14} />
      <Link to="/blog">Centro Wooly</Link>
      <ChevronRight size={14} />
      <span>{article.category}</span>
      <ChevronRight size={14} />
      <b>{article.title}</b>
    </nav>
  );
}
