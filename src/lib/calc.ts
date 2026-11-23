import 'server-only';
import { and, eq, gte, inArray, lt, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { Booking, Vehicle } from '@/db/schema';
import { dayRange, monthRange, pkDay } from './format';
import { cacheGet, cacheSet } from './redis';

export type VStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'RETURN' | 'MAINTENANCE';
export const V_STATUS_LABEL: Record<VStatus, string> = {
  AVAILABLE: 'Available', RESERVED: 'Reserved', BOOKED: 'Rented', RETURN: 'Return', MAINTENANCE: 'Maintenance',
};

const H = 3600 * 1000;

/** Rent for a period: whole days (24h) or 12-hour shifts, rounded up */
export function rentFor(v: Pick<Vehicle, 'rateDay' | 'rate12h'>, durationType: string, start: Date, end: Date) {
  const hours = Math.max(0, (end.getTime() - start.getTime()) / H);
  if (hours <= 0) return { units: 0, rent: 0 };
  if (durationType === '12H') { const units = Math.ceil(hours / 12 - 1e-9); return { units, rent: units * v.rate12h }; }
  const units = Math.ceil(hours / 24 - 1e-9);
  return { units, rent: units * v.rateDay };
}

/** Late-return fine: time past end (after grace) charged in 12h or 24h units */
export function lateFine(v: Pick<Vehicle, 'rateDay' | 'rate12h'>, durationType: string, endAt: Date, receivedAt: Date, graceHours: number) {
  const lateH = (receivedAt.getTime() - endAt.getTime()) / H - graceHours;
  if (lateH <= 0) return { lateHours: 0, fine: 0 };
  const realLate = lateH + graceHours;
  if (durationType === '12H') return { lateHours: realLate, fine: Math.ceil(lateH / 12) * v.rate12h };
  return { lateHours: realLate, fine: Math.ceil(lateH / 24) * v.rateDay };
}

type MaintRow = typeof schema.maintenance.$inferSelect;

/** Status of each vehicle "now", or for a given Pakistan day (YYYY-MM-DD) */
export async function fleetStatus(day?: string) {
  const vehicles = await db.select().from(schema.vehicles).where(eq(schema.vehicles.active, true)).orderBy(schema.vehicles.model);
  const now = new Date();
  const today = pkDay(now);
  const target = day ?? today;
  const { start, end } = dayRange(target);
  const isNow = !day || day === today;
  const active = await db.select().from(schema.bookings).where(and(
    inArray(schema.bookings.status, ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']),
    lt(schema.bookings.startAt, end), gte(schema.bookings.endAt, isNow ? new Date(0) : start),
  ));
  const maint = await db.select().from(schema.maintenance).where(ne(schema.maintenance.status, 'COMPLETED'));
  return vehicles.map((v) => {
    const bs = active.filter((b) => b.vehicleId === v.id);
    const ms = maint.filter((m) => m.vehicleId === v.id);
    const r = statusOf(bs, ms, { isNow, now, start, end, target });
    return { ...v, vstatus: r.status, booking: r.booking ?? null, overdue: r.overdue ?? false };
  });
}

function statusOf(bs: Booking[], ms: MaintRow[], o: { isNow: boolean; now: Date; start: Date; end: Date; target: string }):
  { status: VStatus; booking?: Booking; overdue?: boolean } {
  if (o.isNow) {
    if (ms.some((m) => m.status === 'IN_PROGRESS')) return { status: 'MAINTENANCE' };
    const running = bs.find((b) => b.status === 'IN_PROGRESS');
    if (running) {
      if (running.endAt < o.now) return { status: 'RETURN', booking: running, overdue: true };
      if (running.endAt < o.end) return { status: 'RETURN', booking: running };
      return { status: 'BOOKED', booking: running };
    }
    const soon = bs.filter((b) => (b.status === 'CONFIRMED' || b.status === 'PENDING') && b.startAt < o.end && b.endAt > o.now)
      .sort((a, b) => +a.startAt - +b.startAt)[0];
    if (soon) return { status: 'RESERVED', booking: soon };
    if (ms.some((m) => m.status === 'SCHEDULED' && m.date === o.target)) return { status: 'MAINTENANCE' };
    return { status: 'AVAILABLE' };
  }
  if (ms.some((m) => m.date === o.target)) return { status: 'MAINTENANCE' };
  const ov = bs.find((b) => b.startAt < o.end && b.endAt >= o.start);
  if (!ov) return { status: 'AVAILABLE' };
  if (ov.endAt >= o.start && ov.endAt < o.end) return { status: 'RETURN', booking: ov };
  if (ov.status === 'IN_PROGRESS' || ov.status === 'COMPLETED') return { status: 'BOOKED', booking: ov };
  return { status: 'RESERVED', booking: ov };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Exec = typeof db | Tx;

/**
 * Runs booking writes in a transaction holding a database-wide booking lock, so two staff members
 * (or a staff member and the portal) can never double-book the same car or driver at the same moment.
 */
export async function withBookingLock<T>(fn: (tx: Tx) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7007001)`);
    return fn(tx);
  });
}

/** Is a vehicle free for [start, end)? (ignores the given booking id when editing) */
export async function vehicleClash(vehicleId: number, start: Date, end: Date, ignoreId?: string, exec: Exec = db) {
  const rows = await exec.select({ id: schema.bookings.id }).from(schema.bookings).where(and(
    eq(schema.bookings.vehicleId, vehicleId),
    inArray(schema.bookings.status, ['PENDING', 'CONFIRMED', 'IN_PROGRESS']),
    lt(schema.bookings.startAt, end), sql`${schema.bookings.endAt} > ${start.toISOString()}`,
    ignoreId ? ne(schema.bookings.id, ignoreId) : sql`true`,
  ));
  return rows[0]?.id ?? null;
}
export async function driverClash(driverId: number, start: Date, end: Date, ignoreId?: string, exec: Exec = db) {
  const rows = await exec.select({ id: schema.bookings.id }).from(schema.bookings).where(and(
    eq(schema.bookings.driverId, driverId),
    inArray(schema.bookings.status, ['PENDING', 'CONFIRMED', 'IN_PROGRESS']),
    lt(schema.bookings.startAt, end), sql`${schema.bookings.endAt} > ${start.toISOString()}`,
    ignoreId ? ne(schema.bookings.id, ignoreId) : sql`true`,
  ));
  return rows[0]?.id ?? null;
}

export type Balance = { total: number; fine: number; paid: number; pending: number };

/** Rent balances for bookings (rent + fine − payments of type ADVANCE/RENT/FINE) */
export async function bookingBalances(ids: string[]): Promise<Map<string, Balance>> {
  const out = new Map<string, Balance>();
  if (!ids.length) return out;
  const bs = await db.select({ id: schema.bookings.id, total: schema.bookings.totalAmount, status: schema.bookings.status })
    .from(schema.bookings).where(inArray(schema.bookings.id, ids));
  const fines = await db.select({ id: schema.receivings.bookingId, fine: schema.receivings.fine })
    .from(schema.receivings).where(inArray(schema.receivings.bookingId, ids));
  const pays = await db.select({ id: schema.payments.bookingId, s: sql<number>`coalesce(sum(${schema.payments.amount}),0)::int` })
    .from(schema.payments).where(and(inArray(schema.payments.bookingId, ids), inArray(schema.payments.type, ['ADVANCE', 'RENT', 'FINE'])))
    .groupBy(schema.payments.bookingId);
  for (const b of bs) {
    const fine = fines.find((f) => f.id === b.id)?.fine ?? 0;
    const paid = pays.find((p) => p.id === b.id)?.s ?? 0;
    const total = b.status === 'CANCELLED' ? 0 : b.total;
    out.set(b.id, { total, fine, paid, pending: Math.max(0, total + fine - paid) });
  }
  return out;
}

export async function damagePaid(ids: string[]) {
  const m = new Map<string, number>();
  if (!ids.length) return m;
  const rows = await db.select({ id: schema.payments.damageId, s: sql<number>`coalesce(sum(${schema.payments.amount}),0)::int` })
    .from(schema.payments).where(inArray(schema.payments.damageId, ids)).groupBy(schema.payments.damageId);
  rows.forEach((r) => r.id && m.set(r.id, r.s));
  return m;
}

/** Totals for one customer: paid and pending (rent + damage) */
export async function customerTotals(customerId: string) {
  const bs = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.customerId, customerId));
  const bal = await bookingBalances(bs.map((b) => b.id));
  const dmg = await db.select().from(schema.damages).where(and(eq(schema.damages.customerId, customerId), eq(schema.damages.status, 'PENDING')));
  const dPaid = await damagePaid(dmg.map((d) => d.id));
  const [paid] = await db.select({ s: sql<number>`coalesce(sum(${schema.payments.amount}),0)::int` }).from(schema.payments).where(eq(schema.payments.customerId, customerId));
  let pending = 0;
  bal.forEach((b) => (pending += b.pending));
  dmg.forEach((d) => (pending += Math.max(0, d.estimatedCost - (dPaid.get(d.id) ?? 0))));
  return { paid: paid?.s ?? 0, pending, bookings: bs.length };
}

/** Investor month summary, exactly as in the demo: payable = revenue × share% − maintenance */
export async function investorSummary(investorId: number, month: string) {
  const [inv] = await db.select().from(schema.investors).where(eq(schema.investors.id, investorId));
  if (!inv) return null;
  const pct = Number(inv.sharePercent);
  const cars = await db.select().from(schema.vehicles).where(eq(schema.vehicles.investorId, investorId));
  const { start, end } = monthRange(month);
  const ids = cars.map((c) => c.id);
  const bs = ids.length ? await db.select().from(schema.bookings).where(and(
    inArray(schema.bookings.vehicleId, ids), ne(schema.bookings.status, 'CANCELLED'),
    gte(schema.bookings.startAt, start), lt(schema.bookings.startAt, end))) : [];
  const ms = ids.length ? await db.select().from(schema.maintenance).where(and(
    inArray(schema.maintenance.vehicleId, ids), gte(schema.maintenance.date, month + '-01'), lt(schema.maintenance.date, pkDay(end)))) : [];
  const fleet = await fleetStatus();
  const perCar = cars.map((c) => {
    const cb = bs.filter((b) => b.vehicleId === c.id);
    const revenue = cb.reduce((s, b) => s + b.totalAmount, 0);
    const maint = ms.filter((m) => m.vehicleId === c.id).reduce((s, m) => s + m.cost, 0);
    const share = Math.round((revenue * pct) / 100);
    return { car: c, status: fleet.find((f) => f.id === c.id)?.vstatus ?? 'AVAILABLE', bookings: cb.length, revenue, share, maintenance: maint, payable: share - maint };
  });
  const revenue = perCar.reduce((s, x) => s + x.revenue, 0);
  const share = perCar.reduce((s, x) => s + x.share, 0);
  const maintenance = perCar.reduce((s, x) => s + x.maintenance, 0);
  const payable = share - maintenance;
  const [payout] = await db.select().from(schema.investorPayouts).where(and(eq(schema.investorPayouts.investorId, investorId), eq(schema.investorPayouts.month, month)));
  return { investor: inv, pct, perCar, revenue, share, maintenance, payable, office: revenue - payable, payout: payout ?? null };
}

/** Driver ledger: earned, paid, pending */
export async function driverLedger(driverIds?: number[]) {
  const ds = await db.select().from(schema.drivers);
  const list = driverIds ? ds.filter((d) => driverIds.includes(d.id)) : ds;
  const earnedRows = await db.select({ id: schema.bookings.driverId, s: sql<number>`coalesce(sum(${schema.bookings.driverAmount}),0)::int`, n: sql<number>`count(*)::int` })
    .from(schema.bookings).where(eq(schema.bookings.status, 'COMPLETED')).groupBy(schema.bookings.driverId);
  const paidRows = await db.select({ id: schema.driverPayments.driverId, s: sql<number>`coalesce(sum(${schema.driverPayments.amount}),0)::int` })
    .from(schema.driverPayments).groupBy(schema.driverPayments.driverId);
  const running = await db.select({ id: schema.bookings.driverId }).from(schema.bookings).where(eq(schema.bookings.status, 'IN_PROGRESS'));
  const now = new Date();
  return list.map((d) => {
    let earned = 0;
    if (d.paymentBasis === 'SALARY') {
      const c = new Date(d.createdAt);
      const months = (now.getFullYear() - c.getFullYear()) * 12 + (now.getMonth() - c.getMonth()) + 1;
      earned = Math.max(1, months) * d.monthlySalary;
    } else earned = earnedRows.find((r) => r.id === d.id)?.s ?? 0;
    const paid = paidRows.find((r) => r.id === d.id)?.s ?? 0;
    return { driver: d, earned, paid, pending: Math.max(0, earned - paid), trips: earnedRows.find((r) => r.id === d.id)?.n ?? 0, onTrip: running.some((r) => r.id === d.id) };
  });
}

export async function getSetting(key: string, def: string) {
  const cacheKey = `setting:${key}`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached !== null && cached !== undefined) return cached;
  const [r] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
  const val = r?.value ?? def;
  await cacheSet(cacheKey, val, 600);
  return val;
}
