import Link from 'next/link';
import { and, desc, gte, inArray, lt, ne, sql } from 'drizzle-orm';
import { TrendingDown, TrendingUp, Wallet, CalendarCheck, Users, RefreshCw } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm } from '@/lib/auth';
import { T } from '@/lib/prefs';
import { fleetStatus, V_STATUS_LABEL } from '@/lib/calc';
import { addMonths, fmtDate, monthLabel, monthRange, pkDay, pkMonth, pkr, MONTHS } from '@/lib/format';
import { Badge, Card, Kpi, TableWrap, Empty, Avatar } from '@/components/ui';
import { LinesChart, Donut } from '@/components/Charts';

const COLORS = { AVAILABLE: '#10b981', BOOKED: '#f43f5e', RESERVED: '#38bdf8', RETURN: '#a78bfa', MAINTENANCE: '#eab308' };

export default async function Dashboard({ searchParams }: { searchParams: { day?: string; q?: string; cal?: string } }) {
  await requirePerm('dashboard');
  const t = T();
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
  const Trend = ({ a, b }: { a: number; b: number }) => { const p = pct(a, b); return <span className={p >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{p >= 0 ? <TrendingUp size={12} className="inline" /> : <TrendingDown size={12} className="inline" />} {p >= 0 ? '+' : ''}{p}% vs last month</span>; };

  // calendar for the selected month
  const calMonth = searchParams.cal ?? day.slice(0, 7);
  const first = new Date(`${calMonth}-01T00:00:00+05:00`);
  const firstWeekday = new Date(`${calMonth}-01T12:00:00+05:00`).getUTCDay();
  const daysIn = new Date(Number(calMonth.slice(0, 4)), Number(calMonth.slice(5)), 0).getDate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t('dashboard')}</h1>
        <p className="mt-1 text-sm text-muted">{t('welcome')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label={t('bookingRevenue')} value={pkr(revNow)} hint={<Trend a={revNow} b={revPrev} />} icon={<Wallet size={18} />} />
        <Kpi label={t('activeBookings')} value={active} tone="blue" hint={<Trend a={actNow} b={actPrev} />} icon={<CalendarCheck size={18} />} />
        <Kpi label={t('registeredCustomers')} value={custTotal} tone="green" hint={<Trend a={custNow} b={custPrev} />} icon={<Users size={18} />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t('revenueOverview')} className="lg:col-span-2" actions={<span className="badge bg-gold/15 text-gold">{pkr(yearTotal)}</span>}>
          <div className="p-3"><LinesChart data={series} lines={[{ key: 'revenue', name: 'Revenue', color: '#D4A52C' }]} /></div>
          <p className="px-5 pb-4 text-xs text-muted">Monthly booking revenue, {monthLabel(months[0])} – {monthLabel(month)}</p>
        </Card>
        <Card title={t('fleetStatus')}>
          <div className="p-3"><Donut center={String(nowFleet.length)} data={(['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'RESERVED', 'RETURN'] as const).map((k) => ({ name: V_STATUS_LABEL[k], value: counts(k), color: COLORS[k] }))} /></div>
          <div className="grid grid-cols-2 gap-2 px-5 pb-5 text-sm">
            {(['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'RESERVED', 'RETURN'] as const).map((k) => (
              <div key={k} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[k] }} />{V_STATUS_LABEL[k]}<span className="ms-auto font-bold">{counts(k)}</span></div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={<span>Vehicle Fleet Status <span className="ms-2 text-xs font-normal text-muted">{new Date(`${day}T12:00:00+05:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></span>}
        actions={<Link href="/admin" className="btn-ghost btn-sm"><RefreshCw size={14} /> Today</Link>}>
        <div className="grid gap-4 p-4 lg:grid-cols-[300px_1fr]">
          <div className="rounded-2xl border border-line bg-panel2 p-3">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold">
              <Link href={`/admin?day=${day}&cal=${addMonths(calMonth, -1)}`} className="rounded px-2 hover:bg-panel">‹</Link>
              {monthLabel(calMonth)}
              <Link href={`/admin?day=${day}&cal=${addMonths(calMonth, 1)}`} className="rounded px-2 hover:bg-panel">›</Link>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d} className="py-1 text-muted">{d}</span>)}
              {Array.from({ length: firstWeekday }).map((_, i) => <span key={`e${i}`} />)}
              {Array.from({ length: daysIn }, (_, i) => {
                const d = `${calMonth}-${String(i + 1).padStart(2, '0')}`;
                const on = d === day, today = d === pkDay();
                return <Link key={d} href={`/admin?day=${d}&cal=${calMonth}`} className={`rounded-lg py-1.5 ${on ? 'bg-gold font-bold text-navy-dark' : today ? 'border border-gold/60' : 'hover:bg-panel'}`}>{i + 1}</Link>;
              })}
            </div>
            <div className="mt-3 rounded-xl bg-panel p-3 text-xs">
              <p className="font-semibold">Due back on this day: {dueBack.length}</p>
              {dueBack.map((v) => <p key={v.id} className="mt-1 text-muted">{v.model} ({v.regNo}){v.booking ? ` · ${v.booking.id}` : ''}</p>)}
            </div>
          </div>
          <div>
            <form className="mb-3 flex gap-2" method="get">
              <input name="q" defaultValue={searchParams.q} placeholder="Search vehicle or reg no…" className="input" />
              <input type="date" name="day" defaultValue={day} className="input w-44" />
              <button className="btn-ghost">Go</button>
            </form>
            <div className="mb-2 text-sm font-semibold">Vehicles <span className="badge ms-1 bg-gold/15 text-gold">{list.length}</span></div>
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>Vehicle</th><th>Registration</th><th>Rate</th><th>Status</th><th>Booking</th></tr></thead>
                <tbody>
                  {list.length === 0 && <Empty cols={5} />}
                  {list.map((v) => (
                    <tr key={v.id}><td className="font-semibold">{v.model}</td><td>{v.regNo}</td><td>{pkr(v.rateDay)}/day</td>
                      <td><Badge status={v.overdue ? 'OVERDUE' : v.vstatus} label={v.overdue ? 'Overdue' : V_STATUS_LABEL[v.vstatus]} /></td>
                      <td>{v.booking ? <Link className="link" href={`/admin/bookings/${v.booking.id}`}>{v.booking.id}</Link> : '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>
        </div>
      </Card>

      <Card title={t('recentBookings')} actions={<Link href="/admin/bookings" className="link text-sm">{t('viewAll')} →</Link>}>
        <TableWrap>
          <table className="tbl">
            <thead><tr><th>Booking ID</th><th>{t('customer')}</th><th>{t('vehicle')}</th><th>{t('duration')}</th><th>{t('status')}</th><th>{t('amount')}</th></tr></thead>
            <tbody>
              {recent.length === 0 && <Empty cols={6} />}
              {recent.map(({ b, c, v, reg }) => (
                <tr key={b.id}>
                  <td><Link href={`/admin/bookings/${b.id}`} className="link">{b.id}</Link></td>
                  <td><span className="flex items-center gap-2"><Avatar name={c ?? '?'} />{c}</span></td>
                  <td>{v} <span className="text-muted">({reg})</span></td>
                  <td className="whitespace-nowrap">{fmtDate(b.startAt)} – {fmtDate(b.endAt)}</td>
                  <td><Badge status={b.status} /></td>
                  <td className="font-semibold">{pkr(b.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </div>
  );
}
