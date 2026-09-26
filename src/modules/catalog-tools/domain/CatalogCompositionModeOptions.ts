import type {
  CatalogCompositionMode,
} from "@/modules/catalog/domain/CatalogComposition";

export interface CatalogCompositionModeOption {
  id: CatalogCompositionMode;
  label: string;
  description: string;
  helper: string;
}

export const CATALOG_COMPOSITION_MODE_OPTIONS:
  readonly CatalogCompositionModeOption[] = [
    {
      id: "automatic",
      label: "Por alcance",
      description: "Categorías y campañas",
      helper: "Construye el catálogo completo usando filtros comerciales.",
    },
    {
      id: "hybrid",
      label: "Personalizado",
      description: "Base más ajustes",
      helper: "Parte de un alcance y agrega o retira productos puntuales.",
    },
    {
      id: "manual",
      label: "Desde cero",
      description: "Producto por producto",
      helper: "Crea una selección específica sin una base automática.",
    },
  ];
