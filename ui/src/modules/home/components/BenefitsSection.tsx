import {
  Layers,
  RotateCw,
  ShieldCheck,
  Store,
  Headphones,
  MapPin,
  Sparkles,
} from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";

const pillars = [
  {
    number: "1",
    label: "ventaja",
    title: "Variedad real",
    description: "Todo lo que necesitas para vender, sin cambiar de proveedor.",
    icon: Layers,
    color: "primary",
  },
  {
    number: "2",
    label: "beneficio",
    title: "Alta rotación",
    description: "Productos que se venden rápido y liberan tu inversión.",
    icon: RotateCw,
    color: "secondary",
  },
  {
    number: "3",
    label: "garantía",
    title: "Calidad que vende",
    description: "Mejor presentación, mayor valor y clientes más satisfechos.",
    icon: ShieldCheck,
    color: "accent",
  },
  {
    number: "4",
    label: "eficiencia",
    title: "Compra inteligente",
    description: "Ahorra tiempo y dinero comprando todo en un solo lugar.",
    icon: Store,
    color: "primary",
  },
  {
    number: "5",
    label: "soporte",
    title: "Asesoría directa",
    description: "Te ayudamos por WhatsApp a elegir mejor y vender más.",
    icon: Headphones,
    color: "secondary",
  },
  {
    number: "6",
    label: "logística",
    title: "Envío nacional",
    description:
      "Recibe tu pedido rápido y sin complicaciones en todo el Perú.",
    icon: MapPin,
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

export default function BenefitsSection() {
  return (
    <section className="home-container benefits-section">
      <div data-aos="fade-up">
        <HomeSectionHeader
          icon={Sparkles}
          kicker="ventajas reales"
          title="Compra mejor. Vende más."
          description="Todo lo que necesitas para vender rápido, sin perder tiempo ni dinero."
          align="center"
        />
      </div>

      <div className="benefits-grid">
        {pillars.map((item, index) => {
          const Icon = item.icon;
          const styles = colorStyles[item.color as keyof typeof colorStyles];

          return (
            <div
              key={item.title}
              className="benefit-card group"
              data-aos="fade-up"
              data-aos-delay={(index % 3) * 70}
            >
              <div className={`benefit-number ${styles.number}`}>
                {item.number}
              </div>

              <div className="benefit-card-header">
                <div className={`benefit-icon ${styles.iconHover}`}>
                  <Icon className="h-7 w-7" />
                </div>

                <span className={`benefit-label ${styles.label}`}>
                  {item.label}
                </span>
              </div>

              <h3 className={`benefit-title ${styles.title}`}>{item.title}</h3>
              <p className="benefit-description">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
