import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getPortal } from '@/lib/auth';
import { bookingBalances, damagePaid } from '@/lib/calc';
import { fmtDateTime, pkr } from '@/lib/format';
import { Badge } from '@/components/ui';
import { portalLogout } from '../actions';
import { LoginForm } from '../LoginForm';

export const dynamic = 'force-dynamic';

/** Only confirmed or running work is money the customer owes; a request is not a bill yet. */
const BILLED = new Set(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']);

export default async function MyBookings({ searchParams }: { searchParams: { requested?: string } }) {
  const s = await getPortal();
  const requested = searchParams.requested && /^BK-[0-9A-F-]{6,40}$/i.test(searchParams.requested) ? searchParams.requested : null;
  if (!s) return (
    <div className="card mx-auto max-w-md p-6 sm:p-8">
      <h1 className="text-[22px] font-medium text-ink">My bookings</h1>
      {requested && <p role="status" className="mt-3 rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">Request {requested} sent. The office will call you to confirm. Sign in below to follow it.</p>}
      <p className="mb-6 mt-1.5 text-sm text-ink2">Sign in with the mobile number and CNIC you gave the office.</p>
      <LoginForm />
    </div>);

  const [rows, dmg] = await Promise.all([
    db.select({ b: schema.bookings, v: schema.vehicles }).from(schema.bookings).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
      .where(eq(schema.bookings.customerId, s.customerId)).orderBy(desc(schema.bookings.startAt)),
    db.select().from(schema.damages).where(eq(schema.damages.customerId, s.customerId)),
  ]);
  const [bal, dPaid] = await Promise.all([bookingBalances(rows.map((r) => r.b.id)), damagePaid(dmg.map((d) => d.id))]);
  let due = 0;
  rows.forEach(({ b }) => { if (BILLED.has(b.status)) due += bal.get(b.id)?.pending ?? 0; });
  dmg.filter((d) => d.status === 'PENDING').forEach((d) => (due += Math.max(0, d.estimatedCost - (dPaid.get(d.id) ?? 0))));
  const awaiting = rows.filter(({ b }) => b.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-[28px] font-medium tracking-[-0.01em] text-ink">My bookings</h1><p className="mt-1 text-sm text-ink2">{s.name}</p></div>
        <form action={portalLogout}><button className="btn-ghost btn-sm">Sign out</button></form>
      </div>
      {requested && <p role="status" className="rounded-xl bg-ok-soft px-4 py-3 text-sm text-ok">Request {requested} sent. Our team will call you to confirm.</p>}
      <div className="card px-5 py-4">
        <p className="text-[13px] text-ink2">Amount due</p>
        <p className={`mt-2 font-mono text-[26px] font-medium leading-none tabular-nums ${due > 0 ? 'text-bad' : 'text-ink'}`}><bdi dir="ltr">{pkr(due)}</bdi></p>
        {awaiting > 0 && <p className="mt-2 text-[13px] text-ink2">{awaiting} request{awaiting === 1 ? '' : 's'} awaiting confirmation, not included above.</p>}
      </div>
      <h2 className="sr-only">Bookings</h2>
      <ul className="space-y-3">
        {rows.length === 0 && <li className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-ink2">No bookings yet</li>}
        {rows.map(({ b, v }) => {
          const x = bal.get(b.id);
          const billed = BILLED.has(b.status);
          return (
            <li key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0">
                <p className="font-medium">{v?.model ?? 'Vehicle'}{v?.regNo && <span className="text-sm text-ink2"> ({v.regNo})</span>}</p>
                <p className="font-mono text-xs text-ink2">{b.id}</p>
                <p className="text-sm"><bdi dir="ltr">{fmtDateTime(b.startAt)}</bdi> <span aria-hidden className="inline-block rtl:rotate-180">→</span><span className="sr-only">to</span> <bdi dir="ltr">{fmtDateTime(b.endAt)}</bdi></p>
              </div>
              <div className="ms-auto text-end">
                <Badge status={b.status} />
                {x && <p className="mt-1 text-sm">Total <bdi dir="ltr">{pkr(x.total + x.fine)}</bdi> · Paid <bdi dir="ltr">{pkr(x.paid)}</bdi></p>}
                {billed && x && x.pending > 0 && <p className="text-sm font-medium text-bad">Due <bdi dir="ltr">{pkr(x.pending)}</bdi></p>}
                {b.status === 'PENDING' && <p className="text-sm text-ink2">Awaiting confirmation</p>}
              </div>
            </li>);
        })}
        {dmg.map((d) => (
          <li key={d.id} className="card flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="min-w-0">Damage: {d.damageType} <span className="font-mono text-xs text-ink2">({d.bookingId})</span></span>
            <span className="flex items-center gap-2"><bdi dir="ltr">{pkr(d.estimatedCost)}</bdi> <Badge status={d.status} /></span>
          </li>))}
      </ul>
    </div>
  );
}
