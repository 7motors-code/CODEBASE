'use client';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">
          The action could not be completed. If you were uploading files, check that each one is a photo, PDF or video under 8 MB, then try again.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted">Ref: {error.digest}</p>}
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" className="btn-gold" onClick={() => reset()}>Try again</button>
          <Link href="/admin" className="btn-ghost">Go to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
