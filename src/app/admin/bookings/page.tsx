import Link from 'next/link';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { Plus, Eye, Pencil, Printer, Clock, CheckCircle2, PlayCircle, Flag } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { T } from '@/lib/prefs';
import { bookingBalances } from '@/lib/calc';
import { fmtDateTime, parsePk, pkr } from '@/lib/format';
import { Badge, Card, Kpi, PageHeader, Pagination, TableWrap, Empty, href, paginate, Plate } from '@/components/ui';

const TABS = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default async function BookingsPage({ searchParams: sp }: { searchParams: { q?: string; status?: string; from?: string; to?: string; page?: string; location?: string; driver?: string } }) {
  await requirePerm('bookings');
  const t = T();
  const canCreate = await can('bookings', 'create');
  const canEdit = await can('bookings', 'edit');
  const from = parsePk(sp.from ?? ''), to = parsePk(sp.to ?? '');
  const rows = await db.select({ b: schema.bookings, c: schema.customers, v: schema.vehicles, d: schema.drivers.name, l: schema.locations.name })
    .from(schema.bookings)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId))
    .leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .leftJoin(schema.drivers, eq(schema.drivers.id, schema.bookings.driverId))
    .leftJoin(schema.locations, eq(schema.locations.id, schema.bookings.locationId))
    .where(and(from ? gte(schema.bookings.startAt, from) : sql`true`, to ? lt(schema.bookings.startAt, new Date(to.getTime() + 86400000)) : sql`true`,
      Number.isInteger(Number(sp.location)) && sp.location ? eq(schema.bookings.locationId, Number(sp.location)) : sql`true`, Number.isInteger(Number(sp.driver)) && sp.driver ? eq(schema.bookings.driverId, Number(sp.driver)) : sql`true`))
    .orderBy(desc(schema.bookings.createdAt));
  const q = (sp.q ?? '').toLowerCase();
  const searched = rows.filter(({ b, c, v }) => !q || `${b.id} ${b.groupId ?? ''} ${c?.name} ${c?.phone} ${c?.cnic ?? ''} ${v?.model} ${v?.regNo}`.toLowerCase().includes(q));
  const count = (s: string) => searched.filter((r) => s === 'ALL' || r.b.status === s).length;
  const status = sp.status && TABS.includes(sp.status) ? sp.status : 'ALL';
  const list = searched.filter((r) => status === 'ALL' || r.b.status === status);
  const pg = paginate(list, sp.page);
  const bal = await bookingBalances(pg.slice.map((r) => r.b.id));
  const locations = await db.select().from(schema.locations);
  const drivers = await db.select({ id: schema.drivers.id, name: schema.drivers.name }).from(schema.drivers);
  const base = { q: sp.q, status: sp.status, from: sp.from, to: sp.to, location: sp.location, driver: sp.driver };
  const now = new Date();
  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" subtitle="Create and manage all rental bookings">
        {canCreate && <Link href="/admin/bookings/new" className="btn-primary"><Plus size={16} />{t('createBooking')}</Link>}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi featured label="Pending" value={count('PENDING')} tone="yellow" icon={<Clock size={18} />} />
        <Kpi label="Confirmed" value={count('CONFIRMED')} tone="blue" icon={<CheckCircle2 size={18} />} />
        <Kpi label="In progress" value={count('IN_PROGRESS')} tone="orange" icon={<PlayCircle size={18} />} />
        <Kpi label="Completed" value={count('COMPLETED')} tone="green" icon={<Flag size={18} />} />
      </div>
      <Card>
        <form className="no-print grid gap-2 p-4 md:grid-cols-[1fr_auto_auto_auto_auto_auto]" method="get">
          {status !== 'ALL' && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={sp.q} placeholder="Search booking ID, customer, phone, CNIC, car or plate" className="input" />
          <input type="date" name="from" defaultValue={sp.from} className="input" title="From" />
          <input type="date" name="to" defaultValue={sp.to} className="input" title="To" />
          <select name="location" defaultValue={sp.location} className="input"><option value="">All locations</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
          <select name="driver" defaultValue={sp.driver} className="input"><option value="">All drivers</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <button className="btn-ghost">Filter</button>
        </form>
        <div className="no-print flex flex-wrap gap-1 border-b border-line px-4 pb-3">
          {TABS.map((s) => <Link key={s} href={href('/admin/bookings', base, { status: s === 'ALL' ? undefined : s, page: undefined })}
            className={`btn-sm btn ${status === s ? 'bg-navy text-white' : 'btn-ghost'}`}>{s === 'ALL' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()} <span className="opacity-70">({count(s)})</span></Link>)}
        </div>
        <TableWrap>
          <table className="tbl">
            <thead><tr><th>Booking ID</th><th>{t('customer')}</th><th>{t('vehicle')}</th><th>{t('driver')}</th><th>{t('location')}</th><th>{t('duration')}</th><th>{t('status')}</th><th>Total</th><th>Pending</th><th className="text-end">{t('actions')}</th></tr></thead>
            <tbody>
              {pg.slice.length === 0 && <Empty cols={10} />}
              {pg.slice.map(({ b, c, v, d, l }) => {
                const x = bal.get(b.id);
                const overdue = b.status === 'IN_PROGRESS' && b.endAt < now;
                return (
                  <tr key={b.id}>
                    <td><Link href={`/admin/bookings/${b.id}`} className="link">{b.id}</Link>{b.groupId && <span className="block text-[11px] text-muted">{b.groupId}</span>}{b.source === 'PORTAL' && <span className="badge mt-1 bg-info-soft text-info">Portal</span>}</td>
                    <td><span className="font-medium">{c?.name}</span><span className="block text-xs text-muted">{c?.phone}</span></td>
                    <td>{v?.model}{v?.regNo && <span className="mt-1 block"><Plate reg={v.regNo} /></span>}</td>
                    <td>{d ?? '—'}</td><td>{l ?? '—'}</td>
                    <td className="whitespace-nowrap text-xs">{fmtDateTime(b.startAt)}<br />{fmtDateTime(b.endAt)}</td>
                    <td>{overdue ? <Badge status="OVERDUE" label="Overdue" /> : <Badge status={b.status} />}</td>
                    <td className="font-medium">{pkr(x?.total)}</td>
                    <td className={x?.pending ? 'font-medium text-bad' : 'text-ok'}>{pkr(x?.pending)}</td>
                    <td><div className="flex justify-end gap-1">
                      <Link href={`/admin/bookings/${b.id}`} className="btn-ghost btn-sm" aria-label={`View booking ${b.id}`}><Eye size={14} aria-hidden /></Link>
                      {canEdit && !['COMPLETED', 'CANCELLED'].includes(b.status) && <Link href={`/admin/bookings/${b.id}/edit`} className="btn-ghost btn-sm" aria-label={`Edit booking ${b.id}`}><Pencil size={14} aria-hidden /></Link>}
                      <Link href={`/admin/bookings/${b.id}/print`} className="btn-ghost btn-sm" aria-label={`Print agreement for booking ${b.id}`}><Printer size={14} aria-hidden /></Link>
                    </div></td>
                  </tr>);
              })}
            </tbody>
          </table>
        </TableWrap>
        <Pagination {...pg} makeHref={(p) => href('/admin/bookings', base, { page: p })} />
      </Card>
    </div>
  );
}
