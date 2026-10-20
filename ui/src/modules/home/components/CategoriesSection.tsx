import { Link } from "react-router-dom";
import { ArrowRight, Tags } from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";

const categories = [
  {
    name: "Flores & Rosas",
    tag: "Alta demanda",
    description: "Ideales para ramos, campañas y ventas rápidas",
    slug: "flores",
    image: buildPublicUrl("/og/flores.jpg"),
    priority: 100,
  },
  {
    name: "Peluches",
    tag: "Sube ticket",
    description: "Perfectos para aumentar el valor del pedido",
    slug: "peluches",
    image: buildPublicUrl("/og/peluches.jpg"),
    priority: 90,
  },
  {
    name: "Papel Coreano",
    tag: "Acabado premium",
    description: "Eleva la presentación de cualquier detalle",
    slug: "papeles",
    image: buildPublicUrl("/og/papeles.jpg"),
    priority: 85,
  },
  {
    name: "Cajas & Bolsas",
    tag: "Empaque listo",
    description: "Solución directa para empaquetar y vender",
    slug: "cajas",
    image: buildPublicUrl("/og/cajas.jpg"),
    priority: 95,
  },
  {
    name: "Cintas & Deco",
    tag: "Detalle clave",
    description: "El toque final que hace destacar el producto",
    slug: "cintas",
    image: buildPublicUrl("/og/cintas.jpg"),
    priority: 80,
  },
  {
    name: "Globos",
    tag: "Venta rápida",
    description: "Alta rotación en fechas y campañas",
    slug: "globos",
    image: buildPublicUrl("/og/globos.jpg"),
    priority: 88,
  },
  {
    name: "Accesorios",
    tag: "Producción total",
    description: "Complementos para armar pedidos completos",
    slug: "accesorios",
    image: buildPublicUrl("/og/accesorios.jpg"),
    priority: 75,
  },
  {
    name: "Hot Wheels",
    tag: "Alta rotación",
    description: "Producto coleccionable con alta demanda",
    slug: "hotwheels",
    image: buildPublicUrl("/og/hotwheels.jpg"),
    priority: 92,
  },
];

export default function CategoriesSection() {
  return (
    <section className="home-container home-categories-section">
      <div className="home-categories-header" data-aos="fade-up">
        <HomeSectionHeader
          icon={Tags}
          kicker="Categorías más vendidas"
          title="Elige productos que ya tienen salida"
          description="Arma tu pedido por categorías, combina productos estratégicamente y compra más rápido sin perder margen."
        />
      </div>

      <div className="home-categories-grid">
        {categories.map((cat, index) => (
          <Link
            key={cat.slug}
            to={`/catalogo/categoria.html?cat=${cat.slug}`}
            data-aos="fade-up"
            data-aos-delay={(index % 4) * 60}
            className={`home-category-card group ${index === 0 ? "home-category-card-featured" : ""}`}
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="home-category-image transition-transform duration-700 group-hover:scale-110"
            />

            <div className="home-category-overlay" />

            <div className="home-category-content">
              <span className="home-category-tag">🔥 {cat.tag}</span>

              <div className="flex items-end justify-between gap-4">
                <div className="flex max-w-[78%] flex-col gap-1">
                  <h3 className="home-category-title">{cat.name}</h3>
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-white/85 md:text-[15px]">
                    {cat.description}
                  </p>
                </div>

                <span className="home-category-arrow transition-all duration-300 group-hover:scale-110 group-hover:bg-[#1d8299]">
                  <ArrowRight size={18} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
import { buildPublicUrl } from "@wooly/shared/config/application";
