import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { Search, Printer, Eye } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { bookingBalances, getSetting, lateFine } from '@/lib/calc';
import { fmtDateTime, pkInput, pkr } from '@/lib/format';
import { Badge, Card, Field, PageHeader, Pagination, TableWrap, Empty, paginate } from '@/components/ui';
import { ImageInput, Submit } from '@/components/client';
import { receiveVehicle } from './actions';

export default async function Receiving({ searchParams: sp }: { searchParams: { q?: string; booking?: string; err?: string; done?: string; page?: string } }) {
  await requirePerm('receiving');
  const canCreate = await can('receiving', 'create');
  const open = await db.select({ b: schema.bookings, c: schema.customers, v: schema.vehicles }).from(schema.bookings)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId)).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .where(eq(schema.bookings.status, 'IN_PROGRESS')).orderBy(schema.bookings.endAt);
  const q = (sp.q ?? '').toLowerCase().replace(/\s/g, '');
  const matches = open.filter(({ b, c, v }) => !q || `${b.id}${b.groupId ?? ''}${c?.phone}${c?.cnic ?? ''}${(c?.cnic ?? '').replace(/-/g, '')}${v?.model}${v?.regNo}`.toLowerCase().replace(/\s/g, '').includes(q));
  const sel = sp.booking ? open.find((r) => r.b.id === sp.booking) : matches.length === 1 && q ? matches[0] : undefined;
  const grace = Number(await getSetting('fine_grace_hours', '1'));
  const now = new Date();
  const suggested = sel && sel.v ? lateFine(sel.v, sel.b.durationType, sel.b.endAt, now, grace) : null;
  const bal = sel ? (await bookingBalances([sel.b.id])).get(sel.b.id)! : null;

  const received = await db.select({ r: schema.receivings, b: schema.bookings, c: schema.customers.name, v: schema.vehicles }).from(schema.receivings)
    .leftJoin(schema.bookings, eq(schema.bookings.id, schema.receivings.bookingId)).leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId))
    .leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId)).orderBy(desc(schema.receivings.receivedAt));
  const pg = paginate(received, sp.page, 10);
  return (
    <div className="space-y-6">
      <PageHeader title="Vehicle Receiving" subtitle="Check in a returned car against its booking" />
      {sp.done && <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">Booking {sp.done} received and completed. The car is available again. <Link className="link" href={`/admin/bookings/${sp.done}`}>Open booking</Link></p>}
      {sp.err && <p className="rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-300">{sp.err}</p>}
      <Card title="Search booking">
        <form className="flex gap-2 p-4" method="get">
          <input name="q" defaultValue={sp.q} placeholder="Booking ID, phone, CNIC, car name or plate no…" className="input" autoFocus />
          <button className="btn-gold"><Search size={16} /> Search</button>
        </form>
        {!sel && (
          <div className="px-4 pb-4">
            <p className="mb-2 text-xs text-muted">{q ? `${matches.length} match(es)` : `${open.length} car(s) currently out`}</p>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {matches.map(({ b, c, v }) => (
                <Link key={b.id} href={`/admin/receiving?booking=${b.id}`} className="rounded-xl border border-line bg-panel2 p-3 text-sm hover:border-gold">
                  <span className="font-mono text-xs text-gold">{b.id}</span>
                  <span className="block font-semibold">{v?.model} ({v?.regNo})</span>
                  <span className="block text-xs text-muted">{c?.name} · {c?.phone}</span>
                  <span className={`block text-xs ${b.endAt < now ? 'text-rose-400' : 'text-muted'}`}>Due {fmtDateTime(b.endAt)}{b.endAt < now ? ' — overdue' : ''}</span>
                </Link>))}
              {matches.length === 0 && <p className="text-sm text-muted">No car is out matching this search.</p>}
            </div>
          </div>)}
      </Card>

      {sel && bal && (
        <Card title={<span>Receive <span className="font-mono text-gold">{sel.b.id}</span></span>} actions={<Link href="/admin/receiving" className="btn-ghost btn-sm">Change booking</Link>}>
          <div className="grid gap-3 p-5 sm:grid-cols-3 lg:grid-cols-6">
            {[['Customer', `${sel.c?.name} · ${sel.c?.phone}`], ['Car', `${sel.v?.model} (${sel.v?.regNo})`], ['Out', fmtDateTime(sel.b.startAt)], ['Due back', fmtDateTime(sel.b.endAt)],
              ['Meter / fuel out', `${sel.b.meterOut?.toLocaleString() ?? '—'} km · ${sel.b.fuelOut ?? '—'}`], ['Paid / pending', `${pkr(bal.paid)} / ${pkr(bal.pending)}`]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-panel2 p-3"><p className="text-xs text-muted">{k}</p><p className="text-sm font-semibold">{v}</p></div>))}
          </div>
          {canCreate && (
            <form action={receiveVehicle} className="space-y-4 border-t border-line p-5">
              <input type="hidden" name="bookingId" value={sel.b.id} />
              <div className="grid gap-4 md:grid-cols-4">
                <Field label="Return date & time" required><input type="datetime-local" name="receivedAt" required defaultValue={pkInput(now)} className="input" /></Field>
                <Field label="Meter in (km)"><input type="number" name="meterIn" min={sel.b.meterOut ?? 0} className="input" placeholder={`≥ ${sel.b.meterOut ?? 0}`} /></Field>
                <Field label="Fuel in"><select name="fuelIn" className="input"><option value="">—</option>{['Empty', '1/4', '1/2', '3/4', 'Full'].map((f) => <option key={f}>{f}</option>)}</select></Field>
                <Field label="Fine (PKR)"><input type="number" name="fine" min={0} defaultValue={suggested?.fine ?? 0} className="input" /></Field>
              </div>
              {suggested && suggested.fine > 0 && <p className="text-xs text-amber-400">Suggested late fine: {pkr(suggested.fine)} — returned {suggested.lateHours.toFixed(1)} h late ({grace} h grace). Add fuel shortfall or extra km to the fine if needed.</p>}
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Fine note"><input name="fineNote" className="input" placeholder="e.g. late 5 hours + fuel 1/4 short" /></Field>
                <Field label="Condition notes"><input name="notes" className="input" placeholder="Any scratches, cleanliness…" /></Field>
              </div>
              <ImageInput name="photos" label="Return photos" multiple />
              <div className="grid gap-4 rounded-xl bg-panel2 p-4 md:grid-cols-3">
                <Field label="Collect payment now (PKR)"><input type="number" name="collect" min={0} defaultValue={bal.pending + (suggested?.fine ?? 0)} className="input" /></Field>
                <Field label="Method"><select name="method" className="input">{['Cash', 'Bank transfer', 'JazzCash', 'Easypaisa', 'Card'].map((m) => <option key={m}>{m}</option>)}</select></Field>
                <p className="self-end text-xs text-muted">Leave 0 for credit customers who pay at month end.</p>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="damage" value="1" className="h-4 w-4 accent-[#D4A52C]" /> The car has damage — open a damage report after saving</label>
              <div className="flex justify-end"><Submit>Receive vehicle &amp; complete booking</Submit></div>
            </form>)}
        </Card>)}

      <Card title="Received vehicles">
        <TableWrap><table className="tbl">
          <thead><tr><th>Booking ID</th><th>Customer</th><th>Vehicle</th><th>Received at</th><th>Meter in</th><th>Fine</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
          <tbody>
            {pg.slice.length === 0 && <Empty cols={8} />}
            {pg.slice.map(({ r, b, c, v }) => (
              <tr key={r.id}><td><Link className="link" href={`/admin/bookings/${r.bookingId}`}>{r.bookingId}</Link></td><td>{c}</td><td>{v?.model} <span className="text-muted">({v?.regNo})</span></td>
                <td>{fmtDateTime(r.receivedAt)}</td><td>{r.meterIn?.toLocaleString() ?? '—'}</td><td>{pkr(r.fine)}</td><td><Badge status={b?.status ?? 'COMPLETED'} /></td>
                <td><div className="flex justify-end gap-1"><Link className="btn-ghost btn-sm" href={`/admin/bookings/${r.bookingId}`}><Eye size={14} /></Link><Link className="btn-ghost btn-sm" href={`/admin/bookings/${r.bookingId}/print`}><Printer size={14} /></Link></div></td></tr>))}
          </tbody></table></TableWrap>
        <Pagination {...pg} makeHref={(p) => `/admin/receiving?page=${p}`} />
      </Card>
    </div>
  );
}
