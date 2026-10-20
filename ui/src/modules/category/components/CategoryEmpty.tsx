import { SearchX } from "lucide-react";

interface CategoryEmptyProps {
  hasSearch: boolean;
  onClearSearch: () => void;
}

export function CategoryEmpty({
  hasSearch,
  onClearSearch,
}: CategoryEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <div className="bg-muted p-6 rounded-full mb-4">
        <SearchX className="w-10 h-10 opacity-30" />
      </div>

      <p className="font-black text-sm tracking-widest text-center">
        {hasSearch
          ? "No encontramos resultados en esta categoría"
          : "Sin productos en esta categoría"}
      </p>

      {hasSearch && (
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-4 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-muted/80 transition-colors"
        >
          Limpiar búsqueda
        </button>
      )}
    </div>
  );
}
