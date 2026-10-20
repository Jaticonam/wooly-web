export interface HubIdea {
  id: string;
  emoji: string;
  title: string;
  label: string;
  labelType: "ticket" | "margin" | "start";
  description: string;
  products: string[];
  href: string;
}

export const FALLBACK_IDEAS: HubIdea[] = [
  {
    id: "ramos-premium",
    emoji: "🌹",
    title: "Ramos premium",
    label: "Mayor ticket",
    labelType: "ticket",
    description:
      "Combina papel coreano, cajas y detalles para crear arreglos con mayor valor percibido.",
    products: ["Papel coreano", "Cajas premium", "Cintas"],
    href: "/blog/tipos-papel-coreano",
  },

  {
    id: "regalos-corporativos",
    emoji: "🎁",
    title: "Regalos corporativos",
    label: "Alto margen",
    labelType: "margin",
    description:
      "Ideas elegantes para empresas, fechas institucionales y clientes que buscan presentación profesional.",
    products: ["Cajas", "Tarjetas", "Complementos"],
    href: "/blog/guia-cajas-premium",
  },

  {
    id: "kit-emprendedor",
    emoji: "🚀",
    title: "Kit emprendedor",
    label: "Inicio rápido",
    labelType: "start",
    description:
      "Una combinación base para empezar a vender regalos con bajo inventario y buena rotación.",
    products: ["Papeles", "Cintas", "Peluches"],
    href: "/blog/insumos-rentables",
  },
];
