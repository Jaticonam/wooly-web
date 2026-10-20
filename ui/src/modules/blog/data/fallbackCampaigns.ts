export interface HubCampaign {
  id: string;
  emoji: string;
  title: string;
  season: string;
  description: string;
  checklist: string[];
  href: string;
  priority: number;
  featured: boolean;
}

export const FALLBACK_CAMPAIGNS: HubCampaign[] = [
  {
    id: "san-valentin",
    emoji: "❤️",
    title: "San Valentín",
    season: "Campaña principal",
    description:
      "La campaña más rentable para flores, peluches, papel coreano, cajas premium y regalos emocionales.",
    checklist: [
      "Flores",
      "Peluches",
      "Papel coreano",
      "Cajas premium",
      "Cintas",
    ],
    href: "/blog/campanas/san-valentin",
    priority: 1,
    featured: true,
  },
  {
    id: "dia-madre",
    emoji: "🌷",
    title: "Día de la Madre",
    season: "Alta demanda emocional",
    description:
      "Temporada clave para arreglos, detalles personalizados, regalos familiares y preventa por stock.",
    checklist: [
      "Flores",
      "Peluches premium",
      "Papel elegante",
      "Globos",
      "Cajas grandes",
    ],
    href: "/blog/campanas/dia-madre",
    priority: 2,
    featured: false,
  },
  {
    id: "hot-wheels",
    emoji: "🏎️",
    title: "Hot Wheels",
    season: "Nicho coleccionable",
    description:
      "Unidad de negocio con compra impulsiva, colecciones, packs, mystery box y venta recurrente.",
    checklist: [
      "Hot Wheels",
      "Packs",
      "Cajas regalo",
      "Protectores",
      "Colecciones",
    ],
    href: "/blog/campanas/hot-wheels",
    priority: 3,
    featured: false,
  },
];
