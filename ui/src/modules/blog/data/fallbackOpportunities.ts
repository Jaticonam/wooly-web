export interface HubOpportunity {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  action: string;
  href: string;
  metrics: { label: string; score: number }[];
}

export const FALLBACK_OPPORTUNITIES: HubOpportunity[] = [
  {
    id: "san-valentin-combos",
    emoji: "❤️",
    title: "Combos para San Valentín",
    subtitle:
      "La oportunidad está en vender presentaciones completas, no productos sueltos.",
    action:
      "Arma 3 niveles de combo: detalle rápido, regalo premium y sorpresa completa.",
    href: "/blog/campanas/san-valentin",
    metrics: [
      { label: "Papel coreano", score: 92 },
      { label: "Peluches", score: 88 },
      { label: "Cajas premium", score: 84 },
    ],
  },
  {
    id: "dia-madre-preventa",
    emoji: "🌷",
    title: "Preventa Día de la Madre",
    subtitle:
      "Alta demanda para arreglos, cajas grandes y regalos emocionales con planificación previa.",
    action: "Crea preventa con cupos, fechas límite y combos por presupuesto.",
    href: "/blog/campanas/dia-madre",
    metrics: [
      { label: "Flores premium", score: 90 },
      { label: "Cajas grandes", score: 82 },
      { label: "Papel elegante", score: 76 },
    ],
  },
  {
    id: "hotwheels-packs",
    emoji: "🏎️",
    title: "Packs Hot Wheels",
    subtitle:
      "Nicho ideal para compra recurrente, coleccionismo y regalos temáticos.",
    action:
      "Agrupa por modelo, color, categoría o misterio para aumentar ticket promedio.",
    href: "/blog/campanas/hot-wheels",
    metrics: [
      { label: "Coleccionables", score: 86 },
      { label: "Packs", score: 72 },
      { label: "Mystery box", score: 64 },
    ],
  },
];
