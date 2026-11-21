import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq, or } from 'drizzle-orm';
import { Pencil, Printer, PackageCheck, TriangleAlert, CheckCircle2, PlayCircle, XCircle } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { bookingBalances, customerTotals } from '@/lib/calc';
import { fmtDateTime, pkInput, pkr } from '@/lib/format';
import { Badge, Card, Field, PageHeader, Thumb, Empty } from '@/components/ui';
import { ConfirmForm, Submit } from '@/components/client';
import { addPayment, changeStatus, deletePayment } from '../actions';

export default async function BookingDetail({ params, searchParams }: { params: { id: string }; searchParams: { err?: string } }) {
  await requirePerm('bookings');
  const [row] = await db.select({ b: schema.bookings, c: schema.customers, v: schema.vehicles, d: schema.drivers, l: schema.locations })
    .from(schema.bookings).leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId))
    .leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId)).leftJoin(schema.drivers, eq(schema.drivers.id, schema.bookings.driverId))
    .leftJoin(schema.locations, eq(schema.locations.id, schema.bookings.locationId)).where(eq(schema.bookings.id, params.id));
  if (!row) notFound();
  const { b, c, v, d, l } = row;
  const [canEdit, canPay, canDelPay] = await Promise.all([can('bookings', 'edit'), can('payments', 'create'), can('payments', 'delete')]);
  const bal = (await bookingBalances([b.id])).get(b.id)!;
  const pays = await db.select().from(schema.payments).where(eq(schema.payments.bookingId, b.id)).orderBy(desc(schema.payments.paidAt));
  const [rcv] = await db.select().from(schema.receivings).where(eq(schema.receivings.bookingId, b.id));
  const dmgs = await db.select().from(schema.damages).where(eq(schema.damages.bookingId, b.id));
  const group = b.groupId ? await db.select({ id: schema.bookings.id }).from(schema.bookings).where(or(eq(schema.bookings.groupId, b.groupId))) : [];
  const ct = c ? await customerTotals(c.id) : null;
  const back = `/admin/bookings/${b.id}`;
  const overdue = b.status === 'IN_PROGRESS' && b.endAt < new Date();
  const info: [string, React.ReactNode][] = [
    ['Customer', c ? <Link key="c" className="link" href={`/admin/customers?id=${c.id}`}>{c.name}</Link> : '—'], ['Phone', c?.phone], ['CNIC', c?.cnic ?? '—'], ['Address', c?.address ?? '—'],
    ['Vehicle', `${v?.model} (${v?.regNo})`], ['Booking type', b.bookingType ?? '—'], ['Duration', b.durationType === '12H' ? `12 hours${b.shift ? ` · ${b.shift === 'NIGHT' ? 'Night' : 'Day'} shift` : ''}` : 'Per day'],
    ['Location', l?.name ?? '—'], ['Start', fmtDateTime(b.startAt)], ['End', fmtDateTime(b.endAt)], ['Fuel out', b.fuelOut ?? '—'], ['Meter out', b.meterOut ? `${b.meterOut.toLocaleString()} km` : '—'],
    ['Driver', d ? `${d.name} (${pkr(b.driverAmount)})` : 'Self-drive'], ['Guarantor', b.guarantorName ? `${b.guarantorName} · ${b.guarantorPhone ?? ''}` : '—'], ['Guarantor CNIC', b.guarantorCnic ?? '—'], ['Created', fmtDateTime(b.createdAt)],
  ];
  return (
    <div className="space-y-6">
      <PageHeader title={`Booking ${b.id}`} subtitle={b.groupId ? `Part of group ${b.groupId}: ${group.map((g) => g.id).join(', ')}` : undefined}>
        {overdue ? <Badge status="OVERDUE" label="Overdue return" /> : <Badge status={b.status} />}
        <Link href={`${back}/print`} className="btn-ghost"><Printer size={16} /> Rental paper</Link>
        {canEdit && !['COMPLETED', 'CANCELLED'].includes(b.status) && <Link href={`${back}/edit`} className="btn-ghost"><Pencil size={16} /> Edit</Link>}
      </PageHeader>
      {searchParams.err && <p className="rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-300">{searchParams.err}</p>}

      {canEdit && !['COMPLETED', 'CANCELLED'].includes(b.status) && (
        <Card title="Next step">
          <div className="flex flex-wrap items-end gap-3 p-5">
            {b.status === 'PENDING' && <form action={changeStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="op" value="confirm" /><Submit className="btn-gold"><CheckCircle2 size={16} /> Confirm booking</Submit></form>}
            {['PENDING', 'CONFIRMED'].includes(b.status) && (
              <form action={changeStatus} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={b.id} /><input type="hidden" name="op" value="start" />
                <Field label="Meter out (km)"><input name="meterOut" type="number" defaultValue={b.meterOut ?? v?.meterReading} className="input w-36" /></Field>
                <Field label="Fuel out"><select name="fuelOut" defaultValue={b.fuelOut ?? ''} className="input w-28"><option value="">—</option>{['Empty', '1/4', '1/2', '3/4', 'Full'].map((f) => <option key={f}>{f}</option>)}</select></Field>
                <Submit className="btn-gold"><PlayCircle size={16} /> Hand over car</Submit>
              </form>)}
            {b.status === 'IN_PROGRESS' && <Link href={`/admin/receiving?booking=${b.id}`} className="btn-gold"><PackageCheck size={16} /> Receive vehicle</Link>}
            {['PENDING', 'CONFIRMED'].includes(b.status) && <ConfirmForm action={changeStatus} hidden={{ id: b.id, op: 'cancel' }} message="Cancel this booking? The car will be released." className="btn-danger"><XCircle size={16} /> Cancel booking</ConfirmForm>}
          </div>
        </Card>)}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-2">
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {info.map(([k, val]) => <div key={k} className="rounded-xl bg-panel2 p-3"><p className="text-xs text-muted">{k}</p><p className="text-sm font-semibold">{val}</p></div>)}
          </div>
          {b.notes && <p className="px-5 pb-4 text-sm"><span className="text-muted">Notes:</span> {b.notes}</p>}
          {b.overrideReason && <p className="px-5 pb-4 text-sm text-amber-400">Total changed manually: {b.overrideReason}</p>}
          <div className="flex flex-wrap gap-4 border-t border-line p-5">
            {[['CNIC front', c?.cnicFrontId], ['CNIC back', c?.cnicBackId], ['Guarantor CNIC', b.guarantorCnicId], ['Signature', b.signatureId], ['Thumb', b.thumbId]].map(([k, id]) => (
              <div key={k as string} className="text-center text-xs text-muted">{id ? <a href={`/api/files/${id}`} target="_blank"><Thumb id={id as string} alt={k as string} size={96} /></a> : <Thumb alt="" size={96} />}<p className="mt-1">{k}</p></div>))}
          </div>
        </Card>
        <Card title="Money">
          <div className="space-y-2 p-5 text-sm">
            <Row k="Rent" v={pkr(b.rentAmount)} /><Row k="Driver" v={pkr(b.driverAmount)} /><Row k="Booking total" v={pkr(bal.total)} bold />
            <Row k="Late / extra fine" v={pkr(bal.fine)} /><Row k="Paid" v={pkr(bal.paid)} green /><Row k="Pending" v={pkr(bal.pending)} red bold />
            {ct && <p className="border-t border-line pt-3 text-xs text-muted">Customer overall: paid {pkr(ct.paid)}, pending {pkr(ct.pending)} across {ct.bookings} booking(s){c?.isCredit ? ' · credit customer (billed monthly)' : ''}.</p>}
          </div>
          {canPay && bal.pending > 0 && b.status !== 'CANCELLED' && (
            <form id="pay" action={addPayment} className="space-y-3 border-t border-line p-5">
              <input type="hidden" name="bookingId" value={b.id} /><input type="hidden" name="back" value={back} />
              <p className="font-semibold">Receive payment</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Amount"><input name="amount" type="number" min={1} max={bal.pending} defaultValue={bal.pending} className="input" /></Field>
                <Field label="Type"><select name="type" className="input"><option value="RENT">Rent</option><option value="FINE">Fine</option><option value="ADVANCE">Advance</option></select></Field>
                <Field label="Method"><select name="method" className="input">{['Cash', 'Bank transfer', 'JazzCash', 'Easypaisa', 'Card'].map((m) => <option key={m}>{m}</option>)}</select></Field>
                <Field label="Date"><input name="paidAt" type="datetime-local" defaultValue={pkInput()} className="input" /></Field>
              </div>
              <Field label="Reference / note"><input name="reference" className="input" placeholder="Txn ID, cheque no…" /></Field>
              <div className="flex gap-2"><Submit>Save payment</Submit><Submit className="btn-ghost" name="print" value="1">Save &amp; print receipt</Submit></div>
            </form>)}
        </Card>
      </div>

      <Card title="Payment history">
        <table className="tbl"><thead><tr><th>Date</th><th>Type</th><th>Method</th><th>Reference</th><th>Amount</th><th></th></tr></thead><tbody>
          {pays.length === 0 && <Empty cols={6} text="No payments yet" />}
          {pays.map((p) => <tr key={p.id}><td>{fmtDateTime(p.paidAt)}</td><td><Badge status={p.type} label={p.type.charAt(0) + p.type.slice(1).toLowerCase()} /></td><td>{p.method}</td><td>{p.reference ?? '—'}</td><td className="font-semibold">{pkr(p.amount)}</td>
            <td className="text-end"><Link className="btn-ghost btn-sm" href={`/admin/payments/receipt/${p.id}`}><Printer size={13} /></Link>{canDelPay && <ConfirmForm action={deletePayment} hidden={{ id: p.id, back }} message="Delete this payment record?" className="btn-ghost btn-sm text-rose-400">Delete</ConfirmForm>}</td></tr>)}
        </tbody></table>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Vehicle receiving">
          {rcv ? <div className="grid grid-cols-2 gap-3 p-5 text-sm">
            <Row k="Received" v={fmtDateTime(rcv.receivedAt)} /><Row k="Meter in" v={rcv.meterIn ? `${rcv.meterIn.toLocaleString()} km` : '—'} />
            <Row k="Fuel in" v={rcv.fuelIn ?? '—'} /><Row k="Fine" v={pkr(rcv.fine)} />{rcv.notes && <p className="col-span-2 text-muted">{rcv.notes}</p>}
            <div className="col-span-2 flex flex-wrap gap-2">{rcv.photoIds.map((id) => <a key={id} href={`/api/files/${id}`} target="_blank"><Thumb id={id} alt="" size={70} /></a>)}</div>
          </div> : <p className="p-5 text-sm text-muted">Not received yet.</p>}
        </Card>
        <Card title="Damage reports" actions={<Link className="btn-ghost btn-sm" href={`/admin/damage?booking=${b.id}`}><TriangleAlert size={14} /> Report damage</Link>}>
          {dmgs.length === 0 ? <p className="p-5 text-sm text-muted">No damage reported.</p> : dmgs.map((x) => <p key={x.id} className="border-b border-line px-5 py-2 text-sm">{x.damageType} · {pkr(x.estimatedCost)} <Badge status={x.status} /></p>)}
        </Card>
      </div>
    </div>
  );
}
function Row({ k, v, bold, red, green }: { k: string; v: React.ReactNode; bold?: boolean; red?: boolean; green?: boolean }) {
  return <div className="flex justify-between gap-2"><span className="text-muted">{k}</span><span className={`${bold ? 'font-bold' : ''} ${red ? 'text-rose-400' : ''} ${green ? 'text-emerald-400' : ''}`}>{v}</span></div>;
}
