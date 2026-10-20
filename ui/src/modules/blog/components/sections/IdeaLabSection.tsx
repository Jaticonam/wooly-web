import { Link } from "react-router-dom";
import { ArrowRight, FlaskConical } from "lucide-react";
import { FALLBACK_IDEAS } from "../../data/fallbackIdeas";

export default function IdeaLabSection() {
  return (
    <section className="hub-section idea-lab-section">
      <FlaskConical className="hub-ghost-icon" />

      <div className="hub-section-head">
        <span>
          <FlaskConical size={16} /> LABORATORIO DE IDEAS
        </span>
        <h2>Convierte productos en ofertas vendibles</h2>
        <p>
          Explora combinaciones comerciales para crear propuestas con mejor
          margen, mayor valor percibido y más intención de compra.
        </p>
      </div>

      <div className="idea-lab-grid">
        {FALLBACK_IDEAS.map((idea) => (
          <article key={idea.id} className="hub-card idea-lab-card">
            <div className="idea-lab-top">
              <div className="idea-lab-emoji">{idea.emoji}</div>
              <span className={`idea-label idea-label-${idea.labelType}`}>
                {idea.label}
              </span>
            </div>

            <h3>{idea.title}</h3>
            <p>{idea.description}</p>

            <div className="idea-lab-products">
              {idea.products.map((product) => (
                <small key={product}>{product}</small>
              ))}
            </div>

            <Link to={idea.href}>
              Explorar idea <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
