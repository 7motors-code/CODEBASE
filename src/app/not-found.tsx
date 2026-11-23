import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-xl font-medium">Page not found</h1>
        <p className="mt-2 text-sm text-muted">This page or record does not exist, or it was removed.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/admin" className="btn-primary">Dashboard</Link>
          <Link href="/portal" className="btn-ghost">Customer portal</Link>
        </div>
      </div>
    </div>
  );
}
