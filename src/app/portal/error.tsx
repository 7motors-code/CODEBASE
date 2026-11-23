'use client';
import { startTransition } from 'react';
import { useRouter } from 'next/navigation';

/** Keeps the portal header on screen when a page fails, with a retry that refetches. */
export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const retry = () => startTransition(() => { router.refresh(); reset(); });
  return (
    <div role="alert" className="card mx-auto max-w-md p-6 text-center">
      <h1 className="text-lg font-medium text-ink">This page could not load</h1>
      <p className="mt-2 text-sm text-ink2">The connection may have dropped. Please try again, or call the office.</p>
      <button type="button" onClick={retry} className="btn-primary mt-5">Try again</button>
    </div>
  );
}
