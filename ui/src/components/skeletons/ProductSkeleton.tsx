export function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-28 md:pb-40">
      <main className="mx-auto mt-4 max-w-5xl px-4 md:mt-10 md:px-6">
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-10">
          <div className="aspect-square rounded-[28px] border border-[#e2e8f0] bg-white p-2.5 shadow-[0_12px_34px_rgba(15,23,42,.08)] md:p-3">
            <div className="catalog-skeleton h-full w-full rounded-[22px]" />
          </div>

          <div className="card-shop flex flex-col gap-4 bg-white p-4 md:gap-6 md:p-7">
            <div className="space-y-2.5">
              <div className="catalog-skeleton h-7 w-4/5 rounded-xl" />
              <div className="catalog-skeleton h-4 w-full rounded-full" />
              <div className="catalog-skeleton h-4 w-5/6 rounded-full" />
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="catalog-skeleton h-6 w-24 rounded-full" />
              <div className="catalog-skeleton h-6 w-36 rounded-full" />
            </div>

            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="catalog-skeleton h-11 w-[76px] rounded-2xl"
                />
              ))}
            </div>

            <div className="space-y-2">
              <div className="catalog-skeleton h-5 w-24 rounded-full" />
              <div className="flex items-end gap-2">
                <div className="catalog-skeleton h-6 w-8 rounded-md" />
                <div className="catalog-skeleton h-12 w-36 rounded-2xl md:h-16 md:w-40" />
              </div>
              <div className="catalog-skeleton h-4 w-32 rounded-full" />
              <div className="catalog-skeleton h-4 w-48 rounded-full" />
            </div>

            <div className="flex items-center gap-3">
              <div className="catalog-skeleton h-10 w-10 rounded-xl" />
              <div className="catalog-skeleton h-12 w-24 rounded-xl" />
              <div className="catalog-skeleton h-10 w-10 rounded-xl" />
            </div>

            <div className="catalog-skeleton h-13 min-h-[52px] w-full rounded-2xl" />
          </div>
        </div>
      </main>
    </div>
  );
}