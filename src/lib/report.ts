import 'server-only';
import { and, desc, eq, gte, lt, lte, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { bookingBalances, fleetStatus } from './calc';
import { MONTHS, monthRange, pkDay, pkMonth } from './format';

const sum = (col: unknown) => sql<number>`coalesce(sum(${col}),0)::int`;

/** Owner summary for a Pakistan date range (inclusive) */
export async function buildReport(from: string, to: string) {
  const start = new Date(`${from}T00:00:00+05:00`);
  const end = new Date(new Date(`${to}T00:00:00+05:00`).getTime() + 86400000);
  const m = monthRange(pkMonth());
  const notCancelled = ne(schema.bookings.status, 'CANCELLED');
  // Independent totals run together instead of one after another.
  const [[bk], [fines], [dmg], [exp], [mnt], [cash], [monthSales], rows, fleet, [drivers]] = await Promise.all([
    db.select({ v: sum(schema.bookings.totalAmount) }).from(schema.bookings).where(and(notCancelled, gte(schema.bookings.startAt, start), lt(schema.bookings.startAt, end))),
    db.select({ v: sum(schema.receivings.fine) }).from(schema.receivings).where(and(gte(schema.receivings.receivedAt, start), lt(schema.receivings.receivedAt, end))),
    db.select({ v: sum(schema.damages.estimatedCost) }).from(schema.damages).where(and(ne(schema.damages.status, 'WAIVED'), gte(schema.damages.createdAt, start), lt(schema.damages.createdAt, end))),
    db.select({ v: sum(schema.expenses.amount) }).from(schema.expenses).where(and(gte(schema.expenses.date, from), lte(schema.expenses.date, to))),
    db.select({ v: sum(schema.maintenance.cost) }).from(schema.maintenance).where(and(gte(schema.maintenance.date, from), lte(schema.maintenance.date, to))),
    db.select({ v: sum(schema.payments.amount) }).from(schema.payments).where(and(gte(schema.payments.paidAt, start), lt(schema.payments.paidAt, end))),
    db.select({ v: sum(schema.bookings.totalAmount) }).from(schema.bookings).where(and(notCancelled, gte(schema.bookings.startAt, m.start), lt(schema.bookings.startAt, m.end))),
    db.select({ b: schema.bookings, c: schema.customers.name, v: schema.vehicles, l: schema.locations.name }).from(schema.bookings)
      .leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId)).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
      .leftJoin(schema.locations, eq(schema.locations.id, schema.bookings.locationId))
      .where(and(notCancelled, gte(schema.bookings.startAt, start), lt(schema.bookings.startAt, end))).orderBy(desc(schema.bookings.startAt)),
    fleetStatus(),
    db.select({ v: sql<number>`count(*)::int` }).from(schema.drivers).where(eq(schema.drivers.status, 'ACTIVE')),
  ]);
  const bal = await bookingBalances(rows.map((r) => r.b.id));
  let pending = 0; bal.forEach((x) => (pending += x.pending));
  const revenue = bk.v + fines.v + dmg.v;
  const expenses = exp.v + mnt.v;
  // Year-to-date chart: one grouped query per source (was 36 sequential queries). Revenue uses
  // the same definition as the headline figure: bookings + fines + non-waived damage.
  const year = pkDay().slice(0, 4);
  const yStart = new Date(`${year}-01-01T00:00:00+05:00`), yEnd = new Date(`${Number(year) + 1}-01-01T00:00:00+05:00`);
  const pkMonthOf = (col: unknown) => sql<string>`to_char(${col} at time zone 'Asia/Karachi', 'YYYY-MM')`;
  const textMonth = (col: unknown) => sql<string>`to_char(${col}, 'YYYY-MM')`;
  const [yb, yf, yd, ye, ym] = await Promise.all([
    db.select({ m: pkMonthOf(schema.bookings.startAt), v: sum(schema.bookings.totalAmount) }).from(schema.bookings)
      .where(and(notCancelled, gte(schema.bookings.startAt, yStart), lt(schema.bookings.startAt, yEnd))).groupBy(sql`1`),
    db.select({ m: pkMonthOf(schema.receivings.receivedAt), v: sum(schema.receivings.fine) }).from(schema.receivings)
      .where(and(gte(schema.receivings.receivedAt, yStart), lt(schema.receivings.receivedAt, yEnd))).groupBy(sql`1`),
    db.select({ m: pkMonthOf(schema.damages.createdAt), v: sum(schema.damages.estimatedCost) }).from(schema.damages)
      .where(and(ne(schema.damages.status, 'WAIVED'), gte(schema.damages.createdAt, yStart), lt(schema.damages.createdAt, yEnd))).groupBy(sql`1`),
    db.select({ m: textMonth(schema.expenses.date), v: sum(schema.expenses.amount) }).from(schema.expenses)
      .where(and(gte(schema.expenses.date, `${year}-01-01`), lte(schema.expenses.date, `${year}-12-31`))).groupBy(sql`1`),
    db.select({ m: textMonth(schema.maintenance.date), v: sum(schema.maintenance.cost) }).from(schema.maintenance)
      .where(and(gte(schema.maintenance.date, `${year}-01-01`), lte(schema.maintenance.date, `${year}-12-31`))).groupBy(sql`1`),
  ]);
  const byMonth = (rs: { m: string; v: number }[]) => new Map(rs.map((r) => [r.m, Number(r.v)]));
  const [mb, mf, md, me, mm] = [yb, yf, yd, ye, ym].map(byMonth);
  const ytd = MONTHS.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    return { label, revenue: (mb.get(key) ?? 0) + (mf.get(key) ?? 0) + (md.get(key) ?? 0), expenses: (me.get(key) ?? 0) + (mm.get(key) ?? 0) };
  });
  return {
    revenue, bookingRevenue: bk.v, fines: fines.v, damage: dmg.v, expenses, officeExpenses: exp.v, maintenance: mnt.v, profit: revenue - expenses, cash: cash.v,
    monthSales: monthSales.v, pending, vehicles: fleet.length, drivers: drivers.v, maintenanceVehicles: fleet.filter((f) => f.vstatus === 'MAINTENANCE').length,
    ytd, year, rows: rows.map((r) => ({ ...r, bal: bal.get(r.b.id)! })),
  };
}
