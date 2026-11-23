import Link from 'next/link';
import { and, desc, eq, gte, lt, ne, sql } from 'drizzle-orm';
import { Eye, Wallet, CalendarDays, Clock, BadgeCheck, TriangleAlert } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm } from '@/lib/auth';
import { bookingBalances } from '@/lib/calc';
import { addMonths, dayRange, fmtDate, fmtDateTime, monthLabel, parsePk, pkDay, pkMonth, pkr } from '@/lib/format';
import { Badge, Card, Kpi, PageHeader, Pagination, TableWrap, Empty, href, paginate, Plate } from '@/components/ui';

export default async function PaymentsPage({ searchParams: sp }: { searchParams: { q?: string; from?: string; to?: string; page?: string; cal?: string; status?: string; tab?: string } }) {
  await requirePerm('payments');
  const from = parsePk(sp.from ?? ''), to = parsePk(sp.to ?? '');
  const toEnd = to ? new Date(to.getTime() + 86400000) : null;
  const rows = await db.select({ b: schema.bookings, c: schema.customers, v: schema.vehicles, l: schema.locations.name }).from(schema.bookings)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId)).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .leftJoin(schema.locations, eq(schema.locations.id, schema.bookings.locationId))
    .where(and(ne(schema.bookings.status, 'CANCELLED'), from ? gte(schema.bookings.startAt, from) : sql`true`, toEnd ? lt(schema.bookings.startAt, toEnd) : sql`true`))
    .orderBy(desc(schema.bookings.startAt));
  const bal = await bookingBalances(rows.map((r) => r.b.id));
  const q = (sp.q ?? '').toLowerCase();
  const list = rows.filter(({ b, c }) => (!q || `${b.id} ${c?.phone} ${c?.name}`.toLowerCase().includes(q)) && (!sp.status || (sp.status === 'pending' ? (bal.get(b.id)?.pending ?? 0) > 0 : (bal.get(b.id)?.pending ?? 0) === 0)));
  const pg = paginate(list, sp.page);
  let totalRev = 0, pending = 0;
  rows.forEach((r) => { const x = bal.get(r.b.id)!; totalRev += x.total + x.fine; pending += x.pending; });
  const payWhere = (extra?: ReturnType<typeof sql>) => and(from ? gte(schema.payments.paidAt, from) : sql`true`, toEnd ? lt(schema.payments.paidAt, toEnd) : sql`true`, extra ?? sql`true`);
  const [received] = await db.select({ s: sql<number>`coalesce(sum(${schema.payments.amount}),0)::int` }).from(schema.payments).where(payWhere(sql`${schema.payments.type} <> 'DAMAGE'`));
  const [damage] = await db.select({ s: sql<number>`coalesce(sum(${schema.payments.amount}),0)::int` }).from(schema.payments).where(payWhere(sql`${schema.payments.type} = 'DAMAGE'`));
  const t = dayRange(pkDay());
  const [today] = await db.select({ s: sql<number>`coalesce(sum(${schema.payments.amount}),0)::int` }).from(schema.payments).where(and(gte(schema.payments.paidAt, t.start), lt(schema.payments.paidAt, t.end)));
  const base = { q: sp.q, from: sp.from, to: sp.to, status: sp.status, cal: sp.cal };

  // calendar of daily received amounts
  const calMonth = sp.cal && /^\d{4}-\d{2}$/.test(sp.cal) ? sp.cal : null;
  let calDays: { d: string; s: number }[] = [];
  if (calMonth) {
    const start = new Date(`${calMonth}-01T00:00:00+05:00`), end = new Date(`${addMonths(calMonth, 1)}-01T00:00:00+05:00`);
    const ps = await db.select({ at: schema.payments.paidAt, a: schema.payments.amount }).from(schema.payments).where(and(gte(schema.payments.paidAt, start), lt(schema.payments.paidAt, end)));
    const n = new Date(Number(calMonth.slice(0, 4)), Number(calMonth.slice(5)), 0).getDate();
    calDays = Array.from({ length: n }, (_, i) => { const d = `${calMonth}-${String(i + 1).padStart(2, '0')}`; return { d, s: ps.filter((p) => pkDay(p.at) === d).reduce((x, p) => x + p.a, 0) }; });
  }
  const recent = sp.tab === 'all' ? await db.select({ p: schema.payments, c: schema.customers.name }).from(schema.payments).leftJoin(schema.customers, eq(schema.customers.id, schema.payments.customerId)).where(payWhere()).orderBy(desc(schema.payments.paidAt)).limit(300) : [];
  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle={from || to ? `${sp.from ? fmtDate(sp.from) : '…'} – ${sp.to ? fmtDate(sp.to) : '…'}` : 'All time'}>
        <Link href={href('/admin/payments', base, { tab: sp.tab === 'all' ? undefined : 'all' })} className="btn-ghost">{sp.tab === 'all' ? 'By booking' : 'All payment records'}</Link>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi featured label="Total revenue" value={pkr(totalRev)} icon={<Wallet size={18} />} hint="Booking totals + fines" />
        <Kpi label="Today's payments" value={pkr(today.s)} tone="cyan" icon={<CalendarDays size={18} />} />
        <Kpi label="Pending payments" value={pkr(pending)} tone="red" icon={<Clock size={18} />} />
        <Kpi label="Payments received" value={pkr(received.s)} tone="green" icon={<BadgeCheck size={18} />} />
        <Kpi label="Damage revenue (separate)" value={pkr(damage.s)} tone="orange" icon={<TriangleAlert size={18} />} />
      </div>
      <Card>
        <form className="no-print grid gap-2 p-4 md:grid-cols-[auto_auto_auto_1fr_auto_auto]" method="get">
          <Link href={href('/admin/payments', base, { cal: calMonth ? undefined : pkMonth() })} className="btn-ghost">{calMonth ? 'Hide calendar' : 'Show calendar'}</Link>
          <label className="flex items-center gap-2 text-sm text-muted">From <input type="date" name="from" defaultValue={sp.from} className="input" /></label>
          <label className="flex items-center gap-2 text-sm text-muted">To <input type="date" name="to" defaultValue={sp.to} className="input" /></label>
          <input name="q" defaultValue={sp.q} placeholder="Search by booking ID, phone or customer name" className="input" />
          <select name="status" defaultValue={sp.status} className="input"><option value="">All</option><option value="pending">Pending</option><option value="paid">Fully paid</option></select>
          <button className="btn-ghost">Apply</button>
        </form>
        {calMonth && (
          <div className="border-b border-line p-4">
            <div className="mb-2 flex items-center gap-3 text-sm font-medium"><Link href={href('/admin/payments', base, { cal: addMonths(calMonth, -1) })}>‹</Link>{monthLabel(calMonth)}<Link href={href('/admin/payments', base, { cal: addMonths(calMonth, 1) })}>›</Link><span className="text-xs font-normal text-muted">received per day — click a day to filter</span></div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calDays.map((x) => <Link key={x.d} href={href('/admin/payments', { ...base, from: x.d, to: x.d })} className={`rounded-lg p-2 ${x.s ? 'bg-ok-soft' : 'bg-panel2'} hover:ring-1 hover:ring-navy/20`}><span className="block font-medium">{Number(x.d.slice(8))}</span><span className="text-[11px] text-muted">{x.s ? `${Math.round(x.s / 1000)}k` : '—'}</span></Link>)}
            </div>
          </div>)}
        {sp.tab === 'all' ? (
          <TableWrap><table className="tbl"><thead><tr><th>Date</th><th>Receipt</th><th>Customer</th><th>Booking / damage</th><th>Type</th><th>Method</th><th>Amount</th></tr></thead><tbody>
            {recent.length === 0 && <Empty cols={7} />}
            {recent.map(({ p, c }) => <tr key={p.id}><td>{fmtDateTime(p.paidAt)}</td><td><Link className="link font-mono text-xs" href={`/admin/payments/receipt/${p.id}`}>{p.id}</Link></td><td>{c}</td><td className="font-mono text-xs">{p.bookingId ?? p.damageId}</td><td><Badge status={p.type} label={p.type.charAt(0) + p.type.slice(1).toLowerCase()} /></td><td>{p.method}</td><td className="font-medium">{pkr(p.amount)}</td></tr>)}
          </tbody></table></TableWrap>
        ) : (<>
          <TableWrap><table className="tbl">
            <thead><tr><th>Pending</th><th>Total</th><th>Fine</th><th>Paid</th><th>Booking ID</th><th>Customer</th><th>Car (plate)</th><th>Location</th><th>Status</th><th>Date</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {pg.slice.length === 0 && <Empty cols={11} />}
              {pg.slice.map(({ b, c, v, l }) => { const x = bal.get(b.id)!; return (
                <tr key={b.id}><td className={x.pending ? 'font-medium text-bad' : 'text-ok'}>{pkr(x.pending)}</td><td>{pkr(x.total)}</td><td>{pkr(x.fine)}</td><td className="text-ok">{pkr(x.paid)}</td>
                  <td><Link className="link font-mono text-xs" href={`/admin/bookings/${b.id}`}>{b.id}</Link></td><td>{c?.name}<span className="block text-xs text-muted">{c?.phone}</span></td><td>{v?.model}{v?.regNo && <span className="mt-1 block"><Plate reg={v.regNo} /></span>}</td><td>{l ?? '—'}</td>
                  <td><Badge status={b.status} /></td><td>{fmtDate(b.startAt)}</td>
                  <td><div className="flex justify-end gap-1">{x.pending > 0 && <Link className="btn-primary btn-sm" href={`/admin/bookings/${b.id}#pay`}>Receive</Link>}<Link className="btn-ghost btn-sm" href={`/admin/bookings/${b.id}`}><Eye size={13} /></Link></div></td></tr>); })}
            </tbody></table></TableWrap>
          <Pagination {...pg} makeHref={(p) => href('/admin/payments', base, { page: p })} />
        </>)}
      </Card>
    </div>
  );
}
