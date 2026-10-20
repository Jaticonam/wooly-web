import { ArrowRight, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { FALLBACK_BUSINESS_TOOLS } from "../../data/fallbackBusinessTools";

export default function BusinessToolsSection() {
  return (
    <section className="business-tools-section">
      <Briefcase className="hub-ghost-icon" />

      <div className="business-tools-head">
        <span>
          <Briefcase size={15} /> HERRAMIENTAS B2B
        </span>

        <h2>Recursos para emprendedores</h2>

        <p>
          Herramientas creadas para ayudarte a comprar mejor, vender con más
          margen y tomar decisiones más rápidas.
        </p>
      </div>

      <div className="business-tools-grid">
        {FALLBACK_BUSINESS_TOOLS.map((tool) => (
          <Link key={tool.id} to={tool.href} className="business-tool-card">
            <div className="business-tool-icon">{tool.icon}</div>

            <div>
              <small
                className={tool.status === "Activo" ? "is-active" : "is-soon"}
              >
                {tool.status}
              </small>

              <h3>{tool.title}</h3>

              <p>{tool.description}</p>
            </div>

            <span>
              Usar herramienta <ArrowRight size={15} />
            </span>
          </Link>
        ))}
      </div>
      <div className="hub-section-footer">
        <Link to="/blog/herramientas" className="hub-section-more">
          Abrir centro de herramientas <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
