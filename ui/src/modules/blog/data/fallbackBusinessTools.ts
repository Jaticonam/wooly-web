export interface BusinessTool {
  id: string;
  icon: string;
  title: string;
  description: string;
  status: "Activo" | "Próximamente";
  href: string;
}

export const FALLBACK_BUSINESS_TOOLS: BusinessTool[] = [
  {
    id: "margin",
    icon: "🧮",
    title: "Calculadora margen",
    description: "Descubre cuánto debes cobrar para proteger tu utilidad.",
    status: "Próximamente",
    href: "/blog/herramientas/calculadora-margen",
  },
  {
    id: "price",
    icon: "💰",
    title: "Precio sugerido",
    description: "Define precios según costo, margen y valor percibido.",
    status: "Próximamente",
    href: "/blog/herramientas/precio-sugerido",
  },
  {
    id: "campaign",
    icon: "📅",
    title: "Checklist campaña",
    description: "Organiza productos, tiempos y acciones antes de vender.",
    status: "Activo",
    href: "/blog/herramientas/checklist-campana",
  },
  {
    id: "inventory",
    icon: "📦",
    title: "Kit inventario inicial",
    description: "Elige qué comprar primero para empezar con menos riesgo.",
    status: "Activo",
    href: "/blog/herramientas/kit-inventario",
  },
];
