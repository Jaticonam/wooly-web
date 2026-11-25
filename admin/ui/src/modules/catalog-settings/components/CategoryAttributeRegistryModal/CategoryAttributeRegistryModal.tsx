import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Layers3, Plus, RefreshCw, Settings2 } from "lucide-react";
import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";
import {
  loadAdminCategoryAttributes,
  createAdminCategoryAttribute,
  updateAdminCategoryAttribute,
  type AdminCategoryAttributeDefinition,
} from "@/modules/admin-auth/services/AdminAuthClient";
import { DefinitionEditor, DefinitionInspection } from "./CategoryAttributeEditors";
import CreateAttributeForm from "./CreateAttributeForm";
import { ordered, statusLabels, typeLabels, usageLabel } from "./CategoryAttributeFormData";
import "./CategoryAttributeRegistryModal.css";
type View = { kind: "list" } | { kind: "create" } | { kind: "detail"; id: string };
export default function CategoryAttributeRegistryModal({
  brandId,
  category,
  canWrite,
  onClose,
}: {
  brandId: string;
  category: { id: string; name: string };
  canWrite: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<AdminCategoryAttributeDefinition[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [view, setView] = useState<View>({ kind: "list" }),
    [adding, setAdding] = useState(false),
    [revision, setRevision] = useState(0);
  const pending = useRef(false),
    mounted = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await loadAdminCategoryAttributes(brandId, category.id);
      if (mounted.current) {
        setRows(ordered(result.data));
        setRevision((n) => n + 1);
      }
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "No se pudieron cargar los atributos.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [brandId, category.id]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);
  const close = () => {
    if (!pending.current) onClose();
  };
  const back = () => {
    if (!pending.current) {
      setView({ kind: "list" });
      setAdding(false);
    }
  };
  const mutate = async (operation: () => Promise<unknown>) => {
    if (pending.current || !canWrite) return;
    pending.current = true;
    setBusy(true);
    try {
      await operation();
      setAdding(false);
      await load();
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const detail = view.kind === "detail" ? rows.find((row) => row.id === view.id) : undefined;
  return (
    <AdminModal
      open
      title={"Atributos · " + category.name}
      description="Características disponibles para los productos de esta categoría"
      onClose={close}
      size="large"
    >
      <div className="attribute-registry" aria-busy={loading || busy}>
        <div className="attribute-registry__context">
          <div className="attribute-registry__contextIcon" aria-hidden="true"><Layers3 size={20} /></div>
          <div className="attribute-registry__contextCopy">
            <span className="attribute-registry__eyebrow">CATÁLOGOS / CATEGORÍAS / ATRIBUTOS</span>
            <strong>{category.name}</strong>
            <p>Organiza las características disponibles para los productos de esta categoría.</p>
          </div>
          <span className="attribute-registry__access">
            {canWrite ? "Configuración habilitada" : "Solo lectura"}
          </span>
        </div>
        {view.kind !== "list" && (
          <button className="attribute-registry__back" type="button" disabled={busy} onClick={back}>
            <ArrowLeft size={14} aria-hidden="true" /> Volver a atributos
          </button>
        )}
        {loading ? (
          <p role="status">Cargando atributos…</p>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void load()}>
              <RefreshCw size={14} aria-hidden="true" /> Reintentar
            </button>
          </div>
        ) : view.kind === "create" && canWrite ? (
          <CreateAttributeForm
            busy={busy}
            onSave={async (input) => {
              await mutate(() => createAdminCategoryAttribute(brandId, category.id, input));
              setView({ kind: "list" });
            }}
          />
        ) : detail ? (
          <>
            <header className="attribute-registry__detailHeading attribute-registry__workspace">
              <dl>
                <dt>Nombre</dt>
                <dd>{detail.label}</dd>
                <dt>Tipo</dt>
                <dd>{typeLabels[detail.type]}</dd>
                <dt>Uso</dt>
                <dd>{usageLabel(detail.role)}</dd>
              </dl>
              <p className="attribute-registry__detailStatus">
                <span className={`attribute-registry__status is-${detail.status.toLowerCase()}`}>
                  {statusLabels[detail.status]}
                </span>
              </p>
            </header>
            {canWrite ? (
              <DefinitionEditor
                key={detail.id + revision}
                value={detail}
                busy={busy}
                onSave={(input) =>
                  mutate(() => updateAdminCategoryAttribute(brandId, category.id, detail.id, input))
                }
              />
            ) : (
              <DefinitionInspection value={detail} />
            )}
            <section className="attribute-registry__optionSection attribute-registry__workspace">
              <header className="attribute-registry__toolbar">
                <h3>Valores disponibles ({detail.options.length})</h3>
                {canWrite && !adding && (
                  <button type="button" disabled={busy} onClick={() => setAdding(true)}>
                    <Plus size={14} aria-hidden="true" /> Seleccionar valores
                  </button>
                )}
              </header>
              {!detail.options.length ? (
                <p className="attribute-registry__empty">Sin valores disponibles</p>
              ) : (
                <ul className="attribute-registry__options">
                  {ordered(detail.options).map((option) => (
                    <li key={option.id}>{option.label}</li>
                  ))}
                </ul>
              )}
              {canWrite && adding && (
                <section>
                  <h4>Seleccionar valores</h4>
                  <p>
                    Los valores estandarizados se seleccionarán desde Valores maestros de JUNG CORE.
                  </p>
                  <p>Próximamente por JUNG CORE</p>
                  <button type="button" onClick={() => setAdding(false)}>
                    Volver al detalle
                  </button>
                </section>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="attribute-registry__summary" aria-label="Resumen de atributos">
              <div><span>Registrados</span><strong>{rows.length}</strong></div>
              <div><span>Disponibles</span><strong>{rows.filter((row) => row.status === "ACTIVE").length}</strong></div>
              <div><span>Obligatorios</span><strong>{rows.filter((row) => row.required && row.status === "ACTIVE").length}</strong></div>
            </div>
            <header className="attribute-registry__toolbar attribute-registry__listToolbar">
              <div className="attribute-registry__toolbarCopy">
                <strong>Atributos ({rows.length})</strong>
                <p>Consulta las definiciones y configura su disponibilidad por categoría.</p>
              </div>
              {canWrite && (
                <button type="button" disabled={busy} onClick={() => setView({ kind: "create" })}>
                  <Plus size={14} aria-hidden="true" /> Agregar atributo
                </button>
              )}
            </header>
            {!rows.length && (
              <p className="attribute-registry__empty">
                Esta categoría todavía no tiene atributos.
              </p>
            )}
            {rows.map((definition) => (
              <article className="attribute-registry__definition" key={definition.id}>
                <header>
                  <div>
                    <h3>{definition.label}</h3>
                    <span>
                      {typeLabels[definition.type]} · {usageLabel(definition.role)}
                    </span>
                  </div>
                  <div className="attribute-registry__definitionActions">
                    <span className={`attribute-registry__status is-${definition.status.toLowerCase()}`}>
                      {statusLabels[definition.status]}
                    </span>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={"Configurar " + definition.label}
                    onClick={() => {
                      setView({ kind: "detail", id: definition.id });
                      setAdding(false);
                    }}
                  >
                    <Settings2 size={14} aria-hidden="true" /> Configurar
                  </button>
                  </div>
                </header>
                <p className="attribute-registry__preview">
                  {definition.options.length} opciones
                  {definition.options.length
                    ? " · " +
                      ordered(definition.options)
                        .slice(0, 3)
                        .map((option) => option.label)
                        .join(", ") +
                      (definition.options.length > 3 ? "…" : "")
                    : ""}
                </p>
              </article>
            ))}
          </>
        )}
      </div>
    </AdminModal>
  );
}
