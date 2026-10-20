import HomeSectionHeader from "./HomeSectionHeader";
import { Sparkles } from "lucide-react";

import {
  TikTokIcon,
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  PinterestIcon,
  XIcon,
  GoogleIcon,
} from "@/components/ui/SocialIcons";

const socials = [
  {
    label: "video",
    title: "TikTok",
    description: "Contenido divertido",
    icon: TikTokIcon,
    link: "https://www.tiktok.com/@woolyimports",
    normalIcon: "bg-[#f7b1d6]/20 text-[#f286be] border-[#f7b1d6]/40",
    hover:
      "group-hover:bg-black group-hover:text-white group-hover:border-black",
    text: "group-hover:text-black",
  },
  {
    label: "comunidad",
    title: "Facebook",
    description: "Promos y Novedades",
    icon: FacebookIcon,
    link: "https://www.facebook.com/WoolyImports/",
    normalIcon: "bg-[#1d8299]/10 text-[#1d8299] border-[#1d8299]/20",
    hover:
      "group-hover:bg-[#1877f2] group-hover:text-white group-hover:border-[#1877f2]",
    text: "group-hover:text-[#1877f2]",
  },
  {
    label: "visual",
    title: "Instagram",
    description: "Ideas y Campañas",
    icon: InstagramIcon,
    link: "https://www.instagram.com/woolyimports/",
    normalIcon: "bg-[#f7b1d6]/20 text-[#f286be] border-[#f7b1d6]/40",
    hover:
      "group-hover:bg-[#e4405f] group-hover:text-white group-hover:border-[#e4405f]",
    text: "group-hover:text-[#e4405f]",
  },
  {
    label: "ideas",
    title: "Pinterest",
    description: "Inspiración",
    icon: PinterestIcon,
    link: "https://www.pinterest.com/woolyimports/",
    normalIcon: "bg-[#f5b025]/10 text-[#f5b025] border-[#f5b025]/30",
    hover:
      "group-hover:bg-[#bd081c] group-hover:text-white group-hover:border-[#bd081c]",
    text: "group-hover:text-[#bd081c]",
  },
  {
    label: "noticias",
    title: "X",
    description: "Actualizaciones",
    icon: XIcon,
    link: "https://x.com/woolyimports",
    normalIcon: "bg-[#1d8299]/10 text-[#1d8299] border-[#1d8299]/20",
    hover:
      "group-hover:bg-black group-hover:text-white group-hover:border-black",
    text: "group-hover:text-black",
  },
  {
    label: "video",
    title: "YouTube",
    description: "Demostraciones",
    icon: YoutubeIcon,
    link: "https://www.youtube.com/@WoolyImports",
    normalIcon: "bg-[#f7b1d6]/20 text-[#f286be] border-[#f7b1d6]/40",
    hover:
      "group-hover:bg-[#ff0000] group-hover:text-white group-hover:border-[#ff0000]",
    text: "group-hover:text-[#ff0000]",
  },
  {
    label: "reseñas",
    title: "Google",
    description: "Opiniones reales",
    icon: GoogleIcon,
    link: "https://www.google.com/search?q=Wooly+import+Per%C3%BA",
    normalIcon: "bg-[#1d8299]/10 text-[#1d8299] border-[#1d8299]/20",
    hover:
      "group-hover:bg-[#4285f4] group-hover:text-white group-hover:border-[#4285f4]",
    text: "group-hover:text-[#4285f4]",
  },
];

export default function SocialSection() {
  return (
    <section className="home-container social-section">
      <div data-aos="fade-up">
        <HomeSectionHeader
          icon={Sparkles}
          kicker="Conecta con wooly"
          title="Síguenos y mantente actualizado"
          description="Contenido, tendencias y oportunidades en nuestras plataformas."
          align="center"
        />
      </div>

      <div className="social-grid">
        {socials.map((item, index) => {
          const Icon = item.icon;

          return (
            <a
              key={item.title}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.title}
              className="social-card group"
              data-aos="fade-up"
              data-aos-delay={(index % 4) * 60}
            >
              <div className={`social-icon ${item.normalIcon} ${item.hover}`}>
                <Icon className="h-6 w-6" />
              </div>

              <h3 className={`social-title ${item.text}`}>{item.title}</h3>
              <p className="social-description">{item.description}</p>
              <span className="social-label">{item.label}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
