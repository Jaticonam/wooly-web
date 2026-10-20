import { Crown, Users, Video, Zap } from "lucide-react";

import HomeSectionHeader from "./HomeSectionHeader";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";

const vipBenefits = [
  {
    number: "1",
    label: "Beneficio",
    title: "Precios y preventas",
    description:
      "Compra con mejores precios por cajón y asegura mercadería antes de su llegada.",
    icon: Zap,
    color: "secondary",
  },
  {
    number: "2",
    label: "Directo",
    title: "Videollamadas",
    description:
      "Te mostramos productos en tiempo real para que compres con seguridad.",
    icon: Video,
    color: "primary",
  },
  {
    number: "3",
    label: "Exclusivo",
    title: "Grupo VIP",
    description:
      "Recibe preventas, promociones y oportunidades antes que el resto.",
    icon: Users,
    color: "accent",
  },
];

const colorStyles = {
  primary: {
    number: "group-hover:text-[#1d8299]/10",
    iconHover: "group-hover:bg-[#1d8299]",
    label: "bg-[#1d8299]/10 text-[#1d8299]",
    title: "group-hover:text-[#1d8299]",
  },
  secondary: {
    number: "group-hover:text-[#f286be]/10",
    iconHover: "group-hover:bg-[#f286be]",
    label: "bg-[#f286be]/10 text-[#f286be]",
    title: "group-hover:text-[#f286be]",
  },
  accent: {
    number: "group-hover:text-[#f5b025]/10",
    iconHover: "group-hover:bg-[#f5b025]",
    label: "bg-[#f5b025]/10 text-[#f5b025]",
    title: "group-hover:text-[#f5b025]",
  },
} as const;

export default function VipSection() {
  return (
    <section className="home-container home-vip-section">
      <div data-aos="fade-up">
        <HomeSectionHeader
          icon={Crown}
          kicker="Acceso preferencial"
          title="Mayoristas VIP"
          description="Beneficios exclusivos para quienes quieren comprar mejor, acceder antes y vender con más estrategia."
          align="center"
        />
      </div>

      <div className="home-vip-grid">
        {vipBenefits.map((item, index) => {
          const Icon = item.icon;
          const styles = colorStyles[item.color as keyof typeof colorStyles];

          return (
            <article
              key={item.title}
              className="vip-card group"
              data-aos="fade-up"
              data-aos-delay={index * 80}
            >
              <div className={`vip-card-number ${styles.number}`}>
                {item.number}
              </div>

              <div className="vip-card-header">
                <div className="vip-card-title-row">
                  <div
                    className={`vip-card-icon bg-[#f7b1d6]/20 text-[#f286be] shadow-sm group-hover:scale-110 group-hover:text-white ${styles.iconHover}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className={`vip-card-title ${styles.title}`}>
                    {item.title}
                  </h3>
                </div>

                <span className={`vip-card-label ${styles.label}`}>
                  {item.label}
                </span>
              </div>

              <p className="vip-card-description">{item.description}</p>
            </article>
          );
        })}
      </div>

      <div className="vip-cta-wrapper" data-aos="zoom-in" data-aos-delay="160">
        <a
          href={buildApplicationWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="vip-cta-btn"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Quiero ser Mayorista ahora
        </a>

        <p className="vip-cta-note">
          Acceso inmediato por WhatsApp con atención rápida y directa.
        </p>
      </div>
    </section>
  );
}
import { buildApplicationWhatsAppUrl } from "@wooly/shared/config/application";
