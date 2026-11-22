import dns from 'node:dns';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore in environments where setDefaultResultOrder is not supported
}

// Neon adds channel_binding=require; node-postgres does not need it, so it is removed here.
const url = (process.env.DATABASE_URL ?? '').replace(/([?&])channel_binding=[^&]*&?/, '$1').replace(/[?&]$/, '');
if (!url && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('[db] FATAL: DATABASE_URL environment variable is required in production.');
}
const local = /localhost|127\.0\.0\.1/.test(url);
const g = globalThis as unknown as { _pool?: Pool };
let pool = g._pool;
if (!pool) {
  const allowInsecureSsl = process.env.NODE_ENV !== 'production' && process.env.DATABASE_SSL_NO_VERIFY === '1';
  pool = new Pool({
    connectionString: url,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
    // Certificates are verified (Neon uses public CAs). In production, SSL verification is always enforced.
    ssl: local ? undefined : { rejectUnauthorized: !allowInsecureSsl },
  });
  pool.on('error', (e) => console.error('[db] idle client error', e));
  g._pool = pool;
}

export const db = drizzle(pool, { schema });
export { schema, pool };

export async function closePool() {
  if (pool) {
    try {
      await pool.end();
    } catch {}
    g._pool = undefined;
  }
}
