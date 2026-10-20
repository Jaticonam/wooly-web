import {
  Search,
  FlaskConical,
  TrendingUp,
  CalendarDays,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

interface Props {
  q: string;
  setQ: (value: string) => void;
  setCat: (value: string) => void;
}

const QUICK_LINKS = [
  { href: "#laboratorio", label: "Ideas vendibles", icon: FlaskConical },
  { href: "#tendencias", label: "Señales del mercado", icon: TrendingUp },
  { href: "#campanas", label: "Campañas", icon: CalendarDays },
  {
    href: "#catalogo-wooly",
    label: "Productos estratégicos",
    icon: ShoppingBag,
  },
];

export default function BlogHero({ q, setQ }: Props) {
  return (
    <section className="blog-center-hero">
      <Sparkles className="blog-hero-ghost" />
      <span className="blog-center-kicker">
        CENTRO DE INTELIGENCIA COMERCIAL
      </span>

      <h1>
        Compra mejor. <span>Vende mejor.</span> <br /> Crece más rápido.
      </h1>

      <p>
        Ideas, tendencias, campañas, herramientas y productos seleccionados para
        emprendedores que quieren comprar mejor, vender con más margen y crecer
        con estrategia.
      </p>

      <div className="blog-center-search">
        <Search size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ideas, campañas, herramientas o productos..."
        />
      </div>

      <div className="blog-center-links">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.href} href={item.href}>
              <Icon size={16} />
              {item.label}
            </a>
          );
        })}
      </div>
    </section>
  );
}

