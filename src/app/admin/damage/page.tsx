import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { Search, Eye, Pencil, Trash2, TriangleAlert } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { damagePaid } from '@/lib/calc';
import { fmtDate, fmtTime, pkInput, pkr } from '@/lib/format';
import { Badge, Card, Field, Modal, PageHeader, Pagination, TableWrap, Thumb, Empty, href, paginate } from '@/components/ui';
import { ConfirmForm, ImageInput, PrintButton, Submit } from '@/components/client';
import { saveDamage, setDamageStatus, updateDamage, deleteDamage } from './actions';
import { addPayment } from '../bookings/actions';

export default async function DamagePage({ searchParams: sp }: { searchParams: { booking?: string; bq?: string; q?: string; view?: string; edit?: string; pay?: string; err?: string; saved?: string; page?: string } }) {
  await requirePerm('damage');
  const [canCreate, canEdit, canDelete, canPay] = await Promise.all([can('damage', 'create'), can('damage', 'edit'), can('damage', 'delete'), can('payments', 'create')]);
  const types = await db.select().from(schema.lookups).where(eq(schema.lookups.kind, 'DAMAGE_TYPE')).orderBy(schema.lookups.name);
  const bookings = await db.select({ b: schema.bookings, c: schema.customers, v: schema.vehicles }).from(schema.bookings)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId)).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .orderBy(desc(schema.bookings.startAt)).limit(500);
  const bq = (sp.bq ?? '').toLowerCase().replace(/[\s-]/g, '');
  const bMatches = bq ? bookings.filter(({ b, c, v }) => `${b.id}${c?.name}${c?.phone}${c?.cnic ?? ''}${v?.regNo}`.toLowerCase().replace(/[\s-]/g, '').includes(bq)).slice(0, 9) : [];
  const sel = sp.booking ? bookings.find((r) => r.b.id === sp.booking) : undefined;

  const rows = await db.select({ d: schema.damages, c: schema.customers.name, v: schema.vehicles }).from(schema.damages)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.damages.customerId)).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.damages.vehicleId)).orderBy(desc(schema.damages.createdAt));
  const q = (sp.q ?? '').toLowerCase();
  const list = rows.filter(({ d, c, v }) => !q || `${d.id} ${d.bookingId} ${c} ${v?.regNo} ${v?.model} ${d.damageType}`.toLowerCase().includes(q));
  const pg = paginate(list, sp.page);
  const paid = await damagePaid(rows.map((r) => r.d.id));
  const viewing = sp.view ? rows.find((r) => r.d.id === sp.view) : undefined;
  const editing = sp.edit ? rows.find((r) => r.d.id === sp.edit) : undefined;
  const paying = sp.pay ? rows.find((r) => r.d.id === sp.pay) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Damage" subtitle="Log damage caused by a customer, attach evidence and bill it" />
      {sp.saved && <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">Damage report {sp.saved} saved and added to the customer&apos;s pending balance.</p>}
      {sp.err && <p className="rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-300">{sp.err}</p>}
      {canCreate && (
        <Card title={<span className="flex items-center gap-2"><TriangleAlert size={18} className="text-gold" /> Log new incident</span>}>
          <div className="p-5">
            {!sel ? (<>
              <form method="get" className="flex gap-2"><input name="bq" defaultValue={sp.bq} placeholder="Select booking: search booking ID, customer name, phone or CNIC…" className="input" /><button className="btn-gold"><Search size={16} /> Find</button></form>
              <div className="mt-3 grid gap-2 md:grid-cols-3">{bMatches.map(({ b, c, v }) => (
                <Link key={b.id} href={`/admin/damage?booking=${b.id}`} className="rounded-xl border border-line bg-panel2 p-3 text-sm hover:border-gold">
                  <span className="font-mono text-xs text-gold">{b.id}</span><span className="block font-semibold">{c?.name} · {c?.phone}</span><span className="block text-xs text-muted">{v?.model} ({v?.regNo}) · <Badge status={b.status} /></span></Link>))}
                {bq && bMatches.length === 0 && <p className="text-sm text-muted">No booking found.</p>}</div>
            </>) : (
              <form action={saveDamage} className="space-y-4">
                <input type="hidden" name="bookingId" value={sel.b.id} />
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-panel2 p-3 text-sm"><span className="font-mono text-gold">{sel.b.id}</span><span>{sel.c?.name} · {sel.c?.phone}</span><span>{sel.v?.model} ({sel.v?.regNo})</span><Link href="/admin/damage" className="link ms-auto">Change</Link></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Damage type" required><input name="damageType" list="dtypes" required placeholder="Type to search or add new" className="input" /><datalist id="dtypes">{types.map((t) => <option key={t.id} value={t.name} />)}</datalist></Field>
                  <Field label="Estimated repair cost (PKR)" required><input name="estimatedCost" type="number" min={0} required className="input" /></Field>
                </div>
                <Field label="Detailed description"><textarea name="description" rows={3} className="input" placeholder="Where is the damage, how it happened…" /></Field>
                <ImageInput name="media" label="Evidence upload (photos / videos)" multiple accept="image/*,video/*" />
                <div className="flex justify-end"><Submit>Submit damage report</Submit></div>
              </form>)}
          </div>
        </Card>)}

      <Card title="Damage history">
        <form className="no-print flex gap-2 p-4" method="get"><input name="q" defaultValue={sp.q} placeholder="Search by car reg no, name or customer…" className="input max-w-md" /><button className="btn-ghost">Search</button></form>
        <TableWrap><table className="tbl">
          <thead><tr><th>Date</th><th>Time</th><th>Vehicle</th><th>Customer</th><th>Damage type</th><th>Status</th><th>Amount</th><th>Paid</th><th className="text-end">Actions</th></tr></thead>
          <tbody>
            {pg.slice.length === 0 && <Empty cols={9} />}
            {pg.slice.map(({ d, c, v }) => (
              <tr key={d.id}><td>{fmtDate(d.createdAt)}</td><td>{fmtTime(d.createdAt)}</td><td>{v?.model}<span className="block text-xs text-muted">{v?.regNo}</span></td><td>{c}</td><td>{d.damageType}</td>
                <td><Badge status={d.status} /></td><td className="font-semibold">{pkr(d.estimatedCost)}</td><td className="text-emerald-400">{pkr(paid.get(d.id) ?? 0)}</td>
                <td><div className="flex flex-wrap justify-end gap-1">
                  <Link className="btn-ghost btn-sm" href={`/admin/damage?view=${d.id}`}><Eye size={13} /></Link>
                  {canEdit && <Link className="btn-ghost btn-sm" href={`/admin/damage?edit=${d.id}`}><Pencil size={13} /></Link>}
                  {canPay && d.status === 'PENDING' && <Link className="btn-gold btn-sm" href={`/admin/damage?pay=${d.id}`}>Collect</Link>}
                  {canEdit && d.status === 'PENDING' && <ConfirmForm action={setDamageStatus} hidden={{ id: d.id, status: 'WAIVED' }} message="Waive this damage charge? The customer will not pay it.">Waive</ConfirmForm>}
                  {canDelete && <ConfirmForm action={deleteDamage} hidden={{ id: d.id }} message="Delete this damage report?" className="btn-ghost btn-sm text-rose-400"><Trash2 size={13} /></ConfirmForm>}
                </div></td></tr>))}
          </tbody></table></TableWrap>
        <Pagination {...pg} makeHref={(p) => href('/admin/damage', { q: sp.q }, { page: p })} />
      </Card>

      {viewing && (
        <Modal title={`Damage ${viewing.d.id}`} closeHref="/admin/damage" wide>
          <div className="mb-4 flex justify-end"><PrintButton label="Print report" /></div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            {[['Booking', viewing.d.bookingId], ['Customer', viewing.c], ['Vehicle', `${viewing.v?.model} (${viewing.v?.regNo})`], ['Type', viewing.d.damageType], ['Estimated cost', pkr(viewing.d.estimatedCost)], ['Status', viewing.d.status]].map(([k, v]) => <div key={k} className="rounded-xl bg-panel2 p-3"><p className="text-xs text-muted">{k}</p><p className="font-semibold">{v}</p></div>)}
          </div>
          {viewing.d.description && <p className="mt-4 text-sm">{viewing.d.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2">{viewing.d.mediaIds.map((id) => <a key={id} href={`/api/files/${id}`} target="_blank"><Thumb id={id} alt="evidence" size={120} /></a>)}</div>
        </Modal>)}
      {editing && (
        <Modal title={`Edit ${editing.d.id}`} closeHref="/admin/damage">
          <form action={updateDamage} className="space-y-4"><input type="hidden" name="id" value={editing.d.id} />
            <Field label="Damage type"><input name="damageType" list="dtypes2" defaultValue={editing.d.damageType} className="input" /><datalist id="dtypes2">{types.map((t) => <option key={t.id} value={t.name} />)}</datalist></Field>
            <Field label="Estimated repair cost (PKR)"><input name="estimatedCost" type="number" defaultValue={editing.d.estimatedCost} className="input" /></Field>
            <Field label="Description"><textarea name="description" rows={3} defaultValue={editing.d.description ?? ''} className="input" /></Field>
            <ImageInput name="media" label="Add more evidence" multiple accept="image/*,video/*" />
            <div className="flex justify-end gap-2"><Link href="/admin/damage" className="btn-ghost">Cancel</Link><Submit>Save</Submit></div>
          </form>
        </Modal>)}
      {paying && (
        <Modal title={`Collect damage payment · ${paying.d.id}`} closeHref="/admin/damage">
          <form action={addPayment} className="space-y-4">
            <input type="hidden" name="damageId" value={paying.d.id} /><input type="hidden" name="back" value="/admin/damage" />
            <p className="text-sm text-muted">Remaining: {pkr(paying.d.estimatedCost - (paid.get(paying.d.id) ?? 0))}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount"><input name="amount" type="number" min={1} defaultValue={paying.d.estimatedCost - (paid.get(paying.d.id) ?? 0)} className="input" /></Field>
              <Field label="Method"><select name="method" className="input">{['Cash', 'Bank transfer', 'JazzCash', 'Easypaisa', 'Card'].map((m) => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Date"><input name="paidAt" type="datetime-local" defaultValue={pkInput()} className="input" /></Field>
              <Field label="Reference"><input name="reference" className="input" /></Field>
            </div>
            <div className="flex justify-end gap-2"><Submit className="btn-ghost" name="print" value="1">Save &amp; print</Submit><Submit>Save payment</Submit></div>
          </form>
        </Modal>)}
    </div>
  );
}
