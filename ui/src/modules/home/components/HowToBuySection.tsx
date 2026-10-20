import {
  PackageOpen,
  ShoppingCart,
  FileCheck,
  CreditCard,
  Truck,
} from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";

const steps = [
  {
    number: "1",
    label: "Paso 1",
    title: "Apertura tu caja",
    description:
      "Comienza tu pedido mayorista desde S/ 30. Luego entra al catálogo o escríbenos por WhatsApp y elige lo que necesitas.",
    icon: PackageOpen,
    color: "primary",
  },
  {
    number: "2",
    label: "Paso 2",
    title: "Acumula a tu ritmo",
    description:
      "Agrega productos desde 3, 12 unidades o por cajón. Cuando tengas todo listo, dale en enviar pedido.",
    icon: ShoppingCart,
    color: "secondary",
  },
  {
    number: "3",
    label: "Paso 3",
    title: "Recibe tu cotización",
    description:
      "Te enviamos el detalle completo con precios claros para que revises y confirmes las cantidades.",
    icon: FileCheck,
    color: "accent",
  },
  {
    number: "4",
    label: "Paso 4",
    title: "Confirma y paga",
    description:
      "Realiza tu pago por el medio que prefieras (Yape o Transferencia BCP) y comparte tus datos de envío.",
    icon: CreditCard,
    color: "primary",
  },
  {
    number: "5",
    label: "Paso 5",
    title: "Enviamos a tu ciudad",
    description:
      "Preparamos y alistamos tu pedido, embalamos con cuidado y lo enviamos con seguro de caja por Shalom Pro.",
    icon: Truck,
    color: "secondary",
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

export default function HowToBuySection() {
  return (
    <section id="howtobySection" className="how-to-buy-section">
      <div className="how-to-buy-bg" />

      <div className="home-container how-to-buy-container">
        <div data-aos="fade-up">
          <HomeSectionHeader
            icon={ShoppingCart}
            kicker="empieza ahora"
            title="Compra en minutos, vende hoy"
            description="Sigue estos 5 pasos y asegura stock listo para generar ingresos."
          />
        </div>

        <div className="how-to-buy-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const styles = colorStyles[step.color as keyof typeof colorStyles];

            return (
              <div
                key={step.number}
                className="how-to-buy-card group"
                data-aos="fade-up"
                data-aos-delay={(index % 5) * 70}
              >
                <div className={`how-to-buy-number ${styles.number}`}>
                  {step.number}
                </div>

                <div className="how-to-buy-card-header">
                  <div className={`how-to-buy-icon ${styles.iconHover}`}>
                    <Icon className="h-7 w-7" />
                  </div>

                  <span className={`how-to-buy-label ${styles.label}`}>
                    {step.label}
                  </span>
                </div>

                <h3 className={`how-to-buy-title ${styles.title}`}>
                  {step.title}
                </h3>
                <p className="how-to-buy-description">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
