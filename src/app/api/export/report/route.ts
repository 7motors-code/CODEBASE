import { getUser, getPerms } from '@/lib/auth';
import { buildReport } from '@/lib/report';
import { fmtDate, pkDay } from '@/lib/format';

export const dynamic = 'force-dynamic';

// Text starting with = + - @ could run as a formula in Excel (CSV injection), so it is prefixed with '.
const esc = (v: unknown) => {
  let s = String(v ?? '');
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const isDay = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** CSV export of the report (opens in Excel) */
export async function GET(req: Request) {
  const u = await getUser();
  if (!u || !(await getPerms(u.role)).reports.view) return new Response('Unauthorized', { status: 401 });
  const p = new URL(req.url).searchParams;
  const from = isDay(p.get('from')) ? p.get('from')! : pkDay(), to = isDay(p.get('to')) ? p.get('to')! : pkDay();
  const r = await buildReport(from, to);
  const lines = [
    ['Seven Motors report', `${from} to ${to}`], [],
    ['Total revenue', r.revenue], ['  Booking revenue', r.bookingRevenue], ['  Fines', r.fines], ['  Damage charges', r.damage],
    ['Total expenses', r.expenses], ['  Office expenses', r.officeExpenses], ['  Maintenance', r.maintenance],
    ['Total profit', r.profit], ['Cash sales (payments received)', r.cash], ['Pending amount', r.pending], [],
    ['Pending', 'Total', 'Fine', 'Paid', 'Booking ID', 'Customer', 'Car', 'Plate', 'Location', 'Status', 'Date'],
    ...r.rows.map((x) => [x.bal.pending, x.bal.total, x.bal.fine, x.bal.paid, x.b.id, x.c, x.v?.model, x.v?.regNo, x.l, x.b.status, fmtDate(x.b.startAt)]),
  ];
  const csv = '﻿' + lines.map((l) => l.map(esc).join(',')).join('\r\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="report-${from}-to-${to}.csv"` } });
}
