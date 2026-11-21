import { and, inArray, lt, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getUser } from '@/lib/auth';
import { parsePk } from '@/lib/format';

export const dynamic = 'force-dynamic';

/** Returns vehicle ids and driver ids already booked in [start, end) */
export async function GET(req: Request) {
  if (!(await getUser())) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const u = new URL(req.url);
  const start = parsePk(u.searchParams.get('start')), end = parsePk(u.searchParams.get('end'));
  const ignore = u.searchParams.get('ignore') ?? '';
  if (!start || !end || end <= start) return Response.json({ vehicles: [], drivers: [] });
  const rows = await db.select({ v: schema.bookings.vehicleId, d: schema.bookings.driverId, id: schema.bookings.id }).from(schema.bookings).where(and(
    inArray(schema.bookings.status, ['PENDING', 'CONFIRMED', 'IN_PROGRESS']), lt(schema.bookings.startAt, end),
    sql`${schema.bookings.endAt} > ${start.toISOString()}`, ignore ? ne(schema.bookings.id, ignore) : sql`true`));
  return Response.json({ vehicles: rows.map((r) => r.v), drivers: rows.map((r) => r.d).filter(Boolean) });
}
