import { useRef, useState, type FormEvent } from "react";
import type { AdminAttributeType, CreateAdminCategoryAttributeInput } from "@/modules/admin-auth/services/AdminAuthClient";
import { createDefinitionCommand, definitionDraft, type DefinitionDraft, typeLabels } from "./CategoryAttributeFormData";

export default function CreateAttributeForm({
  busy,
  onSave,
}: {
  busy: boolean;
  onSave: (input: CreateAdminCategoryAttributeInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState<DefinitionDraft>(() => definitionDraft());
  const [error, setError] = useState("");
  const sending = useRef(false);
  const update = <K extends keyof DefinitionDraft>(field: K, value: DefinitionDraft[K]) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setError("");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || sending.current) return;
    setError("");
    let input: CreateAdminCategoryAttributeInput;
    try {
      input = createDefinitionCommand(draft);
      sending.current = true;
      await onSave(input);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudo crear el atributo.");
    } finally {
      sending.current = false;
    }
  };
  return (
    <form className="attribute-registry__form attribute-registry__workspace attribute-registry__createForm"
      aria-label="Crear atributo" onSubmit={(event) => void submit(event)}>
      <div className="attribute-registry__formIntro">
        <span className="attribute-registry__eyebrow">NUEVA DEFINICIÓN</span>
        <h3>Agregar atributo</h3>
        <p>Define una característica para los productos de esta categoría. Su código técnico lo asignará JUNG CORE.</p>
      </div>
      {error && <p role="alert">{error}</p>}
      <fieldset className="attribute-registry__grid" disabled={busy}>
        <label className="attribute-registry__full">
          Nombre del atributo
          <input required maxLength={160} autoFocus value={draft.label}
            placeholder="Ej. Material, Color, Tamaño"
            onChange={(event) => update("label", event.target.value)} />
        </label>
        <label>
          Tipo de dato
          <select value={draft.type} onChange={(event) => {
            const type = event.target.value as AdminAttributeType;
            setDraft((previous) => ({
              ...previous,
              type,
              role: previous.role === "SIZE" && type !== "SELECT" && type !== "MEASUREMENT"
                ? "ATTRIBUTE" : previous.role,
            }));
            setError("");
          }}>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Uso comercial
          <select value={draft.role} onChange={(event) => update("role", event.target.value as DefinitionDraft["role"])}>
            <option value="ATTRIBUTE">Característica del producto</option>
            {(draft.type === "SELECT" || draft.type === "MEASUREMENT") &&
              <option value="SIZE">Tamaño del producto</option>}
          </select>
        </label>
        {draft.type === "MEASUREMENT" && (
          <>
            <label>
              Unidades permitidas
              <input required value={draft.units} placeholder="Ej. cm, m"
                onChange={(event) => update("units", event.target.value)} />
            </label>
            <label>
              Unidad principal
              <input required value={draft.defaultUnit} placeholder="Ej. cm"
                onChange={(event) => update("defaultUnit", event.target.value)} />
            </label>
          </>
        )}
        <label className="attribute-registry__check">
          <input type="checkbox" checked={draft.required}
            onChange={(event) => update("required", event.target.checked)} />
          Este dato es obligatorio
        </label>
        <label className="attribute-registry__check">
          <input type="checkbox" checked={draft.multiple}
            onChange={(event) => update("multiple", event.target.checked)} />
          Puede tener varios valores
        </label>
        <label className="attribute-registry__check">
          <input type="checkbox" checked={draft.allowCustomValue}
            onChange={(event) => update("allowCustomValue", event.target.checked)} />
          Permitir un valor distinto a las opciones registradas
        </label>
      </fieldset>
      <div className="attribute-registry__createNote">
        Esta operación creará una definición real en JUNG CORE para la categoría seleccionada.
        Las opciones del atributo se administrarán en una fase posterior.
      </div>
      <footer className="attribute-registry__actions">
        <button type="submit" disabled={busy}>{busy ? "Guardando…" : "Crear atributo"}</button>
      </footer>
    </form>
  );
}
