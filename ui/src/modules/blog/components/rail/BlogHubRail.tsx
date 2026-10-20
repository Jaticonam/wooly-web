import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageCircle,
  Rocket,
  ShoppingBag,
} from "lucide-react";
import BlogRailCard from "./BlogRailCard";
import {
  buildApplicationWhatsAppUrl,
} from "@wooly/shared/config/application";

const HOT_PRODUCTS = [
  "Papel coreano premium",
  "Cajas premium",
  "Peluches tendencia",
];

export default function BlogHubRail() {
  return (
    <aside className="blog-rail">
      <BlogRailCard title="🚀 Oportunidad destacada">
        <strong>Día de la Madre Premium</strong>
        <p>
          Alta demanda para flores premium, papel coreano y cajas de regalo.
        </p>
        <Link to="/catalogo">
          Ver oportunidad <ArrowRight size={14} />
        </Link>
      </BlogRailCard>

      <BlogRailCard title="📅 Próxima campaña">
        <strong>❤️ San Valentín</strong>
        <p>
          Flores, peluches, papel coreano y regalos emocionales con alta
          intención de compra.
        </p>
        <Link to="/blog/campanas">
          Explorar campañas <ArrowRight size={14} />
        </Link>
      </BlogRailCard>

      <BlogRailCard title="🔥 Productos calientes">
        {HOT_PRODUCTS.map((item) => (
          <Link key={item} to="/catalogo">
            {item}
            <ArrowRight size={13} />
          </Link>
        ))}
      </BlogRailCard>

      <BlogRailCard title="📈 Accesos rápidos">
        <Link to="/catalogo">
          <span>
            <ShoppingBag size={14} />
            Ver catálogo
          </span>
          <ArrowRight size={13} />
        </Link>
        <Link to="/blog/guias">
          <span>
            <Rocket size={14} />
            Centro de guías
          </span>
          <ArrowRight size={13} />
        </Link>
      </BlogRailCard>

      <BlogRailCard title="🧮 Herramienta recomendada">
        <strong>Calculadora de margen</strong>
        <p>Descubre cuánto cobrar para proteger tu utilidad.</p>
        <Link to="/blog/herramientas">
          Abrir herramienta <ArrowRight size={14} />
        </Link>
      </BlogRailCard>

      <a
        className="blog-rail-whatsapp"
        href={buildApplicationWhatsAppUrl()}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={17} /> Hablar con asesor
      </a>
    </aside>
  );
}
