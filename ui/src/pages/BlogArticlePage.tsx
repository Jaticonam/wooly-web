import "@/styles/blog/article/blog-article.css";
import "@/styles/blog/article/blog-article-sidebar.css";
import { useBlogArticles } from "@/modules/blog/hooks/useBlogArticles";
import {
  BlogArticleCTA,
  BlogArticleMeta,
  BlogArticleSidebar,
  BlogBreadcrumbs,
  BlogFAQ,
  BlogRelatedArticles,
  BlogRelatedProducts,
  BlogTOC,
} from "@/modules/blog/components/article";
import BlogIdeaBox from "@/modules/blog/components/BlogIdeaBox";
import BlogBlockRenderer from "@/modules/blog/components/BlogBlockRenderer";
import { useBlogSeo } from "@/modules/blog/hooks/useBlogSeo";
import { useBreadcrumbSchema } from "@/modules/blog/hooks/useBreadcrumbSchema";
import { ArrowLeft, BookOpen, MessageCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function BlogArticlePage() {
  const { slug } = useParams();
  const articles = useBlogArticles();
  const article = articles.find((a) => a.slug === slug);

  useBlogSeo(article);
  useBreadcrumbSchema(article?.title || "", article?.slug || "");

  if (!article)
    return (
      <main className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <h1 className="text-3xl font-black">Artículo no encontrado</h1>
          <Link to="/blog" className="mt-4 inline-flex text-primary font-bold">
            Volver al Centro Wooly
          </Link>
        </div>
      </main>
    );

  return (
    <main className="blog-article-page">
      <div className="blog-article-layout">
        <article className="blog-article">
          <Link to="/blog" className="blog-back">
            <ArrowLeft size={16} /> Volver al Centro Wooly
          </Link>

          <BlogBreadcrumbs article={article} />

          <header className="blog-article-header">
            <span className="blog-pill">
              <BookOpen size={14} />
              {article.category}
            </span>

            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>

            <BlogArticleMeta article={article} />
          </header>

          <img
            className="blog-article-cover"
            src={article.image}
            alt={article.title}
          />

          <BlogTOC sections={article.content} />

          <section className="blog-article-content">
            <BlogIdeaBox article={article} />
            <BlogBlockRenderer sections={article.content} />
            <BlogArticleCTA article={article} />
          </section>

          <BlogRelatedProducts article={article} />
          <BlogFAQ article={article} />
          <BlogRelatedArticles article={article} />

          <div className="blog-article-cta">
            <div>
              <h3>¿Listo para abastecerte?</h3>
              <p>Cotiza insumos mayoristas para tu negocio.</p>
            </div>

            <a
              href={buildApplicationWhatsAppUrl()}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} /> Cotizar por WhatsApp
            </a>
          </div>
        </article>

        <BlogArticleSidebar article={article} />
      </div>
    </main>
  );
}
import { buildApplicationWhatsAppUrl } from "@wooly/shared/config/application";
