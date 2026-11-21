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
  const [bk] = await db.select({ v: sum(schema.bookings.totalAmount) }).from(schema.bookings).where(and(ne(schema.bookings.status, 'CANCELLED'), gte(schema.bookings.startAt, start), lt(schema.bookings.startAt, end)));
  const [fines] = await db.select({ v: sum(schema.receivings.fine) }).from(schema.receivings).where(and(gte(schema.receivings.receivedAt, start), lt(schema.receivings.receivedAt, end)));
  const [dmg] = await db.select({ v: sum(schema.damages.estimatedCost) }).from(schema.damages).where(and(ne(schema.damages.status, 'WAIVED'), gte(schema.damages.createdAt, start), lt(schema.damages.createdAt, end)));
  const [exp] = await db.select({ v: sum(schema.expenses.amount) }).from(schema.expenses).where(and(gte(schema.expenses.date, from), lte(schema.expenses.date, to)));
  const [mnt] = await db.select({ v: sum(schema.maintenance.cost) }).from(schema.maintenance).where(and(gte(schema.maintenance.date, from), lte(schema.maintenance.date, to)));
  const [cash] = await db.select({ v: sum(schema.payments.amount) }).from(schema.payments).where(and(gte(schema.payments.paidAt, start), lt(schema.payments.paidAt, end)));
  const m = monthRange(pkMonth());
  const [monthSales] = await db.select({ v: sum(schema.bookings.totalAmount) }).from(schema.bookings).where(and(ne(schema.bookings.status, 'CANCELLED'), gte(schema.bookings.startAt, m.start), lt(schema.bookings.startAt, m.end)));
  const rows = await db.select({ b: schema.bookings, c: schema.customers.name, v: schema.vehicles, l: schema.locations.name }).from(schema.bookings)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId)).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .leftJoin(schema.locations, eq(schema.locations.id, schema.bookings.locationId))
    .where(and(ne(schema.bookings.status, 'CANCELLED'), gte(schema.bookings.startAt, start), lt(schema.bookings.startAt, end))).orderBy(desc(schema.bookings.startAt));
  const bal = await bookingBalances(rows.map((r) => r.b.id));
  let pending = 0; bal.forEach((x) => (pending += x.pending));
  const fleet = await fleetStatus();
  const [drivers] = await db.select({ v: sql<number>`count(*)::int` }).from(schema.drivers).where(eq(schema.drivers.status, 'ACTIVE'));
  const revenue = bk.v + fines.v + dmg.v;
  const expenses = exp.v + mnt.v;
  // year-to-date chart
  const year = pkDay().slice(0, 4);
  const ytd = [];
  for (let i = 1; i <= 12; i++) {
    const mm = `${year}-${String(i).padStart(2, '0')}`; const r = monthRange(mm);
    const [a] = await db.select({ v: sum(schema.bookings.totalAmount) }).from(schema.bookings).where(and(ne(schema.bookings.status, 'CANCELLED'), gte(schema.bookings.startAt, r.start), lt(schema.bookings.startAt, r.end)));
    const [e] = await db.select({ v: sum(schema.expenses.amount) }).from(schema.expenses).where(and(gte(schema.expenses.date, `${mm}-01`), lt(schema.expenses.date, pkDay(r.end))));
    const [mm2] = await db.select({ v: sum(schema.maintenance.cost) }).from(schema.maintenance).where(and(gte(schema.maintenance.date, `${mm}-01`), lt(schema.maintenance.date, pkDay(r.end))));
    ytd.push({ label: MONTHS[i - 1], revenue: a.v, expenses: e.v + mm2.v });
  }
  return {
    revenue, bookingRevenue: bk.v, fines: fines.v, damage: dmg.v, expenses, officeExpenses: exp.v, maintenance: mnt.v, profit: revenue - expenses, cash: cash.v,
    monthSales: monthSales.v, pending, vehicles: fleet.length, drivers: drivers.v, maintenanceVehicles: fleet.filter((f) => f.vstatus === 'MAINTENANCE').length,
    ytd, year, rows: rows.map((r) => ({ ...r, bal: bal.get(r.b.id)! })),
  };
}
