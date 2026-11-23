'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

/** Keeps the admin shell on screen when one page fails, and offers a retry. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-lg font-medium text-ink">This page could not load</h1>
        <p className="mt-2 text-sm text-ink2">
          The connection to the database may have dropped. Try again; if you were uploading files, each one must be a photo, PDF or video under 8 MB.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted">Ref {error.digest}</p>}
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" className="btn-primary" onClick={() => reset()}><RotateCcw size={16} strokeWidth={1.75} />Try again</button>
          <Link href="/admin" className="btn-ghost">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
