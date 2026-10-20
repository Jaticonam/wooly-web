import type { BlogArticle } from "../../types/blog";

export default function BlogFAQ({ article }: { article: BlogArticle }) {
  if (!article.faq?.length) return null;

  return (
    <section className="blog-faq">
      <h3>Preguntas frecuentes</h3>
      {article.faq.map((f, i) => (
        <details key={i}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  );
}
