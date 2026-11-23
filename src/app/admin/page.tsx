import Link from 'next/link';
import { and, desc, gte, inArray, lt, ne, sql } from 'drizzle-orm';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db, schema } from '@/db';
import { can, requirePerm } from '@/lib/auth';
import { T } from '@/lib/prefs';
import { fleetStatus, V_STATUS_LABEL } from '@/lib/calc';
import { addMonths, fmtDate, monthLabel, monthRange, pkDay, pkMonth, pkr, MONTHS } from '@/lib/format';
import { Badge, Card, Kpi, TableWrap, Empty, Avatar, Plate } from '@/components/ui';
import { LinesChart } from '@/components/Charts';

const FLEET_ORDER = ['AVAILABLE', 'BOOKED', 'RESERVED', 'RETURN', 'MAINTENANCE'] as const;
const FLEET_COLOR: Record<(typeof FLEET_ORDER)[number], string> = {
  AVAILABLE: 'bg-ok', BOOKED: 'bg-navy', RESERVED: 'bg-info', RETURN: 'bg-[#7C97C2]', MAINTENANCE: 'bg-warn',
};

export default async function Dashboard({ searchParams }: { searchParams: { day?: string; q?: string; cal?: string } }) {
  await requirePerm('dashboard');
  const t = T();
  const canBook = await can('bookings', 'create');
  const month = pkMonth();
  const cur = monthRange(month), prev = monthRange(addMonths(month, -1));
  const months = Array.from({ length: 12 }, (_, i) => addMonths(month, i - 11));
  const yearStart = monthRange(months[0]).start;
  const yearEnd = cur.end;

  const [monthlyStats, [activeRow], [custStats]] = await Promise.all([
    db.select({
      m: sql<string>`to_char(${schema.bookings.startAt} AT TIME ZONE 'Asia/Karachi', 'YYYY-MM')`,
      rev: sql<number>`coalesce(sum(${schema.bookings.totalAmount}),0)::int`,
      n: sql<number>`count(*)::int`,
    }).from(schema.bookings)
      .where(and(ne(schema.bookings.status, 'CANCELLED'), gte(schema.bookings.startAt, yearStart), lt(schema.bookings.startAt, yearEnd)))
      .groupBy(sql`1`),
    db.select({
      active: sql<number>`count(*) filter (where ${schema.bookings.status} in ('CONFIRMED', 'IN_PROGRESS'))::int`,
      actNow: sql<number>`count(*) filter (where ${schema.bookings.status} in ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED') and ${schema.bookings.createdAt} >= ${cur.start} and ${schema.bookings.createdAt} < ${cur.end})::int`,
      actPrev: sql<number>`count(*) filter (where ${schema.bookings.status} in ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED') and ${schema.bookings.createdAt} >= ${prev.start} and ${schema.bookings.createdAt} < ${prev.end})::int`,
    }).from(schema.bookings),
    db.select({
      total: sql<number>`count(*)::int`,
      now: sql<number>`count(*) filter (where ${schema.customers.createdAt} >= ${cur.start})::int`,
      prev: sql<number>`count(*) filter (where ${schema.customers.createdAt} >= ${prev.start} and ${schema.customers.createdAt} < ${prev.end})::int`,
    }).from(schema.customers),
  ]);

  const series = months.map((m) => {
    const x = monthlyStats.find((s) => s.m === m);
    return { label: MONTHS[Number(m.slice(5)) - 1], revenue: x?.rev ?? 0, bookings: x?.n ?? 0 };
  });
  const yearTotal = series.reduce((s, x) => s + x.revenue, 0);
  const revNow = series[11].revenue;
  const revPrev = series[10].revenue;
  const active = activeRow?.active ?? 0;
  const actNow = activeRow?.actNow ?? 0;
  const actPrev = activeRow?.actPrev ?? 0;
  const custTotal = custStats?.total ?? 0;
  const custNow = custStats?.now ?? 0;
  const custPrev = custStats?.prev ?? 0;

  const nowFleet = await fleetStatus();
  const counts = (k: string) => nowFleet.filter((v) => v.vstatus === k).length;
  const day = searchParams.day && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.day) ? searchParams.day : pkDay();
  const dayFleet = day === pkDay() ? nowFleet : await fleetStatus(day);
  const q = (searchParams.q ?? '').toLowerCase();
  const list = dayFleet.filter((v) => !q || `${v.model} ${v.regNo}`.toLowerCase().includes(q));
  const dueBack = dayFleet.filter((v) => v.vstatus === 'RETURN');

  const recent = await db.select({ b: schema.bookings, c: schema.customers.name, v: schema.vehicles.model, reg: schema.vehicles.regNo })
    .from(schema.bookings).leftJoin(schema.customers, sql`${schema.customers.id} = ${schema.bookings.customerId}`)
    .leftJoin(schema.vehicles, sql`${schema.vehicles.id} = ${schema.bookings.vehicleId}`).orderBy(desc(schema.bookings.createdAt)).limit(8);

  const pct = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100));
  const Trend = ({ a, b }: { a: number; b: number }) => {
    const p = pct(a, b);
    return <span><span className={`font-mono tabular-nums ${p > 0 ? 'text-ok' : p < 0 ? 'text-bad' : 'text-ink2'}`}><bdi dir="ltr">{p >= 0 ? '+' : ''}{p}%</bdi></span> vs last month</span>;
  };

  // calendar for the selected month
  const calMonth = searchParams.cal ?? day.slice(0, 7);
  const first = new Date(`${calMonth}-01T00:00:00+05:00`);
  const firstWeekday = new Date(`${calMonth}-01T12:00:00+05:00`).getUTCDay();
  const daysIn = new Date(Number(calMonth.slice(0, 4)), Number(calMonth.slice(5)), 0).getDate();

  const dayLabel = new Date(`${day}T12:00:00+05:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fleetTotal = nowFleet.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.025em] text-ink">{t('dashboard')}</h1>
          <p className="mt-1.5 text-sm text-ink2">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' })}</p>
        </div>
        {canBook && <Link href="/admin/bookings/new" className="btn-primary">{t('createBooking')}</Link>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi featured label={t('bookingRevenue')} value={pkr(revNow)} hint={<Trend a={revNow} b={revPrev} />} />
        <Kpi label={t('activeBookings')} value={active} hint={<Trend a={actNow} b={actPrev} />} />
        <Kpi label="Cars available now" value={<>{counts('AVAILABLE')}<span className="text-base text-muted"> / {fleetTotal}</span></>} hint={`${counts('BOOKED')} on rent · ${counts('MAINTENANCE')} in the workshop`} />
        <Kpi label={t('registeredCustomers')} value={custTotal} hint={<Trend a={custNow} b={custPrev} />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t('revenueOverview')} className="lg:col-span-2" actions={<span className="font-mono text-sm tabular-nums text-ink2">{pkr(yearTotal)}</span>}>
          <div className="px-3 pb-2 pt-4"><LinesChart data={series} lines={[{ key: 'revenue', name: 'Revenue', color: '#0B2A5B' }]} /></div>
          <p className="px-5 pb-4 text-[13px] text-muted">{monthLabel(months[0])} – {monthLabel(month)}, cancelled bookings excluded</p>
        </Card>
        <Card title={t('fleetStatus')} actions={<span className="font-mono text-sm tabular-nums text-ink2">{fleetTotal} cars</span>}>
          <div className="p-5">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-panel2" role="img" aria-label="Fleet split by status">
              {FLEET_ORDER.map((k) => counts(k) > 0 && (
                <span key={k} className={`${FLEET_COLOR[k]} h-full border-e-2 border-panel last:border-e-0`} style={{ width: `${(counts(k) / Math.max(1, fleetTotal)) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-5 divide-y divide-line">
              {FLEET_ORDER.map((k) => (
                <li key={k} className="flex h-11 items-center gap-3 text-sm">
                  <span className={`h-2 w-2 rounded-full ${FLEET_COLOR[k]}`} />
                  <span className="text-ink2">{V_STATUS_LABEL[k]}</span>
                  <span className="ms-auto font-mono tabular-nums text-ink">{counts(k)}</span>
                  <span className="w-12 text-end font-mono text-[13px] tabular-nums text-muted">{fleetTotal ? Math.round((counts(k) / fleetTotal) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card title={<span>Fleet by day <span className="ms-2 text-[13px] font-normal text-muted">{dayLabel}</span></span>}
        actions={day !== pkDay() ? <Link href="/admin" className="btn-ghost btn-sm">Back to today</Link> : undefined}>
        <div className="grid gap-6 p-5 lg:grid-cols-[288px_1fr]">
          <div>
            <div className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <Link href={`/admin?day=${day}&cal=${addMonths(calMonth, -1)}`} className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-panel2 hover:text-ink" aria-label="Previous month"><ChevronLeft size={16} strokeWidth={1.5} className="rtl:rotate-180" /></Link>
                <span className="text-sm font-medium text-ink">{monthLabel(calMonth)}</span>
                <Link href={`/admin?day=${day}&cal=${addMonths(calMonth, 1)}`} className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-panel2 hover:text-ink" aria-label="Next month"><ChevronRight size={16} strokeWidth={1.5} className="rtl:rotate-180" /></Link>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[13px]">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d} className="py-1.5 text-xs text-muted">{d}</span>)}
                {Array.from({ length: firstWeekday }).map((_, i) => <span key={`e${i}`} />)}
                {Array.from({ length: daysIn }, (_, i) => {
                  const d = `${calMonth}-${String(i + 1).padStart(2, '0')}`;
                  const on = d === day, today = d === pkDay();
                  return (
                    <Link key={d} href={`/admin?day=${d}&cal=${calMonth}`} aria-current={on ? 'date' : undefined}
                      className={`flex h-8 items-center justify-center rounded-md font-mono tabular-nums transition-colors duration-150 ${on ? 'bg-navy text-white' : today ? 'font-medium text-navy ring-1 ring-inset ring-navy/30' : 'text-ink2 hover:bg-panel2'}`}>
                      {i + 1}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-panel2/70 p-4">
              <p className="text-sm text-ink">Due back <span className="font-mono tabular-nums text-ink2">{dueBack.length}</span></p>
              {dueBack.length === 0 && <p className="mt-1 text-[13px] text-muted">No returns on this day</p>}
              {dueBack.map((v) => <p key={v.id} className="mt-1.5 text-[13px] text-ink2">{v.model} <span className="font-mono text-muted">{v.regNo}</span></p>)}
            </div>
          </div>
          <div className="min-w-0">
            <form className="mb-4 flex flex-wrap gap-2" method="get">
              <input name="q" type="search" defaultValue={searchParams.q} placeholder="Vehicle or registration" className="input max-w-xs flex-1" />
              <input type="date" name="day" defaultValue={day} className="input w-44 font-mono" />
              <button className="btn-ghost">Show</button>
            </form>
            <div className="overflow-hidden rounded-xl border border-line">
              <TableWrap>
                <table className="tbl">
                  <thead><tr><th>Vehicle</th><th>Registration</th><th className="!text-end">Day rate</th><th>Status</th><th>Booking</th></tr></thead>
                  <tbody>
                    {list.length === 0 && <Empty cols={5} />}
                    {list.map((v) => (
                      <tr key={v.id}>
                        <td className="font-medium">{v.model}</td>
                        <td><Plate reg={v.regNo} /></td>
                        <td className="text-end font-mono tabular-nums">{pkr(v.rateDay)}</td>
                        <td><Badge status={v.overdue ? 'OVERDUE' : v.vstatus} label={v.overdue ? 'Overdue' : V_STATUS_LABEL[v.vstatus]} /></td>
                        <td>{v.booking ? <Link className="link font-mono" href={`/admin/bookings/${v.booking.id}`}>{v.booking.id}</Link> : <span className="text-muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </div>
        </div>
      </Card>

      <Card title={t('recentBookings')} actions={<Link href="/admin/bookings" className="btn-quiet btn-sm">{t('viewAll')}</Link>}>
        <TableWrap>
          <table className="tbl">
            <thead><tr><th>Booking</th><th>{t('customer')}</th><th>{t('vehicle')}</th><th>{t('duration')}</th><th>{t('status')}</th><th className="!text-end">{t('amount')}</th></tr></thead>
            <tbody>
              {recent.length === 0 && <Empty cols={6} />}
              {recent.map(({ b, c, v, reg }) => (
                <tr key={b.id}>
                  <td><Link href={`/admin/bookings/${b.id}`} className="link font-mono">{b.id}</Link></td>
                  <td><span className="flex items-center gap-2.5"><Avatar name={c ?? '?'} />{c}</span></td>
                  <td>{v} {reg && <span className="ms-1 font-mono text-[13px] text-muted">{reg}</span>}</td>
                  <td className="whitespace-nowrap text-ink2">{fmtDate(b.startAt)} – {fmtDate(b.endAt)}</td>
                  <td><Badge status={b.status} /></td>
                  <td className="text-end font-mono tabular-nums">{pkr(b.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </div>
  );
}
