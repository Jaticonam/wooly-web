import type {
  CatalogCompositionMode,
} from "@/modules/catalog/domain/CatalogComposition";
import {
  CATALOG_COMPOSITION_MODE_OPTIONS,
} from "@/modules/catalog-tools/domain/CatalogCompositionModeOptions";

import "./CatalogCompositionModePicker.css";

interface CatalogCompositionModePickerProps {
  value: CatalogCompositionMode;
  onChange: (mode: CatalogCompositionMode) => void;
}

export default function CatalogCompositionModePicker({
  value,
  onChange,
}: CatalogCompositionModePickerProps) {
  return (
    <section className="catalog-mode-picker" aria-labelledby="catalog-mode-picker-title">
      <header>
        <div>
          <span>Tipo de catálogo</span>
          <h2 id="catalog-mode-picker-title">¿Cómo quieres seleccionar los productos?</h2>
        </div>
        <small>El modo puede cambiarse sin perder el borrador actual.</small>
      </header>

      <div className="catalog-mode-picker__options" role="group" aria-label="Tipo de composición">
        {CATALOG_COMPOSITION_MODE_OPTIONS.map((mode) => (
          <button
            type="button"
            key={mode.id}
            className={value === mode.id ? "is-active" : ""}
            aria-pressed={value === mode.id}
            onClick={() => onChange(mode.id)}
          >
            <span aria-hidden="true">
              {mode.id === "automatic" ? "▦" : mode.id === "hybrid" ? "◩" : "✓"}
            </span>
            <div>
              <strong>{mode.label}</strong>
              <small>{mode.description}</small>
              <p>{mode.helper}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
