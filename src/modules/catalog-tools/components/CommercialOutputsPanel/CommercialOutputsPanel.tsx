import "./CommercialOutputsPanel.css";

interface CommercialOutputsPanelProps {
  productCount: number;
  hasPublicUrl: boolean;
  pdfUrl?: string;
}

const FUTURE_OUTPUTS = [
  "Cotización",
  "Meta Catalog",
  "Google Merchant",
  "Pinterest",
  "Mercado Libre",
] as const;

export default function CommercialOutputsPanel({
  productCount,
  hasPublicUrl,
  pdfUrl = "",
}: CommercialOutputsPanelProps) {
  const canGeneratePdf = productCount > 0 && Boolean(pdfUrl);

  return (
    <section className="commercial-outputs" aria-labelledby="commercial-outputs-title">
      <article className="commercial-outputs__primary">
        <div className="commercial-outputs__pdfIcon" aria-hidden="true">
          PDF
        </div>

        <div className="commercial-outputs__pdfCopy">
          <span>Disponible ahora</span>
          <h3 id="commercial-outputs-title">Catálogo mayorista PDF</h3>
          <p>
            {productCount} productos · formato Wooly · listo para imprimir o guardar.
          </p>
        </div>

        {canGeneratePdf ? (
          <a
            className="commercial-outputs__primaryAction"
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
          >
            Generar PDF
          </a>
        ) : (
          <span className="commercial-outputs__blocked">
            {productCount === 0 ? "Sin productos" : "Requiere publicación"}
          </span>
        )}
      </article>

      <section className="commercial-outputs__future" aria-labelledby="future-outputs-title">
        <header>
          <div>
            <span>Próximas salidas</span>
            <h4 id="future-outputs-title">Canales en preparación</h4>
          </div>
          <small>Se habilitarán sobre la misma composición comercial.</small>
        </header>

        <div className="commercial-outputs__futureList">
          {FUTURE_OUTPUTS.map((output) => (
            <span key={output}>{output}</span>
          ))}
        </div>
      </section>

      {hasPublicUrl ? (
        <p className="commercial-outputs__note">
          El enlace y las opciones para compartir están disponibles en el resumen.
        </p>
      ) : null}
    </section>
  );
}
