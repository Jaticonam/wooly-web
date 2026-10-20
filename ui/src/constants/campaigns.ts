export interface CampaignTheme {
  from: string;
  to: string;
  foreground: string;
  shadow: string;
}

export interface CampaignConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  priority: number;
  keywords: readonly string[];
  theme: CampaignTheme;
}

export const CAMPAIGN_CONFIG = [
  {
    id: "san-valentin",
    name: "San Valentín",
    icon: "❤️",
    color: "rosado",
    priority: 100,
    keywords: [
      "san valentin",
      "san valentín",
      "valentin",
      "valentín",
      "enamorados",
    ],
    theme: {
      from: "#f286be",
      to: "#ffb7d5",
      foreground: "#ffffff",
      shadow: "rgba(242, 134, 190, 0.28)",
    },
  },
  {
    id: "dia-mujer",
    name: "Día de la Mujer",
    icon: "🌷",
    color: "fucsia",
    priority: 95,
    keywords: [
      "dia de la mujer",
      "día de la mujer",
      "dia mujer",
      "día mujer",
      "mujer",
    ],
    theme: {
      from: "#be185d",
      to: "#fb7185",
      foreground: "#ffffff",
      shadow: "rgba(190, 24, 93, 0.28)",
    },
  },
  {
    id: "dia-madre",
    name: "Día de la Madre",
    icon: "💐",
    color: "lavanda",
    priority: 90,
    keywords: [
      "dia de la madre",
      "día de la madre",
      "dia madre",
      "día madre",
      "madre",
      "mama",
      "mamá",
    ],
    theme: {
      from: "#d946ef",
      to: "#f9a8d4",
      foreground: "#ffffff",
      shadow: "rgba(217, 70, 239, 0.28)",
    },
  },
  {
    id: "dia-padre",
    name: "Día del Padre",
    icon: "👔",
    color: "azul",
    priority: 85,
    keywords: [
      "para papa",
      "para papá",
      "dia del padre",
      "día del padre",
      "dia padre",
      "día padre",
      "padre",
      "papa",
      "papá",
      "father",
    ],
    theme: {
      from: "#1e3a8a",
      to: "#3b82f6",
      foreground: "#ffffff",
      shadow: "rgba(37, 99, 235, 0.28)",
    },
  },
  {
    id: "graduados",
    name: "Graduados",
    icon: "🎓",
    color: "morado",
    priority: 80,
    keywords: [
      "graduados",
      "graduado",
      "graduada",
      "graduacion",
      "graduación",
    ],
    theme: {
      from: "#7c3aed",
      to: "#a78bfa",
      foreground: "#ffffff",
      shadow: "rgba(124, 58, 237, 0.28)",
    },
  },
  {
    id: "flores-amarillas",
    name: "Flores Amarillas",
    icon: "🌻",
    color: "amarillo",
    priority: 75,
    keywords: [
      "flores amarillas",
      "flor amarilla",
      "amarillas",
      "yellow flowers",
    ],
    theme: {
      from: "#f5b025",
      to: "#facc15",
      foreground: "#422006",
      shadow: "rgba(245, 176, 37, 0.3)",
    },
  },
  {
    id: "hotwheels",
    name: "Hot Wheels",
    icon: "🏎️",
    color: "rojo",
    priority: 70,
    keywords: [
      "hot wheels",
      "hotwheels",
      "autos hot wheels",
    ],
    theme: {
      from: "#dc2626",
      to: "#f97316",
      foreground: "#ffffff",
      shadow: "rgba(220, 38, 38, 0.28)",
    },
  },
] as const satisfies readonly CampaignConfig[];

export type CampaignId = (typeof CAMPAIGN_CONFIG)[number]["id"];

export function getCampaignById(id: string) {
  return CAMPAIGN_CONFIG.find((campaign) => campaign.id === id);
}

export function normalizeCampaignText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getCampaignFromText(value: string) {
  const normalizedValue = normalizeCampaignText(value);

  return CAMPAIGN_CONFIG.find((campaign) =>
    campaign.keywords.some((keyword) =>
      normalizedValue.includes(normalizeCampaignText(keyword)),
    ),
  );
}

export function getCampaignStyle(id: string) {
  const campaign = getCampaignById(id);

  if (!campaign) return undefined;

  return {
    background: `linear-gradient(135deg, ${campaign.theme.from}, ${campaign.theme.to})`,
    color: campaign.theme.foreground,
    boxShadow: `0 10px 24px ${campaign.theme.shadow}`,
  };
}