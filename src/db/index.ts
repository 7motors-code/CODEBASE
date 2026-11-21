import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Neon adds channel_binding=require; node-postgres does not need it, so it is removed here.
const url = (process.env.DATABASE_URL ?? '').replace(/([?&])channel_binding=[^&]*&?/, '$1').replace(/[?&]$/, '');
if (!url && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  console.error('[db] DATABASE_URL is not set.');
}
const local = /localhost|127\.0\.0\.1/.test(url);
const g = globalThis as unknown as { _pool?: Pool };
let pool = g._pool;
if (!pool) {
  pool = new Pool({
    connectionString: url,
    max: Number(process.env.DB_POOL_MAX || 20),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
    // Certificates are verified (Neon uses public CAs). Set DATABASE_SSL_NO_VERIFY=1 only for a self-signed server.
    ssl: local ? undefined : { rejectUnauthorized: process.env.DATABASE_SSL_NO_VERIFY !== '1' },
  });
  pool.on('error', (e) => console.error('[db] idle client error', e));
  g._pool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
