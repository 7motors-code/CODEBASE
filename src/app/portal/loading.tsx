/** Shown while portal pages load (both read the database on every visit). */
export default function PortalLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="skeleton-shimmer h-8 w-48 rounded-lg" />
      <div className="skeleton-shimmer h-24 rounded-2xl" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton-shimmer h-72 rounded-2xl" />)}
      </div>
    </div>
  );
}
