import 'server-only';
import { and, eq, gte, inArray, isNotNull, lt, or } from 'drizzle-orm';
import { db, schema } from '@/db';
import { dayRange, pkDay, fmtDateTime, pkMonth, monthRange } from './format';

export type Note = { key: string; tone: 'red' | 'amber' | 'blue' | 'green'; title: string; detail: string; href: string };

/** Live alerts, computed from the data (no separate notification table to keep in sync) */
export async function getNotifications(): Promise<Note[]> {
  const now = new Date();
  const today = pkDay(now);
  const { start, end } = dayRange(today);
  const out: Note[] = [];

  const month = pkMonth(now);
  const { end: mEnd } = monthRange(month);
  const nearMonthEnd = mEnd.getTime() - now.getTime() < 3 * 86400000;

  const [bks, maint, cars, drivers, invs] = await Promise.all([
    db.select().from(schema.bookings).where(inArray(schema.bookings.status, ['PENDING', 'IN_PROGRESS', 'CONFIRMED'])),
    // Scheduled rows, plus only completed rows that set an oil-change target (the full history grows forever).
    db.select().from(schema.maintenance).where(or(eq(schema.maintenance.status, 'SCHEDULED'), and(eq(schema.maintenance.status, 'COMPLETED'), isNotNull(schema.maintenance.nextOilChangeKm)))),
    db.select().from(schema.vehicles).where(eq(schema.vehicles.active, true)),
    db.select().from(schema.drivers).where(eq(schema.drivers.status, 'ACTIVE')),
    nearMonthEnd ? db.select({ id: schema.investors.id }).from(schema.investors) : Promise.resolve([]),
  ]);

  bks.filter((b) => b.status === 'PENDING').forEach((b) => {
    out.push({ key: `p-${b.id}`, tone: 'amber', title: b.source === 'PORTAL' ? 'New booking request (customer portal)' : 'Booking awaiting confirmation', detail: `${b.id} · starts ${fmtDateTime(b.startAt)}`, href: `/admin/bookings/${b.id}` });
  });

  const running = bks.filter((b) => b.status === 'IN_PROGRESS');
  running.filter((b) => b.endAt < now).forEach((b) => out.push({ key: `o-${b.id}`, tone: 'red', title: 'Overdue return', detail: `${b.id} was due ${fmtDateTime(b.endAt)}`, href: `/admin/receiving?booking=${b.id}` }));
  running.filter((b) => b.endAt >= now && b.endAt < end).forEach((b) => out.push({ key: `d-${b.id}`, tone: 'blue', title: 'Car due back today', detail: `${b.id} at ${fmtDateTime(b.endAt)}`, href: `/admin/receiving?booking=${b.id}` }));

  bks.filter((b) => b.status === 'CONFIRMED' && b.startAt >= start && b.startAt < end).forEach((b) => {
    out.push({ key: `s-${b.id}`, tone: 'blue', title: 'Booking starts today', detail: `${b.id} at ${fmtDateTime(b.startAt)}`, href: `/admin/bookings/${b.id}` });
  });

  maint.filter((m) => m.status === 'SCHEDULED' && m.date < today).forEach((m) => {
    out.push({ key: `m-${m.id}`, tone: 'red', title: 'Maintenance overdue', detail: `${m.id} was scheduled ${m.date}`, href: '/admin/maintenance' });
  });

  const lastOil = maint.filter((m) => m.status === 'COMPLETED');
  cars.forEach((c) => {
    const m = lastOil.filter((x) => x.vehicleId === c.id && x.nextOilChangeKm).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (m && m.nextOilChangeKm && c.meterReading >= m.nextOilChangeKm) out.push({ key: `oil-${c.id}`, tone: 'amber', title: 'Oil change due', detail: `${c.model} (${c.regNo}) at ${c.meterReading.toLocaleString()} km`, href: '/admin/maintenance?new=1' });
  });

  const soon = pkDay(new Date(now.getTime() + 30 * 86400000));
  drivers.filter((d) => d.licenseExpiry && d.licenseExpiry <= soon).forEach((d) => out.push({ key: `lic-${d.id}`, tone: d.licenseExpiry! < today ? 'red' : 'amber', title: 'Driver licence expiring', detail: `${d.name} · ${d.licenseExpiry}`, href: '/admin/drivers' }));

  if (nearMonthEnd && invs.length) {
    const paid = await db.select().from(schema.investorPayouts).where(and(eq(schema.investorPayouts.month, month), inArray(schema.investorPayouts.investorId, invs.map((i) => i.id))));
    const due = invs.length - paid.length;
    if (due > 0) out.push({ key: `inv-${month}`, tone: 'green', title: 'Month-end investor payouts', detail: `${due} investor(s) to be paid for ${month}`, href: '/admin/investors' });
  }
  return out;
}
