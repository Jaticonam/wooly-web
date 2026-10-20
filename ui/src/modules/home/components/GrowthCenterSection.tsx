import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  FlaskConical,
} from "lucide-react";

const GROWTH_ITEMS = [
  {
    icon: BookOpen,
    label: "Guías de producto",
    title: "Aprende qué comprar",
    text: "Conoce usos, combinaciones y criterios para elegir insumos con mejor margen.",
    badge: "GUÍA 1",
  },
  {
    icon: FlaskConical,
    label: "Laboratorio Ideas Wooly",
    title: "Detecta oportunidades",
    text: "Ideas basadas en productos, categorías y tendencias que ayudan a vender mejor.",
    badge: "LAB 2",
  },
  {
    icon: CalendarDays,
    label: "Campañas comerciales",
    title: "Prepárate por temporada",
    text: "San Valentín, Día de la Madre, Navidad y fechas clave para emprendedores.",
    badge: "PLAN 3",
  },
];

export default function GrowthCenterSection() {
  return (
    <section className="growth-center-section">
      <div className="growth-center-heading" data-aos="fade-up">
        <span>
          <BarChart3 size={16} /> CENTRO DE CRECIMIENTO EMPRESARIAL WOOLY
        </span>
        <h2>Aprende, crece y vende más</h2>
        <div className="growth-center-line" />
        <p>
          Guías, estrategias, tendencias y oportunidades para emprendedores que
          quieren comprar mejor, vender más y construir negocios sostenibles.
        </p>
      </div>

      <div className="growth-center-grid">
        {GROWTH_ITEMS.map((item, index) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="growth-center-card"
              data-aos="fade-up"
              data-aos-delay={index * 80}
            >
              <div className="growth-center-icon">
                <Icon size={24} />
              </div>
              <span className="growth-center-badge">{item.badge}</span>
              <strong className="growth-center-number">{index + 1}</strong>
              <small>{item.label}</small>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>

      <div
        className="growth-center-action"
        data-aos="zoom-in"
        data-aos-delay="160"
      >
        <Link to="/blog">
          Ingresar al Centro Wooly <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
