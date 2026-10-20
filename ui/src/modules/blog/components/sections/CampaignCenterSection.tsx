import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckCircle2 } from "lucide-react";
import { FALLBACK_CAMPAIGNS } from "../../data/fallbackCampaigns";

export default function CampaignCenterSection() {
  const campaigns = [...FALLBACK_CAMPAIGNS].sort(
    (a, b) => a.priority - b.priority,
  );
  const [main, ...rest] = campaigns;

  return (
    <section className="hub-section campaign-center-section">
      <CalendarDays className="hub-ghost-icon" />

      <div className="hub-section-head">
        <span>
          <CalendarDays size={16} /> CAMPAÑAS COMERCIALES
        </span>
        <h2>Planifica stock antes que la demanda explote</h2>
        <p>
          Organiza fechas clave, productos recomendados y acciones comerciales
          para vender con más intención.
        </p>
      </div>

      <div className="campaign-center-layout">
        <article className="hub-card campaign-featured-card">
          <div className="campaign-center-emoji">{main.emoji}</div>
          <span className="hub-pill">{main.season}</span>
          <h3>{main.title}</h3>
          <p>{main.description}</p>

          <div className="campaign-center-checklist">
            {main.checklist.map((item) => (
              <span key={item}>
                <CheckCircle2 size={13} />
                {item}
              </span>
            ))}
          </div>

          <Link to={main.href} className="hub-button">
            Preparar campaña <ArrowRight size={16} />
          </Link>
        </article>

        <div className="campaign-side-list">
          {rest.map((campaign) => (
            <Link
              key={campaign.id}
              to={campaign.href}
              className="hub-card campaign-mini-card"
            >
              <div className="campaign-center-emoji small">
                {campaign.emoji}
              </div>
              <div>
                <small>{campaign.season}</small>
                <strong>{campaign.title}</strong>
                <p>{campaign.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="hub-section-footer">
        <Link to="/blog/campanas" className="hub-section-more">
          Explorar campañas <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
