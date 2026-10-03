import { Grid3X3, Package, MessageCircle, LayoutGrid } from "lucide-react";
import { getApplicationConfig } from "@/shared/config/application";

const applicationConfig = getApplicationConfig();

interface FloatingButtonsProps {
  cartCount: number;
  onCartClick: () => void;
  onExploreClick?: () => void;
  variant?: "shop" | "home";
  showCart?: boolean;
}

export function FloatingButtons({
  cartCount,
  onCartClick,
  onExploreClick,
  variant = "shop",
  showCart = true,
}: FloatingButtonsProps) {
  const showCatalog = variant === "home";

  const handleExploreClick = () => {
    onExploreClick?.();
  };

  return (
    <div className="floating-buttons">
      {showCart && (
        <button
          type="button"
          onClick={onCartClick}
          className="floating-btn floating-btn-cart"
          aria-label={`Abrir mi caja con ${cartCount} producto${cartCount === 1 ? "" : "s"}`}
        >
          <Package className="floating-btn-icon" />
          <span className="floating-btn-label">Mi Caja</span>

          {cartCount > 0 && (
            <strong className="floating-btn-count">{cartCount}</strong>
          )}
        </button>
      )}

      {onExploreClick && (
        <button
          type="button"
          onClick={handleExploreClick}
          className="floating-btn floating-btn-explore"
          aria-label="Explorar campañas y categorías"
        >
          <Grid3X3 className="floating-btn-icon" />
          <span className="floating-btn-label">Explorar</span>
        </button>
      )}

      {showCatalog && (
        <a
          href={applicationConfig.routes.catalog}
          className="floating-btn floating-btn-catalog"
        >
          <LayoutGrid className="floating-btn-icon" />
          <span className="floating-btn-label">Catálogo</span>
        </a>
      )}

      <a
        href={`https://wa.me/${applicationConfig.contact.whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-btn floating-btn-whatsapp"
        aria-label="Escribir a una asesora"
      >
        <MessageCircle className="floating-btn-icon" />
        <span className="floating-btn-label">Asesora</span>
      </a>
    </div>
  );
}
