import { MessageCircle, Search } from "lucide-react";
import BlogSidebarMenu from "./BlogSidebarMenu";
import BlogSidebarCard from "./BlogSidebarCard";

interface Props {
  q: string;
  setQ: (value: string) => void;
}

export default function BlogSidebar({ q, setQ }: Props) {
  return (
    <aside className="blog-sidebar">
      <div className="blog-sidebar-top">
        <div className="blog-brand">
          <small>🧠 CENTRO WOOLY</small>
          <strong>Ideas, tendencias y herramientas para emprendedores.</strong>
        </div>

        <div className="blog-search">
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
          />
        </div>

        <BlogSidebarMenu />
      </div>

      <BlogSidebarCard title="INSIGHTS" icon="💡">
        <div className="blog-side-mini">
          <small>🔥 MÁS LEÍDO</small>
          <strong>Papel Coreano Premium</strong>
        </div>

        <div className="blog-side-mini">
          <small>📈 TENDENCIA</small>
          <strong>Cajas premium para regalos</strong>
        </div>

        <div className="blog-side-mini">
          <small>📅 PRÓXIMA CAMPAÑA</small>
          <strong>Día del Padre</strong>
        </div>
      </BlogSidebarCard>

      <a
        className="blog-sales"
        href={buildApplicationWhatsAppUrl()}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={18} /> Hablar con asesor
      </a>
    </aside>
  );
}
import { buildApplicationWhatsAppUrl } from "@wooly/shared/config/application";
