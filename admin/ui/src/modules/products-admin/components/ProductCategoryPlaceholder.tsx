import {
  Flower2,
  Heart,
  Layers3,
  Package,
  Gift,
  Balloon,
  Sparkles,
  KeyRound,
  CarFront,
} from "lucide-react";

type Props = {
  category: string;
};

const categories = {
  flores: { Icon: Flower2, color: "#F9A8D4" },
  peluches: { Icon: Heart, color: "#FBC4A4" },
  papeles: { Icon: Layers3, color: "#C4B5FD" },
  cajas: { Icon: Package, color: "#F9D58B" },
  cintas: { Icon: Gift, color: "#F8B4D9" },
  globos: { Icon: Balloon, color: "#A5D8F3" },
  accesorios: { Icon: Sparkles, color: "#B5DFD4" },
  llaveros: { Icon: KeyRound, color: "#B7D7F6" },
  hotwheels: { Icon: CarFront, color: "#F5B5A7" },
};

export default function ProductCategoryPlaceholder({ category }: Props) {
  const normalized = String(category ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  const key = normalized as keyof typeof categories;
  const selected = categories[key] ?? {
    Icon: Package,
    color: "#E2E8F0",
  };

  const Icon = selected.Icon;

  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: selected.color,
      }}
    >
      <div
        style={{
          display: "flex",
          width: 76,
          height: 76,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
        }}
      >
        <Icon size={36} strokeWidth={1.7} color="#334155" />
      </div>
    </div>
  );
}