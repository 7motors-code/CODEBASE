import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { Plus, Eye, Pencil, Trash2, Phone, IdCard, Wallet } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { driverLedger } from '@/lib/calc';
import { fmtDate, fmtDateTime, pkDay, pkr } from '@/lib/format';
import { Badge, Field, Modal, PageHeader, Thumb, Empty } from '@/components/ui';
import { ConfirmForm, ImageInput, Submit } from '@/components/client';
import { saveDriver, payDriver, deleteDriver } from './actions';

export default async function DriversPage({ searchParams: sp }: { searchParams: { q?: string; new?: string; edit?: string; pay?: string; view?: string; err?: string; all?: string } }) {
  await requirePerm('drivers');
  const [canCreate, canEdit, canDelete] = await Promise.all([can('drivers', 'create'), can('drivers', 'edit'), can('drivers', 'delete')]);
  const ledger = await driverLedger();
  const q = (sp.q ?? '').toLowerCase();
  const today = pkDay();
  const list = ledger.filter((x) => (sp.all || x.driver.status === 'ACTIVE') && (!q || `${x.driver.name} ${x.driver.phone} ${x.driver.licenseNo} ${x.driver.cnic}`.toLowerCase().includes(q)));
  const editing = sp.edit ? ledger.find((x) => x.driver.id === Number(sp.edit))?.driver : null;
  const paying = sp.pay ? ledger.find((x) => x.driver.id === Number(sp.pay)) : null;
  const viewing = sp.view ? ledger.find((x) => x.driver.id === Number(sp.view)) : null;
  const trips = viewing ? await db.select({ b: schema.bookings, v: schema.vehicles }).from(schema.bookings).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId)).where(eq(schema.bookings.driverId, viewing.driver.id)).orderBy(desc(schema.bookings.startAt)) : [];
  const pays = viewing ? await db.select().from(schema.driverPayments).where(eq(schema.driverPayments.driverId, viewing.driver.id)).orderBy(desc(schema.driverPayments.date)) : [];
  return (
    <div className="space-y-6">
      <PageHeader title="Drivers" subtitle="Driver profiles, licences and payments">
        {canCreate && <Link href="/admin/drivers?new=1" className="btn-primary"><Plus size={16} /> Add driver</Link>}
      </PageHeader>
      <form className="mb-5 flex gap-2" method="get"><input name="q" defaultValue={sp.q} placeholder="Search drivers" className="input max-w-md" /><button className="btn-ghost">Search</button>
        <Link href={sp.all ? '/admin/drivers' : '/admin/drivers?all=1'} className="btn-ghost">{sp.all ? 'Active only' : 'Show inactive'}</Link></form>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.length === 0 && <p className="text-muted">No drivers yet.</p>}
        {list.map(({ driver: d, earned, paid, pending, onTrip, trips: n }) => (
          <div key={d.id} className="card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-line bg-panel2 p-4 text-ink">
              <Thumb id={d.photoId} alt={d.name} size={60} />
              <div className="min-w-0 flex-1"><p className="truncate text-base font-medium">{d.name}</p>
                <div className="mt-1 flex flex-wrap gap-1"><Badge status={onTrip ? 'BOOKED' : d.status === 'ACTIVE' ? 'AVAILABLE' : 'INACTIVE'} label={onTrip ? 'On trip' : d.status === 'ACTIVE' ? 'Available' : 'Inactive'} /><Badge status={d.paymentBasis} /></div></div>
            </div>
            <div className="space-y-1.5 p-4 text-sm">
              <p className="flex items-center gap-2 text-muted"><IdCard size={14} /> Licence {d.licenseNo ?? '—'}{d.licenseExpiry && <span className={d.licenseExpiry < today ? 'text-bad' : ''}> · exp {fmtDate(d.licenseExpiry)}</span>}</p>
              <p className="flex items-center gap-2 text-muted"><Phone size={14} /> {d.phone ?? '—'}</p>
              <p className="text-muted">{d.paymentBasis === 'SALARY' ? `Salary ${pkr(d.monthlySalary)}/month` : `Per day fee ${pkr(d.perDayFee)}`} · {n} trip(s)</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-panel2 p-2"><p className="text-[11px] text-muted">Total</p><p className="text-sm font-medium">{pkr(earned)}</p></div>
                <div className="rounded-xl bg-ok-soft p-2"><p className="text-[11px] text-muted">Paid</p><p className="text-sm font-medium text-ok">{pkr(paid)}</p></div>
                <div className="rounded-xl bg-bad-soft p-2"><p className="text-[11px] text-muted">Pending</p><p className="text-sm font-medium text-bad">{pkr(pending)}</p></div>
              </div>
            </div>
            <div className="flex gap-1 border-t border-line p-3">
              {canEdit && <Link href={`/admin/drivers?pay=${d.id}`} className="btn-primary btn-sm flex-1"><Wallet size={13} /> Pay</Link>}
              <Link href={`/admin/drivers?view=${d.id}`} className="btn-ghost btn-sm"><Eye size={13} /></Link>
              {canEdit && <Link href={`/admin/drivers?edit=${d.id}`} className="btn-ghost btn-sm"><Pencil size={13} /></Link>}
              {canDelete && <ConfirmForm action={deleteDriver} hidden={{ id: d.id }} message={`Remove driver ${d.name}? Drivers with trips are deactivated.`} className="btn-ghost btn-sm text-bad"><Trash2 size={13} /></ConfirmForm>}
            </div>
          </div>))}
      </div>

      {(sp.new || editing) && (
        <Modal title={editing ? `Edit ${editing.name}` : 'Add driver'} closeHref="/admin/drivers">
          <form action={saveDriver} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {sp.err && <p className="rounded-xl bg-bad-soft px-4 py-2 text-sm text-bad">{sp.err}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Driver name" required><input name="name" required defaultValue={editing?.name} className="input" /></Field>
              <Field label="Age"><input name="age" type="number" min={18} defaultValue={editing?.age ?? ''} className="input" /></Field>
              <Field label="ID card (CNIC)"><input name="cnic" defaultValue={editing?.cnic ?? ''} placeholder="00000-0000000-0" className="input" /></Field>
              <Field label="Phone no"><input name="phone" defaultValue={editing?.phone ?? ''} className="input" /></Field>
              <Field label="Licence no"><input name="licenseNo" defaultValue={editing?.licenseNo ?? ''} className="input" /></Field>
              <Field label="Licence expiry"><input name="licenseExpiry" type="date" defaultValue={editing?.licenseExpiry ?? ''} className="input" /></Field>
              <Field label="Payment basis"><select name="paymentBasis" defaultValue={editing?.paymentBasis ?? 'PER_BOOKING'} className="input"><option value="PER_BOOKING">Per booking (paid for each trip)</option><option value="SALARY">Salary basis (fixed monthly)</option></select></Field>
              <Field label="Per day fee (PKR)"><input name="perDayFee" type="number" min={0} defaultValue={editing?.perDayFee ?? 0} className="input" /></Field>
              <Field label="Monthly salary (PKR, salary basis)"><input name="monthlySalary" type="number" min={0} defaultValue={editing?.monthlySalary ?? 0} className="input" /></Field>
              {editing && <Field label="Status"><select name="status" defaultValue={editing.status} className="input"><option>ACTIVE</option><option>INACTIVE</option></select></Field>}
            </div>
            <ImageInput name="photo" label="Photo" current={editing?.photoId} />
            <p className="text-xs text-muted">Per-booking drivers earn the driver amount of each completed booking. Salary drivers earn their monthly salary. The per-day fee fills the driver amount on new bookings.</p>
            <div className="flex justify-end gap-2"><Link href="/admin/drivers" className="btn-ghost">Cancel</Link><Submit>{editing ? 'Save' : 'Add'}</Submit></div>
          </form>
        </Modal>)}
      {paying && (
        <Modal title={`Pay ${paying.driver.name}`} closeHref="/admin/drivers">
          <form action={payDriver} className="space-y-4">
            <input type="hidden" name="driverId" value={paying.driver.id} />
            <p className="text-sm text-muted">Pending: <span className="font-medium text-bad">{pkr(paying.pending)}</span> (earned {pkr(paying.earned)}, paid {pkr(paying.paid)})</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (PKR)" required><input name="amount" type="number" min={1} required defaultValue={paying.pending || ''} className="input" /></Field>
              <Field label="Date"><input name="date" type="date" defaultValue={pkDay()} className="input" /></Field>
              <Field label="Method"><select name="method" className="input">{['Cash', 'Bank transfer', 'JazzCash', 'Easypaisa'].map((m) => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Note"><input name="note" className="input" placeholder="e.g. November salary" /></Field>
            </div>
            <p className="text-xs text-muted">This payment is also recorded in Expenses.</p>
            <div className="flex justify-end gap-2"><Link href="/admin/drivers" className="btn-ghost">Cancel</Link><Submit>Record payment</Submit></div>
          </form>
        </Modal>)}
      {viewing && (
        <Modal title={viewing.driver.name} closeHref="/admin/drivers" wide>
          <h3 className="mb-2 font-medium">Trip history</h3>
          <table className="tbl"><thead><tr><th>Booking</th><th>Car</th><th>Dates</th><th>Status</th><th>Driver amount</th></tr></thead><tbody>
            {trips.length === 0 && <Empty cols={5} />}
            {trips.map(({ b, v }) => <tr key={b.id}><td><Link className="link" href={`/admin/bookings/${b.id}`}>{b.id}</Link></td><td>{v?.model}</td><td>{fmtDateTime(b.startAt)} – {fmtDateTime(b.endAt)}</td><td><Badge status={b.status} /></td><td>{pkr(b.driverAmount)}</td></tr>)}
          </tbody></table>
          <h3 className="mb-2 mt-6 font-medium">Payment history</h3>
          <table className="tbl"><thead><tr><th>Date</th><th>Method</th><th>Note</th><th>Amount</th></tr></thead><tbody>
            {pays.length === 0 && <Empty cols={4} />}
            {pays.map((p) => <tr key={p.id}><td>{fmtDate(p.date)}</td><td>{p.method}</td><td>{p.note ?? '—'}</td><td>{pkr(p.amount)}</td></tr>)}
          </tbody></table>
        </Modal>)}
    </div>
  );
}
