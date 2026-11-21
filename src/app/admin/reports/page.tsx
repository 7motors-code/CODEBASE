import Link from 'next/link';
import { Download } from 'lucide-react';
import { requirePerm } from '@/lib/auth';
import { getSetting } from '@/lib/calc';
import { buildReport } from '@/lib/report';
import { fmtDate, pkDay, pkr } from '@/lib/format';
import { T } from '@/lib/prefs';
import { Badge, Card, PageHeader, Pagination, TableWrap, Empty, href, paginate } from '@/components/ui';
import { PrintButton } from '@/components/client';
import { LinesChart } from '@/components/Charts';

const Tile = ({ label, value, cls }: { label: string; value: React.ReactNode; cls: string }) => (
  <div className={`rounded-2xl p-4 text-white shadow ${cls}`}><p className="text-xs font-semibold uppercase opacity-90">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>);

export default async function ReportsPage({ searchParams: sp }: { searchParams: { from?: string; to?: string; page?: string } }) {
  await requirePerm('reports');
  const t = T();
  const today = pkDay();
  const from = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : today;
  const to = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : from > today ? from : today;
  const r = await buildReport(from, to);
  const business = await getSetting('business_name', 'Seven Motors');
  const pg = paginate(r.rows, sp.page, 20);
  return (
    <div className="space-y-6">
      <PageHeader title={business} subtitle={from === to ? `Daily summary report · ${fmtDate(from)}` : `Summary report · ${fmtDate(from)} – ${fmtDate(to)}`}>
        <a href={`/api/export/report?from=${from}&to=${to}`} className="btn-ghost"><Download size={16} /> Excel (CSV)</a>
        <PrintButton label="Print / PDF" />
      </PageHeader>
      <form method="get" className="no-print card flex flex-wrap items-center gap-2 p-3">
        <input type="date" name="from" defaultValue={from} className="input w-auto" /><span className="text-muted">–</span><input type="date" name="to" defaultValue={to} className="input w-auto" />
        <button className="btn-gold">{t('apply')}</button>
        <div className="ms-auto flex flex-wrap gap-1 text-xs">
          <Link className="btn-ghost btn-sm" href="/admin/reports">Today</Link>
          <Link className="btn-ghost btn-sm" href={`/admin/reports?from=${today.slice(0, 8)}01&to=${today}`}>This month</Link>
          <Link className="btn-ghost btn-sm" href={`/admin/reports?from=${today.slice(0, 4)}-01-01&to=${today}`}>This year</Link>
        </div>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={t('totalRevenue')} value={pkr(r.revenue)} cls="bg-gradient-to-br from-emerald-400 to-emerald-600" />
        <Tile label={t('totalExpenses')} value={pkr(r.expenses)} cls="bg-gradient-to-br from-rose-400 to-rose-600" />
        <Tile label={t('totalProfit')} value={pkr(r.profit)} cls="bg-gradient-to-br from-violet-400 to-violet-600" />
        <Tile label={t('cashSales')} value={pkr(r.cash)} cls="bg-gradient-to-br from-green-500 to-teal-600" />
        <Tile label="This month's sales" value={pkr(r.monthSales)} cls="bg-gradient-to-br from-indigo-500 to-purple-700" />
        <Tile label="Pending amount" value={pkr(r.pending)} cls="bg-gradient-to-br from-cyan-500 to-sky-700" />
        <Tile label="Total vehicles" value={r.vehicles} cls="bg-gradient-to-br from-orange-400 to-orange-600" />
        <Tile label="Total drivers" value={r.drivers} cls="bg-gradient-to-br from-cyan-400 to-cyan-600" />
        <Tile label="Maintenance vehicles" value={r.maintenanceVehicles} cls="bg-gradient-to-br from-yellow-400 to-amber-500" />
      </div>
      <p className="text-xs text-muted">Revenue = bookings {pkr(r.bookingRevenue)} + fines {pkr(r.fines)} + damage {pkr(r.damage)}. Expenses = office {pkr(r.officeExpenses)} + maintenance {pkr(r.maintenance)}. Cash sales = payments actually received.</p>
      <Card title={`Monthly revenue vs. expenses (YTD ${r.year})`}><div className="p-3"><LinesChart data={r.ytd} lines={[{ key: 'revenue', name: 'Revenue', color: '#10b981' }, { key: 'expenses', name: 'Expenses', color: '#f43f5e' }]} height={300} /></div></Card>
      <Card title="Payment details">
        <TableWrap><table className="tbl">
          <thead><tr><th>Pending</th><th>Total</th><th>Paid</th><th>Booking ID</th><th>Customer</th><th>Car</th><th>Location</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {pg.slice.length === 0 && <Empty cols={9} />}
            {pg.slice.map(({ b, c, v, l, bal }) => <tr key={b.id}><td className={bal.pending ? 'text-rose-400' : ''}>{pkr(bal.pending)}</td><td>{pkr(bal.total + bal.fine)}</td><td>{pkr(bal.paid)}</td><td><Link className="link font-mono text-xs" href={`/admin/bookings/${b.id}`}>{b.id}</Link></td><td>{c}</td><td>{v?.model} ({v?.regNo})</td><td>{l ?? '—'}</td><td><Badge status={b.status} /></td><td>{fmtDate(b.startAt)}</td></tr>)}
          </tbody></table></TableWrap>
        <Pagination {...pg} makeHref={(p) => href('/admin/reports', { from, to }, { page: p })} />
      </Card>
    </div>
  );
}
