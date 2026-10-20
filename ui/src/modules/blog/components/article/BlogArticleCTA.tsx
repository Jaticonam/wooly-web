import { Link } from "react-router-dom";
import { MessageCircle, ShoppingBag } from "lucide-react";
import type { BlogArticle } from "../../types/blog";
import {
  buildApplicationWhatsAppUrl,
} from "@wooly/shared/config/application";

export default function BlogArticleCTA({ article }: { article: BlogArticle }) {
  const message =
    `Hola Wooly, leí el artículo "${article.title}" y quiero cotizar insumos relacionados.`;
  return (
    <div className="blog-inline-cta">
      <div>
        <span>Acción recomendada</span>
        <h3>Convierte esta idea en ventas</h3>
        <p>
          Explora productos mayoristas relacionados o habla con ventas para
          armar tu pedido.
        </p>
      </div>

      <div>
        <Link to="/catalogo">
          <ShoppingBag size={17} /> Ver catálogo
        </Link>
        <a
          href={buildApplicationWhatsAppUrl(message)}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={17} /> WhatsApp
        </a>
      </div>
    </div>
  );
}
