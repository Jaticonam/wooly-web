import { CalendarDays, Clock, GraduationCap, Tag } from "lucide-react";
import type { BlogArticle } from "../../types/blog";

export default function BlogArticleMeta({ article }: { article: BlogArticle }) {
  return (
    <div className="blog-article-meta">
      <span>
        <GraduationCap size={14} /> Centro Wooly
      </span>
      <span>
        <Clock size={14} />
        {article.readTime} min lectura
      </span>
      <span>
        <CalendarDays size={14} />
        {article.published}
      </span>
      <span>
        <Tag size={14} />
        {article.template}
      </span>
    </div>
  );
}
