import { useEffect, useRef, useState } from "react";
import { BarChart3, Boxes, MapPin, Truck, Users } from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";

type StatItem = {
  target: number;
  label: string;
  icon: typeof Users;
  gradient: string;
  ghost: string;
  iconBg: string;
  iconColor: string;
  iconHover: string;
};

const stats: StatItem[] = [
  {
    target: 1500,
    label: "Clientes activos",
    icon: Users,
    gradient: "from-[#1d8299] to-[#38bdf8]",
    ghost: "text-[#1d8299]/5 group-hover:text-[#1d8299]/10",
    iconBg: "bg-[#1d8299]/10",
    iconColor: "text-[#1d8299]",
    iconHover: "group-hover:bg-[#1d8299] group-hover:text-white",
  },
  {
    target: 550,
    label: "Productos en catálogo",
    icon: Boxes,
    gradient: "from-[#f391a0] to-[#f7b1d6]",
    ghost: "text-[#f391a0]/5 group-hover:text-[#f391a0]/10",
    iconBg: "bg-[#f7b1d6]/20",
    iconColor: "text-[#f286be]",
    iconHover: "group-hover:bg-[#f286be] group-hover:text-white",
  },
  {
    target: 75,
    label: "Ciudades cubiertas",
    icon: MapPin,
    gradient: "from-[#f9b233] to-[#fcd34d]",
    ghost: "text-[#f9b233]/5 group-hover:text-[#f9b233]/10",
    iconBg: "bg-[#f5b025]/10",
    iconColor: "text-[#f5b025]",
    iconHover: "group-hover:bg-[#f5b025] group-hover:text-white",
  },
  {
    target: 2800,
    label: "Pedidos entregados",
    icon: Truck,
    gradient: "from-[#6a5a8a] to-[#a78bfa]",
    ghost: "text-[#6a5a8a]/5 group-hover:text-[#6a5a8a]/10",
    iconBg: "bg-[#6a5a8a]/10",
    iconColor: "text-[#6a5a8a]",
    iconHover: "group-hover:bg-[#6a5a8a] group-hover:text-white",
  },
];

function useCountUp(target: number, duration: number, started: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!started) return;

    let frame = 0;
    const totalFrames = Math.max(1, Math.round(duration / 16));

    const counter = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(target * eased));

      if (progress >= 1) window.clearInterval(counter);
    }, 16);

    return () => window.clearInterval(counter);
  }, [target, duration, started]);

  return value;
}

function StatCard({
  item,
  started,
  index,
}: {
  item: StatItem;
  started: boolean;
  index: number;
}) {
  const value = useCountUp(item.target, 1600, started);
  const Icon = item.icon;

  return (
    <div
      className="home-stat-card group"
      data-aos="zoom-in"
      data-aos-delay={(index % 4) * 70}
    >
      <div
        className={`home-stat-icon ${item.iconBg} ${item.iconColor} ${item.iconHover}`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div
        className={`home-stat-value bg-gradient-to-br ${item.gradient} bg-clip-text text-transparent`}
      >
        +{value.toLocaleString("en-US")}
      </div>

      <p className="home-stat-label">{item.label}</p>

      <Icon className={`home-stat-ghost ${item.ghost}`} />
    </div>
  );
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="home-container home-stats-section">
      <div data-aos="fade-up">
        <HomeSectionHeader
          icon={BarChart3}
          kicker="datos reales"
          title="Resultados que respaldan tu decisión"
          description="Clientes activos, cobertura nacional y pedidos entregados que reflejan movimiento real."
          align="center"
        />
      </div>

      <div className="home-stats-grid">
        {stats.map((item, index) => (
          <StatCard
            key={item.label}
            item={item}
            started={started}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
