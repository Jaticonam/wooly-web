import { Quote, ShoppingCart } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";

export default function FinalCTASection() {
  return (
    <section className="final-cta-section">
      <div className="home-container final-cta-inner">
        <Quote className="final-cta-icon" />

        <blockquote className="final-cta-quote">
          La que compra por mayor, vende más...
          <span className="final-cta-highlight">
            pero la que compra por caja, factura más.
          </span>
        </blockquote>

        <div className="final-cta-actions">
          <a
            href={buildApplicationWhatsAppUrl(
              "Hola, quiero comprar por mayor",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="final-cta-whatsapp"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Comprar por mayor
          </a>

          <a href="/catalogo" className="final-cta-catalog">
            <ShoppingCart className="h-5 w-5" />
            Ver catálogo
          </a>
        </div>

        <p className="final-cta-note">
          Compra rápida por whatsapp o arma tu pedido desde el catálogo
        </p>
      </div>
    </section>
  );
}
import { buildApplicationWhatsAppUrl } from "@wooly/shared/config/application";
