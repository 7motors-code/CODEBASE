import Link from 'next/link';
import { Download } from 'lucide-react';
import { requirePerm } from '@/lib/auth';
import { getSetting } from '@/lib/calc';
import { buildReport } from '@/lib/report';
import { fmtDate, pkDay, pkr } from '@/lib/format';
import { T } from '@/lib/prefs';
import { Badge, Card, PageHeader, Pagination, TableWrap, Empty, href, paginate, Kpi } from '@/components/ui';
import { PrintButton } from '@/components/client';
import { LinesChart } from '@/components/Charts';

const Tile = ({ label, value, tone, featured }: { label: string; value: React.ReactNode; tone?: 'green' | 'rose' | 'gold'; featured?: boolean }) => {
  if (featured) return <Kpi featured label={label} value={value} />;
  const ink = tone === 'rose' ? 'text-bad' : 'text-ink';
  return (
    <div className="card px-5 py-4">
      <p className="text-[13px] font-medium text-ink2">{label}</p>
      <p className={`mt-2 font-mono text-[24px] font-semibold leading-none tabular-nums ${ink}`}>{value}</p>
    </div>
  );
};

export default async function ReportsPage({ searchParams: sp }: { searchParams: { from?: string; to?: string; page?: string } }) {
  await requirePerm('reports');
  const t = T();
  const today = pkDay();
  const from = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : today;
  const to = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : from > today ? from : today;
  const [r, business] = await Promise.all([buildReport(from, to), getSetting('business_name', 'Seven Motors')]);
  const pg = paginate(r.rows, sp.page, 20);
  return (
    <div className="space-y-6">
      <PageHeader title={business} subtitle={from === to ? `Daily summary report · ${fmtDate(from)}` : `Summary report · ${fmtDate(from)} – ${fmtDate(to)}`}>
        <a href={`/api/export/report?from=${from}&to=${to}`} className="btn-ghost"><Download size={16} /> Excel (CSV)</a>
        <PrintButton label="Print / PDF" />
      </PageHeader>
      <form method="get" className="no-print card flex flex-wrap items-center gap-2 p-3">
        <input type="date" name="from" defaultValue={from} className="input w-auto" /><span className="text-muted">–</span><input type="date" name="to" defaultValue={to} className="input w-auto" />
        <button className="btn-primary">{t('apply')}</button>
        <div className="ms-auto flex flex-wrap gap-1 text-xs">
          <Link className="btn-ghost btn-sm" href="/admin/reports">Today</Link>
          <Link className="btn-ghost btn-sm" href={`/admin/reports?from=${today.slice(0, 8)}01&to=${today}`}>This month</Link>
          <Link className="btn-ghost btn-sm" href={`/admin/reports?from=${today.slice(0, 4)}-01-01&to=${today}`}>This year</Link>
        </div>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile featured label={t('totalRevenue')} value={pkr(r.revenue)} tone="green" />
        <Tile label={t('totalExpenses')} value={pkr(r.expenses)} tone="rose" />
        <Tile label={t('totalProfit')} value={pkr(r.profit)} tone="green" />
        <Tile label={t('cashSales')} value={pkr(r.cash)} tone="gold" />
        <Tile label="This month's sales" value={pkr(r.monthSales)} />
        <Tile label="Pending amount" value={pkr(r.pending)} tone="rose" />
        <Tile label="Total vehicles" value={r.vehicles} />
        <Tile label="Total drivers" value={r.drivers} />
        <Tile label="Maintenance vehicles" value={r.maintenanceVehicles} tone="rose" />
      </div>
      <p className="text-xs text-muted">Revenue = bookings {pkr(r.bookingRevenue)} + fines {pkr(r.fines)} + damage {pkr(r.damage)}. Expenses = office {pkr(r.officeExpenses)} + maintenance {pkr(r.maintenance)}. Cash sales = payments actually received.</p>
      <Card title={`Monthly revenue vs. expenses (YTD ${r.year})`}><div className="p-3"><LinesChart title={`Monthly revenue vs. expenses, ${r.year}`} data={r.ytd} lines={[{ key: 'revenue', name: 'Revenue', color: '#10b981' }, { key: 'expenses', name: 'Expenses', color: '#f43f5e' }]} height={300} /></div></Card>
      <Card title="Payment details">
        <TableWrap><table className="tbl">
          <thead><tr><th>Pending</th><th>Total</th><th>Paid</th><th>Booking ID</th><th>Customer</th><th>Car</th><th>Location</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {pg.slice.length === 0 && <Empty cols={9} />}
            {pg.slice.map(({ b, c, v, l, bal }) => <tr key={b.id}><td className={bal.pending ? 'text-bad' : ''}>{pkr(bal.pending)}</td><td>{pkr(bal.total + bal.fine)}</td><td>{pkr(bal.paid)}</td><td><Link className="link font-mono text-xs" href={`/admin/bookings/${b.id}`}>{b.id}</Link></td><td>{c}</td><td>{v?.model} ({v?.regNo})</td><td>{l ?? '—'}</td><td><Badge status={b.status} /></td><td>{fmtDate(b.startAt)}</td></tr>)}
          </tbody></table></TableWrap>
        <Pagination {...pg} makeHref={(p) => href('/admin/reports', { from, to }, { page: p })} />
      </Card>
    </div>
  );
}
