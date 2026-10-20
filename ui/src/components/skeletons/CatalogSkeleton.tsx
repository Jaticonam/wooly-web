export function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-1 px-2 md:grid-cols-3 md:gap-2 md:px-0 xl:grid-cols-5 xl:gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[22px] border border-[#e2e8f0] bg-white p-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.06)] md:p-3"
        >
          <div className="relative mb-3">
            <div className="catalog-skeleton aspect-square rounded-[18px]" />
            <div className="catalog-skeleton absolute left-2 top-2 h-4 w-20 rounded-full" />
            <div className="catalog-skeleton absolute bottom-2 right-2 h-4 w-14 rounded-full" />
          </div>

          <div className="mx-auto mb-2 flex justify-center gap-1.5">
            <div className="catalog-skeleton h-3 w-12 rounded-full" />
            <div className="catalog-skeleton h-3 w-14 rounded-full" />
          </div>

          <div className="catalog-skeleton mx-auto mb-1.5 h-3.5 w-[88%] rounded" />
          <div className="catalog-skeleton mx-auto mb-3 h-3 w-[65%] rounded" />

          <div className="mb-2 flex flex-col items-center gap-1">
            <div className="catalog-skeleton h-3 w-12 rounded" />
            <div className="catalog-skeleton h-6 w-20 rounded" />
          </div>

          <div className="catalog-skeleton mb-2 h-3 w-[70%] rounded mx-auto" />
          <div className="catalog-skeleton h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}