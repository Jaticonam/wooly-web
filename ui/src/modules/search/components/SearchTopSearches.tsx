import { TOP_SEARCHES } from "@/constants/searchConfig";

interface SearchTopSearchesProps {
  onSelect: (term: string) => void;
}

export function SearchTopSearches({
  onSelect,
}: SearchTopSearchesProps) {
  return (
    <div className="absolute left-0 right-0 top-full z-[120] mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
        🔥 Más buscados
      </p>

      <div className="flex flex-wrap gap-2">
        {TOP_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onSelect(term)}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
