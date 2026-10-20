import {
  Map,
  ShieldCheck,
  Package,
  Zap,
  FileCheck,
  MapPin,
  Truck,
} from "lucide-react";

import { getApplicationConfig } from "@wooly/shared/config/application";
import HomeSectionHeader from "./HomeSectionHeader";

const applicationConfig = getApplicationConfig();

const features = [
  {
    number: "1",
    label: "cobertura",
    title: "Llegamos a todo el Perú",
    desc: "Más de 350 destinos entre ciudades principales y provincias.",
    icon: Map,
    color: "primary",
  },
  {
    number: "2",
    label: "seguro",
    title: "Compra 100% respaldada",
    desc: "Caja con seguro incluido, responsables hasta su entrega.",
    icon: ShieldCheck,
    color: "secondary",
  },
  {
    number: "3",
    label: "embalaje",
    title: "Protección de productos",
    desc: "Cajas con film, cintas de seguridad y señalización frágil.",
    icon: Package,
    color: "accent",
  },
  {
    number: "4",
    label: "beneficio",
    title: "Traslado gratis",
    desc: "Lunes, miércoles y viernes el traslado a agencia es gratis.",
    icon: Zap,
    color: "primary",
  },
  {
    number: "5",
    label: "legal",
    title: "Respaldo legal SUNAT",
    desc: "Emitimos boleta o factura válida ante SUNAT, RUC 10 o 20.",
    icon: FileCheck,
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

export default function ShippingSection() {
  return (
    <section id="shipping" className="home-container home-shipping-section">
      <div data-aos="fade-up">
        <HomeSectionHeader
          icon={Truck}
          kicker="Logística garantizada"
          title="Envíos a todo el Perú"
          description="Tu pedido viaja protegido, embalado y con seguimiento para que compres con tranquilidad."
          align="center"
        />
      </div>

      <div className="home-shipping-layout">
        <div className="home-shipping-features">
          {features.map((item, index) => {
            const Icon = item.icon;
            const styles = colorStyles[item.color as keyof typeof colorStyles];

            return (
              <article
                key={item.title}
                className="shipping-feature-card group"
                data-aos="fade-right"
                data-aos-delay={(index % 5) * 60}
              >
                <div className={`shipping-feature-number ${styles.number}`}>
                  {item.number}
                </div>

                <div className="shipping-feature-row">
                  <div
                    className={`shipping-feature-icon bg-[#f7b1d6]/20 text-[#f286be] shadow-sm group-hover:scale-110 group-hover:text-white ${styles.iconHover}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="shipping-feature-content">
                    <div className="shipping-feature-header">
                      <h3 className={`shipping-feature-title ${styles.title}`}>
                        {item.title}
                      </h3>
                      <span
                        className={`shipping-feature-label ${styles.label}`}
                      >
                        {item.label}
                      </span>
                    </div>

                    <p className="shipping-feature-description">{item.desc}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div
          className="shipping-image-wrapper"
          data-aos="fade-left"
          data-aos-delay="180"
        >
          <div className="shipping-image-card group">
            <img
              src={applicationConfig.assets.shippingImageUrl}
              alt="logística y despacho wooly"
              className="shipping-image"
              loading="lazy"
            />

            <div className="shipping-image-overlay" />

            <div className="shipping-image-badge-top">
              <MapPin className="h-5 w-5 text-[#1d8299]" />
              <div>
                <strong>desde tacna</strong>
                <small>a todo el país</small>
              </div>
            </div>

            <div className="shipping-image-badge-bottom">
              <ShieldCheck className="h-6 w-6 shrink-0 text-green-600" />
              <div>
                <strong>compra protegida</strong>
                <p>seguimiento garantizado por shalom pro</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
