import {
  BookOpen,
  FlaskConical,
  TrendingUp,
  Lightbulb,
  Briefcase,
  CalendarDays,
  ShoppingBag,
  GraduationCap,
} from "lucide-react";

export const HUB_ROUTES = [
  { id: "inicio", label: "Inicio", href: "/blog", icon: BookOpen },
  {
    id: "laboratorio",
    label: "Laboratorio Ideas",
    href: "/blog/laboratorio",
    icon: FlaskConical,
  },
  {
    id: "tendencias",
    label: "Tendencias",
    href: "/blog/tendencias",
    icon: TrendingUp,
  },
  {
    id: "oportunidades",
    label: "Oportunidades",
    href: "/blog/oportunidades",
    icon: Lightbulb,
  },
  {
    id: "herramientas",
    label: "Herramientas",
    href: "/blog/herramientas",
    icon: Briefcase,
    children: [
      {
        id: "calculadora-margen",
        label: "Calculadora margen",
        href: "/blog/herramientas/calculadora-margen",
      },
      {
        id: "precio-sugerido",
        label: "Precio sugerido",
        href: "/blog/herramientas/precio-sugerido",
      },
      {
        id: "checklist-campana",
        label: "Checklist campaña",
        href: "/blog/herramientas/checklist-campana",
      },
      {
        id: "kit-inventario",
        label: "Kit inventario",
        href: "/blog/herramientas/kit-inventario",
      },
    ],
  },
  {
    id: "campanas",
    label: "Campañas",
    href: "/blog/campanas",
    icon: CalendarDays,
    children: [
      {
        id: "san-valentin",
        label: "San Valentín",
        href: "/blog/campanas/san-valentin",
      },
      {
        id: "dia-madre",
        label: "Día de la Madre",
        href: "/blog/campanas/dia-madre",
      },
      {
        id: "hot-wheels",
        label: "Hot Wheels",
        href: "/blog/campanas/hot-wheels",
      },
    ],
  },
  {
    id: "catalogo",
    label: "Catálogo Wooly",
    href: "/blog/catalogo",
    icon: ShoppingBag,
  },
  {
    id: "guias",
    label: "Guías y Estrategias",
    href: "/blog/guias",
    icon: GraduationCap,
    children: [
      {
        id: "guias-productos",
        label: "📦 Productos",
        href: "/blog/guias?cat=productos",
      },
      {
        id: "guias-ventas",
        label: "💰 Ventas",
        href: "/blog/guias?cat=ventas",
      },
      {
        id: "guias-tendencias",
        label: "📈 Tendencias",
        href: "/blog/guias?cat=tendencias",
      },
      {
        id: "guias-campanas",
        label: "📅 Campañas",
        href: "/blog/guias?cat=campañas",
      },
      {
        id: "guias-negocios",
        label: "💡 Negocios",
        href: "/blog/guias?cat=negocios",
      },
      {
        id: "guias-estrategias",
        label: "🚀 Estrategias",
        href: "/blog/guias?cat=estrategias",
      },
    ],
  },
];

export const HUB_RIGHT_RAIL = {
  explore: ["laboratorio", "tendencias", "herramientas"],
  popular: [
    { label: "10 insumos rentables", href: "/blog/insumos-rentables" },
    { label: "Papel coreano premium", href: "/blog/tipos-papel-coreano" },
    { label: "Cajas premium para regalos", href: "/blog/cajas-premium" },
  ],
  campaign: {
    label: "San Valentín",
    href: "/blog/campanas/san-valentin",
    description:
      "Productos, ideas y estrategias para preparar tu campaña más rentable.",
  },
  tool: {
    label: "Calculadora de margen",
    href: "/blog/herramientas/calculadora-margen",
    description:
      "Calcula cuánto cobrar para proteger utilidad y crecer con orden.",
  },
};
