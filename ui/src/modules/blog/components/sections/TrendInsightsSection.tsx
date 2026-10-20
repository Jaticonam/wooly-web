import { Link } from "react-router-dom";
import { ArrowRight, Flame, Rocket, TrendingUp } from "lucide-react";
import { FALLBACK_TRENDS } from "../../data/fallbackTrends";

const RADAR = [
  { name: "Regalos emocionales", score: 92 },
  { name: "Packaging premium", score: 84 },
  { name: "Complementos", score: 71 },
  { name: "Coleccionables", score: 58 },
];

export default function TrendInsightsSection() {
  return (
    <section className="hub-section trend-insights-section">
      <TrendingUp className="hub-ghost-icon" />

      <div className="hub-section-head">
        <span>
          <TrendingUp size={16} /> SEÑALES DEL MERCADO
        </span>

        <h2>Detecta qué productos están creando oportunidades</h2>

        <p>
          Observa señales comerciales para decidir qué comprar, qué destacar y
          qué convertir en oferta.
        </p>
      </div>

      <div className="trend-insights-grid trend-insights-grid-pro">
        <article className="hub-card trend-insights-card trend-hot-card">
          <h3>
            <Flame size={18} /> Productos calientes
          </h3>

          {FALLBACK_TRENDS.map((trend) => (
            <Link key={trend.id} to={trend.href} className="trend-hot-item">
              <div className="trend-insights-main">
                <div className="trend-insights-emoji">{trend.emoji}</div>
                <div>
                  <small>{trend.label}</small>
                  <span>{trend.title}</span>
                </div>
              </div>
              <b>{trend.metric}</b>
            </Link>
          ))}
        </article>

        <article className="hub-card trend-insights-card trend-radar-card">
          <h3>📊 Radar comercial</h3>

          {RADAR.map((item) => (
            <div key={item.name} className="trend-radar-item">
              <div>
                <span>{item.name}</span>
                <small>{item.score}%</small>
              </div>
              <span className="hub-metric-bar">
                <i style={{ width: `${item.score}%` }} />
              </span>
            </div>
          ))}
        </article>

        <article className="hub-card trend-insights-card trend-opportunity-card">
          <h3>
            <Rocket size={18} /> Acción sugerida
          </h3>
          <p>
            Convierte papel, cajas y peluches en combos listos para campaña. La
            oportunidad no está solo en vender productos, sino en vender
            presentaciones completas.
          </p>

          <Link to="/blog/oportunidades">
            Ver oportunidad <ArrowRight size={15} />
          </Link>
        </article>
        <div className="hub-section-footer">
          <Link to="/blog/tendencias" className="hub-section-more">
            Ver todas las tendencias <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
