import { Link } from "react-router-dom";

import {
  buildApplicationWhatsAppUrl,
  getApplicationConfig,
} from "@wooly/shared/config/application";

const applicationConfig = getApplicationConfig();

export default function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-glow" />

      <div className="home-footer-inner">
        <Link to="/" className="home-footer-logo-link">
          <img
            src={applicationConfig.assets.logoUrl}
            alt="wooly import peru"
            className="home-footer-logo"
          />
        </Link>

        <p className="home-footer-description">
          Tu proveedor confiable en tacna. abastecemos insumos mayoristas
          para que tu negocio crezca con productos que sí se venden.
        </p>

        <div className="home-footer-nav">
          <Link to="/catalogo" className="home-footer-link">
            Catálogo
          </Link>

          <a
            href="https://packs.woolyimports.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-footer-link"
          >
            Packs
          </a>

          <a href="#shipping" className="home-footer-link">
            Envíos
          </a>

          <a
            href={buildApplicationWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="home-footer-link"
          >
            Contactos
          </a>
        </div>

        <div className="home-footer-bottom">
          <p>© 2026 wooly import peru. todos los derechos reservados.</p>

          <div className="home-footer-legal">
            <a href="#">
              privacidad
            </a>

            <a href="#">
              términos mayoristas
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
