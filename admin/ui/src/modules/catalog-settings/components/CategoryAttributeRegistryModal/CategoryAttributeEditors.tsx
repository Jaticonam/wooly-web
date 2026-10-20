import { useState, type FormEvent } from "react";
import type {
  AdminCategoryAttributeDefinition,
  UpdateAdminCategoryAttributeInput,
} from "@/modules/admin-auth/services/AdminAuthClient";
export function DefinitionEditor({
  value,
  busy,
  onSave,
}: {
  value: AdminCategoryAttributeDefinition;
  busy: boolean;
  onSave: (input: UpdateAdminCategoryAttributeInput) => Promise<void>;
}) {
  const [required, setRequired] = useState(value.required);
  const [multiple, setMultiple] = useState(value.multiple);
  const [available, setAvailable] = useState(value.status === "ACTIVE");
  const [availabilityChanged, setAvailabilityChanged] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const input: UpdateAdminCategoryAttributeInput = { required, multiple };
    if (availabilityChanged) input.status = available ? "ACTIVE" : "INACTIVE";
    setError("");
    try {
      await onSave(input);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar la configuración.");
    }
  };
  return (
    <form
      onSubmit={submit}
      className="attribute-registry__form"
      aria-label="Configuración del atributo"
    >
      <h3>Configuración en esta categoría</h3>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={busy} className="attribute-registry__grid">
        {value.status === "ARCHIVED" && (
          <p>Archivado. Puedes volver a habilitarlo para productos.</p>
        )}
        <label className="attribute-registry__check">
          <input
            type="checkbox"
            checked={available}
            onChange={(event) => {
              setAvailable(event.target.checked);
              setAvailabilityChanged(true);
            }}
          />
          Disponible para productos
        </label>
        <label className="attribute-registry__check">
          <input
            type="checkbox"
            checked={required}
            onChange={(event) => setRequired(event.target.checked)}
          />
          Este dato es obligatorio
        </label>
        <label className="attribute-registry__check">
          <input
            type="checkbox"
            checked={multiple}
            onChange={(event) => setMultiple(event.target.checked)}
          />
          Puede tener varios valores
        </label>
      </fieldset>
      <footer className="attribute-registry__actions">
        <button type="submit" disabled={busy}>
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </footer>
    </form>
  );
}
export function DefinitionInspection({ value }: { value: AdminCategoryAttributeDefinition }) {
  return (
    <section>
      <h3>Configuración en esta categoría</h3>
      <ul>
        <li>
          {value.status === "ACTIVE" ? "Disponible para productos" : "No disponible para productos"}
        </li>
        <li>{value.required ? "Este dato es obligatorio" : "Este dato es opcional"}</li>
        <li>{value.multiple ? "Puede tener varios valores" : "Un solo valor"}</li>
      </ul>
    </section>
  );
}
