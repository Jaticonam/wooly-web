import { Link } from "react-router-dom";

export default function BlogHubCatalogBanner() {
  return (
    <div className="blog-banner">
      <div>
        <h3>🚀 ¿Listo para abastecerte?</h3>
        <p>Más de 1000 productos para emprendedores.</p>
      </div>

      <Link to="/catalogo" className="blog-banner-btn">
        Ver catálogo
      </Link>
    </div>
  );
}
