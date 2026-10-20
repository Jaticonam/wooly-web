export interface HubTrend {
  id: string;
  emoji: string;
  title: string;
  label: string;
  metric: string;
  description: string;
  href: string;
}

export const FALLBACK_TRENDS: HubTrend[] = [
  {
    id: "papel-coreano",
    emoji: "🔥",
    title: "Papel coreano premium",
    label: "Alta rotación",
    metric: "+25 variantes",
    description:
      "Ideal para ramos, bouquets y campañas románticas con mayor valor visual.",
    href: "/blog/tipos-papel-coreano",
  },
  {
    id: "cajas-premium",
    emoji: "📦",
    title: "Cajas premium para regalos",
    label: "Mayor ticket",
    metric: "Percepción alta",
    description:
      "Elevan la presentación, permiten combos más completos y ayudan a vender más caro.",
    href: "/blog/guia-cajas-premium",
  },
  {
    id: "peluches",
    emoji: "🧸",
    title: "Peluches como complemento",
    label: "Compra emocional",
    metric: "+ ticket promedio",
    description:
      "Funcionan para armar packs, regalos sorpresa y detalles de alto impulso.",
    href: "/catalogo",
  },
];
