import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, Zap } from "lucide-react";
import { FALLBACK_OPPORTUNITIES } from "../../data/fallbackOpportunities";

export default function OpportunityCenterSection() {
  const main = FALLBACK_OPPORTUNITIES[0];
  const rest = FALLBACK_OPPORTUNITIES.slice(1);

  return (
    <section className="hub-section opportunity-center-section">
      <Lightbulb className="hub-ghost-icon" />

      <div className="hub-section-head">
        <span>
          <Lightbulb size={16} /> OPORTUNIDADES DETECTADAS
        </span>
        <h2>Convierte señales en ofertas vendibles</h2>
        <p>
          Encuentra combinaciones comerciales, productos clave y acciones
          concretas para vender con más intención.
        </p>
      </div>

      <div className="opportunity-center-layout">
        <article className="hub-card opportunity-main-card">
          <div className="opportunity-main-top">
            <div className="opportunity-emoji">{main.emoji}</div>
            <span className="hub-pill">
              <Zap size={14} /> Recomendación activa
            </span>
          </div>

          <h3>{main.title}</h3>
          <p>{main.subtitle}</p>

          <div className="opportunity-metrics">
            {main.metrics.map((m) => (
              <div key={m.label} className="opportunity-metric">
                <div>
                  <strong>{m.label}</strong>
                  <small>{m.score}%</small>
                </div>
                <span className="hub-metric-bar">
                  <i style={{ width: `${m.score}%` }} />
                </span>
              </div>
            ))}
          </div>

          <div className="opportunity-action-box">
            <b>Acción recomendada</b>
            <p>{main.action}</p>
          </div>

          <Link to={main.href} className="hub-button">
            Ver combos San Valentín
            <ArrowRight size={16} />
          </Link>
        </article>

        <div className="opportunity-side-list">
          {rest.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="hub-card opportunity-mini-card"
            >
              <div className="opportunity-emoji small">{item.emoji}</div>
              <div>
                <small>Oportunidad</small>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="hub-section-footer">
          <Link to="/blog/oportunidades" className="hub-section-more">
            Ver oportunidades <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
