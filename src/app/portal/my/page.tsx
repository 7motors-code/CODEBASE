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
    <div className="card mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold">My bookings</h1>
      <p className="mb-4 text-sm text-muted">Sign in with the phone number and CNIC you gave the office.</p>
      {searchParams.err && <p className="mb-3 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-300">{searchParams.err === 'locked' ? 'Too many attempts. Please wait 15 minutes and try again.' : 'Phone and CNIC did not match our records.'}</p>}
      <form action={portalLogin} className="space-y-3">
        <label className="block"><span className="label">Phone</span><input name="phone" required className="input" /></label>
        <label className="block"><span className="label">CNIC</span><input name="cnic" required className="input" placeholder="00000-0000000-0" /></label>
        <Submit className="btn-gold w-full">View my bookings</Submit>
      </form>
    </div>);
  const rows = await db.select({ b: schema.bookings, v: schema.vehicles }).from(schema.bookings).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId)).where(eq(schema.bookings.customerId, s.customerId)).orderBy(desc(schema.bookings.startAt));
  const bal = await bookingBalances(rows.map((r) => r.b.id));
  const dmg = await db.select().from(schema.damages).where(eq(schema.damages.customerId, s.customerId));
  const dPaid = await damagePaid(dmg.map((d) => d.id));
  let due = 0; bal.forEach((x) => (due += x.pending)); dmg.filter((d) => d.status === 'PENDING').forEach((d) => (due += Math.max(0, d.estimatedCost - (dPaid.get(d.id) ?? 0))));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Salam, {s.name}</h1><form action={portalLogout}><button className="btn-ghost btn-sm">Sign out</button></form></div>
      {searchParams.requested && <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">Request {searchParams.requested} sent. Our team will call you to confirm.</p>}
      <div className="card p-4"><p className="text-sm text-muted">Amount due</p><p className="text-2xl font-extrabold text-rose-400">{pkr(due)}</p></div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-muted">No bookings yet.</p>}
        {rows.map(({ b, v }) => { const x = bal.get(b.id)!; return (
          <div key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
            <div><p className="font-bold">{v?.model} <span className="text-sm text-muted">({v?.regNo})</span></p><p className="text-xs text-muted">{b.id}</p><p className="text-sm">{fmtDateTime(b.startAt)} → {fmtDateTime(b.endAt)}</p></div>
            <div className="ms-auto text-end"><Badge status={b.status} /><p className="mt-1 text-sm">Total {pkr(x.total + x.fine)} · Paid {pkr(x.paid)}</p>{x.pending > 0 && <p className="text-sm font-semibold text-rose-400">Due {pkr(x.pending)}</p>}</div>
          </div>); })}
        {dmg.map((d) => <div key={d.id} className="card flex items-center justify-between p-4 text-sm"><span>Damage: {d.damageType} ({d.bookingId})</span><span>{pkr(d.estimatedCost)} <Badge status={d.status} /></span></div>)}
      </div>
    </div>
  );
}
