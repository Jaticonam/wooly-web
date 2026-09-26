import "./CatalogWorkflowHeader.css";

export type CatalogWorkflowStage =
  | "select"
  | "review";

interface CatalogWorkflowHeaderProps {
  stage: CatalogWorkflowStage;
  isGenerateOpen: boolean;
  canGenerate: boolean;
  showCatalogSync: boolean;
  onStageChange: (stage: CatalogWorkflowStage) => void;
  onOpenGenerate: () => void;
  onOpenDrafts: () => void;
  onOpenCatalogSync: () => void;
  onReset: () => void;
}

export default function CatalogWorkflowHeader({
  stage,
  isGenerateOpen,
  canGenerate,
  showCatalogSync,
  onStageChange,
  onOpenGenerate,
  onOpenDrafts,
  onOpenCatalogSync,
  onReset,
}: CatalogWorkflowHeaderProps) {
  return (
    <header className="catalog-workflow-header">
      <div className="catalog-workflow-header__identity">
        <span>Catálogos 2.0</span>
        <div>
          <h1>Creador de catálogos</h1>
          <p>Selecciona, revisa y genera una salida comercial lista para compartir.</p>
        </div>
      </div>

      <nav className="catalog-workflow-header__steps" aria-label="Flujo del catálogo">
        <button
          type="button"
          className={stage === "select" ? "is-active" : ""}
          aria-current={stage === "select" ? "step" : undefined}
          onClick={() => onStageChange("select")}
        >
          <span>1</span>
          <strong>Seleccionar</strong>
          <small>Alcance y productos</small>
        </button>

        <button
          type="button"
          className={stage === "review" && !isGenerateOpen ? "is-active" : ""}
          aria-current={stage === "review" && !isGenerateOpen ? "step" : undefined}
          onClick={() => onStageChange("review")}
        >
          <span>2</span>
          <strong>Revisar</strong>
          <small>Composición final</small>
        </button>

        <button
          type="button"
          className={isGenerateOpen ? "is-active" : ""}
          aria-current={isGenerateOpen ? "step" : undefined}
          disabled={!canGenerate}
          onClick={onOpenGenerate}
        >
          <span>3</span>
          <strong>Generar</strong>
          <small>PDF y compartir</small>
        </button>
      </nav>

      <div className="catalog-workflow-header__actions">
        <button type="button" onClick={onOpenDrafts}>
          Mis catálogos
        </button>

        {showCatalogSync ? (
          <button type="button" onClick={onOpenCatalogSync}>
            Google Sheets
          </button>
        ) : null}

        <button type="button" className="is-reset" onClick={onReset}>
          Nuevo catálogo
        </button>
      </div>
    </header>
  );
}
