import "./CommercialOutputsPanel.css";

type OutputReadiness =
  | "ready"
  | "prepared"
  | "pending"
  | "blocked";

interface OutputItem {
  label: string;
  detail: string;
  status: OutputReadiness;
  statusLabel: string;
}

interface OutputGroup {
  title: string;
  items: readonly OutputItem[];
}

interface CommercialOutputsPanelProps {
  productCount: number;
  hasPublicUrl: boolean;
  pdfUrl?: string;
}

export default function CommercialOutputsPanel({
  productCount,
  hasPublicUrl,
  pdfUrl = "",
}: CommercialOutputsPanelProps) {
  const shareStatus: OutputReadiness =
    hasPublicUrl
      ? "ready"
      : productCount > 0
        ? "prepared"
        : "blocked";

  const shareLabel =
    hasPublicUrl
      ? "Listo"
      : productCount > 0
        ? "Preparado"
        : "Bloqueado";

  const groups: readonly OutputGroup[] = [
    {
      title: "Documentos",
      items: [
        {
          label: "PDF catálogo",
          detail: hasPublicUrl
            ? "Salida pública disponible"
            : "Requiere publicación de la composición",
          status: hasPublicUrl ? "ready" : shareStatus,
          statusLabel: hasPublicUrl ? "Listo" : shareLabel,
        },
        {
          label: "Cotización",
          detail: "Contrato definido; renderer pendiente",
          status: "pending",
          statusLabel: "Próximo",
        },
        {
          label: "Lista de precios",
          detail: "Contrato definido; template pendiente",
          status: "pending",
          statusLabel: "Próximo",
        },
      ],
    },
    {
      title: "Marketplaces",
      items: [
        {
          label: "Meta",
          detail: "Feed general operativo; adapter por composición pendiente",
          status: "prepared",
          statusLabel: "Base lista",
        },
        {
          label: "Google Merchant",
          detail: "Perfil y adapter pendientes",
          status: "pending",
          statusLabel: "Pendiente",
        },
        {
          label: "Pinterest",
          detail: "Perfil y adapter pendientes",
          status: "pending",
          statusLabel: "Pendiente",
        },
        {
          label: "Mercado Libre",
          detail: "Mapeo dinámico por categoría pendiente",
          status: "pending",
          statusLabel: "Pendiente",
        },
      ],
    },
    {
      title: "Compartir",
      items: [
        {
          label: "WhatsApp",
          detail: hasPublicUrl
            ? "Mensaje y enlace disponibles"
            : "Esperando enlace público",
          status: shareStatus,
          statusLabel: shareLabel,
        },
        {
          label: "Copiar enlace",
          detail: hasPublicUrl
            ? "URL pública disponible"
            : "Esperando enlace público",
          status: shareStatus,
          statusLabel: shareLabel,
        },
      ],
    },
  ];

  return (
    <section
      className="commercial-outputs"
      aria-labelledby="commercial-outputs-title"
    >
      <header className="commercial-outputs__header">
        <div>
          <span>Commercial Publishing</span>
          <h3 id="commercial-outputs-title">Outputs</h3>
          <p>
            Una composición, múltiples salidas controladas.
          </p>
        </div>

        <div className="commercial-outputs__contract">
          <strong>{productCount}</strong>
          <span>productos</span>
          <small>commercial-composition.v1</small>
        </div>
      </header>

      <div className="commercial-outputs__groups">
        {groups.map((group) => (
          <section
            className="commercial-outputs__group"
            key={group.title}
          >
            <h4>{group.title}</h4>

            <div className="commercial-outputs__items">
              {group.items.map((item) => (
                <article
                  className="commercial-outputs__item"
                  key={item.label}
                >
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </div>

                  <span
                    className={`commercial-outputs__badge is-${item.status}`}
                  >
                    {item.statusLabel}
                  </span>

                  {item.label === "PDF catálogo" && pdfUrl ? (
                    <a
                      className="commercial-outputs__action"
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Generar
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
