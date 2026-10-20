import { Store, MapPin } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import {
  buildApplicationWhatsAppUrl,
  getApplicationConfig,
} from "@wooly/shared/config/application";
import HomeSectionHeader from "./HomeSectionHeader";

const applicationConfig = getApplicationConfig();

export default function BrandStorySection() {
  return (
    <section className="home-container brand-story-section">
      <div className="brand-story-grid">
        <div className="brand-story-image-col" data-aos="fade-right">
          <div className="brand-story-image-bg" />

          <img
            src={applicationConfig.assets.brandStoryImageUrl}
            alt="wooly import peru"
            className="brand-story-image"
            loading="lazy"
          />
        </div>

        <div
          className="brand-story-content"
          data-aos="fade-left"
          data-aos-delay="120"
        >
          <HomeSectionHeader
            icon={Store}
            kicker="tu proveedor confiable"
            title="crecemos junto a tu negocio"
            align="left"
          />

          <div className="brand-story-text">
            <p>
              En <strong>Wooly import Perú</strong> abastecemos a mayoristas y
              emprendedores con insumos para regalos que realmente se venden.
            </p>

            <p>
              Trabajamos con flores, globos, cajas, papel coreano, cintas y
              accesorios pensados para crear productos llamativos y rentables.
            </p>

            <p>
              Ofrecemos variedad constante y precios por cajón para mejorar tu
              margen y asegurar stock en tendencia.
            </p>

            <div className="brand-story-location">
              <MapPin className="mt-1 h-5 w-5 text-[#1d8299]" />
              <span>
                Estamos en <strong>tacna</strong> y te ayudamos a elegir lo que
                mejor se vende en tu tienda.
              </span>
            </div>

            <p className="brand-story-strong">
              Si buscas crecer con productos que sí rotan, wooly es tu mejor
              aliado.
            </p>
          </div>

          <a
            href={buildApplicationWhatsAppUrl(
              "Hola, quiero información sobre Wooly Import",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-story-cta"
            data-aos="fade-up"
            data-aos-delay="220"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Escríbenos ahora
          </a>
        </div>
      </div>
    </section>
  );
}
