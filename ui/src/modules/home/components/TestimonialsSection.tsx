import { Quote, Star, MapPin } from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";

const testimonials = [
  {
    number: "1",
    label: "capital",
    business: "Regalos luz",
    city: "lima",
    product: "Peluches y Globos",
    text: "los peluches y globos se movieron rápido. en una semana ya había recuperado inversión.",
    color: "primary",
  },
  {
    number: "2",
    label: "Campaña",
    business: "Floería María",
    city: "Arequipa",
    product: "Cajas y Papel Coreano",
    text: "Compré cajas y papel coreano, armé 30 ramos para campaña y vendí todo en pocos días.",
    color: "secondary",
  },
  {
    number: "3",
    label: "asesoría",
    business: "Florería El Jardín",
    city: "Cusco",
    product: "Flores y Accesorios",
    text: "Me ayudaron a elegir productos para mi tienda y no me equivoqué. todo salió muy bien.",
    color: "accent",
  },
  {
    number: "4",
    label: "mayorista",
    business: "Detalles Rosé",
    city: "trujillo",
    product: "papeles y cintas",
    text: "comprar por caja me ayudó a mejorar margen. ahora planifico mis campañas con más orden.",
    color: "primary",
  },
  {
    number: "5",
    label: "Rápido",
    business: "Sorpresas Vale",
    city: "Cajamarca",
    product: "Globos y Cajas",
    text: "La atención fue rápida y el pedido llegó bien embalado. eso da confianza para volver a comprar.",
    color: "secondary",
  },
  {
    number: "6",
    label: "stock",
    business: "Florería Luna",
    city: "Iquitos",
    product: "Flores Artificiales",
    text: "Encontré variedad y pude completar stock para varios pedidos. eso me salvó la campaña.",
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

export default function TestimonialsSection() {
  return (
    <section className="home-container testimonials-section">
      <div data-aos="fade-up">
        <HomeSectionHeader
          icon={Quote}
          kicker="emprendedores que ya compran con wooly"
          title="historias reales que respaldan tu decisión"
          description="clientes que abastecen sus campañas, mejoran su margen y compran con más seguridad."
          align="center"
        />
      </div>

      <div className="testimonials-grid">
        {testimonials.map((item, index) => {
          const styles = colorStyles[item.color as keyof typeof colorStyles];

          return (
            <article
              key={`${item.business}-${item.city}`}
              className="testimonial-card group"
              data-aos="fade-up"
              data-aos-delay={(index % 3) * 70}
            >
              <div className={`testimonial-number ${styles.number}`}>
                {item.number}
              </div>

              <div className="testimonial-header">
                <div className="testimonial-business">
                  <div className={`testimonial-icon ${styles.iconHover}`}>
                    <Quote className="h-5 w-5" />
                  </div>

                  <div className="testimonial-meta">
                    <strong className={`testimonial-name ${styles.title}`}>
                      {item.business}
                    </strong>

                    <span className="testimonial-city">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {item.city}
                    </span>
                  </div>
                </div>

                <span className={`testimonial-label ${styles.label}`}>
                  {item.label}
                </span>
              </div>

              <div className="testimonial-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>

              <p className="testimonial-text">“{item.text}”</p>
              <span className="testimonial-product">
                compró: {item.product}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
