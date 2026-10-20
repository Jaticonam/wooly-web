import { LucideIcon } from "lucide-react";

type HomeSectionHeaderProps = {
  kicker: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  align?: "left" | "center";
};

export default function HomeSectionHeader({
  kicker,
  title,
  description,
  icon: Icon,
  align = "center",
}: HomeSectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div
      className={`relative z-10 mb-12 ${
        isCenter ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left"
      }`}
    >
      <div
        className={`mb-3 flex items-center gap-2 ${
          isCenter ? "justify-center" : "justify-start"
        }`}
      >
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1d8299]/10 text-[#1d8299] shadow-sm">
            <Icon className="h-4 w-4" />
          </span>
        )}

        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d8299] md:text-xs">
          {kicker}
        </span>
      </div>

      <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-slate-950 md:text-4xl">
        {title}
      </h2>

      <div
        className={`mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-[#1d8299] to-[#f286be] ${
          isCenter ? "mx-auto" : ""
        }`}
      />

      {description && (
        <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 md:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
