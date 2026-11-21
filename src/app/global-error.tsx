'use client';

/** Last-resort error screen (used when the root layout itself fails) */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#0b1220', color: '#e5e7eb', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 22 }}>Seven Motors is having a problem</h1>
          <p style={{ opacity: 0.7 }}>Please try again in a moment.{error.digest ? ` (Ref: ${error.digest})` : ''}</p>
          <button onClick={() => reset()} style={{ marginTop: 16, padding: '10px 18px', borderRadius: 12, border: 0, background: '#d4a537', fontWeight: 700, cursor: 'pointer' }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
