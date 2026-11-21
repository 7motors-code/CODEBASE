import { sql } from 'drizzle-orm';
import { db } from '@/db';

export const dynamic = 'force-dynamic';

/** Uptime check: GET /api/health → 200 when the app and database are reachable */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, time: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[health] database check failed', e);
    return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
