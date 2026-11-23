/** Shown inside the admin shell while a page's server data loads, so the sidebar and header never disappear. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading</span>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2.5">
          <div className="skeleton-shimmer h-7 w-48 rounded-md" />
          <div className="skeleton-shimmer h-4 w-72 rounded-md" />
        </div>
        <div className="skeleton-shimmer h-10 w-32 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3 px-5 py-4">
            <div className="skeleton-shimmer h-3.5 w-28 rounded" />
            <div className="skeleton-shimmer h-7 w-20 rounded" />
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="border-b border-line p-4"><div className="skeleton-shimmer h-10 w-full max-w-sm rounded-lg" /></div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line/70 px-4 py-3.5 last:border-b-0">
            <div className="skeleton-shimmer h-8 w-8 shrink-0 rounded-full" />
            <div className="skeleton-shimmer h-4 flex-1 rounded" />
            <div className="skeleton-shimmer hidden h-4 w-24 rounded sm:block" />
            <div className="skeleton-shimmer h-6 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
