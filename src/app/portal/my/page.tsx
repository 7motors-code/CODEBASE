import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getPortal } from '@/lib/auth';
import { bookingBalances, damagePaid } from '@/lib/calc';

export const dynamic = 'force-dynamic';
import { fmtDateTime, pkr } from '@/lib/format';
import { Badge } from '@/components/ui';
import { Submit } from '@/components/client';
import { portalLogin, portalLogout } from '../actions';

export default async function MyBookings({ searchParams }: { searchParams: { err?: string; requested?: string } }) {
  const s = await getPortal();
  if (!s) return (
    <div className="card mx-auto max-w-md p-6 sm:p-8">
      <h1 className="text-[22px] font-medium text-ink">My bookings</h1>
      <p className="mb-6 mt-1.5 text-sm text-ink2">Sign in with the phone number and CNIC you gave the office.</p>
      {searchParams.err && <p className="mb-3 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">{searchParams.err === 'locked' ? 'Too many attempts. Please wait 15 minutes and try again.' : 'Phone and CNIC did not match our records.'}</p>}
      <form action={portalLogin} className="space-y-3">
        <label className="block"><span className="label">Phone</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="input font-mono" /></label>
        <label className="block"><span className="label">CNIC</span><input name="cnic" required className="input" placeholder="00000-0000000-0" /></label>
        <Submit className="btn-primary btn-lg w-full">View my bookings</Submit>
      </form>
    </div>);
  const rows = await db.select({ b: schema.bookings, v: schema.vehicles }).from(schema.bookings).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId)).where(eq(schema.bookings.customerId, s.customerId)).orderBy(desc(schema.bookings.startAt));
  const bal = await bookingBalances(rows.map((r) => r.b.id));
  const dmg = await db.select().from(schema.damages).where(eq(schema.damages.customerId, s.customerId));
  const dPaid = await damagePaid(dmg.map((d) => d.id));
  let due = 0; bal.forEach((x) => (due += x.pending)); dmg.filter((d) => d.status === 'PENDING').forEach((d) => (due += Math.max(0, d.estimatedCost - (dPaid.get(d.id) ?? 0))));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-[28px] font-medium tracking-[-0.01em] text-ink">My bookings</h1><p className="mt-1 text-sm text-ink2">{s.name}</p></div><form action={portalLogout}><button className="btn-ghost btn-sm">Sign out</button></form></div>
      {searchParams.requested && <p className="rounded-xl bg-ok-soft px-4 py-3 text-sm text-ok">Request {searchParams.requested} sent. Our team will call you to confirm.</p>}
      <div className="card px-5 py-4"><p className="text-[13px] text-ink2">Amount due</p><p className={`mt-2 font-mono text-[26px] font-medium leading-none tabular-nums ${due > 0 ? 'text-bad' : 'text-ink'}`}>{pkr(due)}</p></div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-muted">No bookings yet</p>}
        {rows.map(({ b, v }) => { const x = bal.get(b.id)!; return (
          <div key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
            <div><p className="font-medium">{v?.model} <span className="text-sm text-muted">({v?.regNo})</span></p><p className="text-xs text-muted">{b.id}</p><p className="text-sm">{fmtDateTime(b.startAt)} → {fmtDateTime(b.endAt)}</p></div>
            <div className="ms-auto text-end"><Badge status={b.status} /><p className="mt-1 text-sm">Total {pkr(x.total + x.fine)} · Paid {pkr(x.paid)}</p>{x.pending > 0 && <p className="text-sm font-medium text-bad">Due {pkr(x.pending)}</p>}</div>
          </div>); })}
        {dmg.map((d) => <div key={d.id} className="card flex items-center justify-between p-4 text-sm"><span>Damage: {d.damageType} ({d.bookingId})</span><span>{pkr(d.estimatedCost)} <Badge status={d.status} /></span></div>)}
      </div>
    </div>
  );
}
