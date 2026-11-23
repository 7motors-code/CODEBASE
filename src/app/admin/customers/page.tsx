import Link from 'next/link';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { Plus, Pencil, Mail, Phone, IdCard, MapPin, CalendarDays, Ban, CheckCircle2, Trash2, FileText, UserRound } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { bookingBalances, customerTotals, damagePaid } from '@/lib/calc';
import { fmtDate, fmtDateTime, monthLabel, monthRange, pkMonth, pkr } from '@/lib/format';
import { Avatar, Badge, Card, Field, Modal, PageHeader, Pagination, TableWrap, Thumb, Empty, href, paginate } from '@/components/ui';
import { ConfirmForm, ImageInput, PrintButton, Submit } from '@/components/client';
import { saveCustomer, setBlocked, deleteCustomer } from './actions';

export default async function CustomersPage({ searchParams: sp }: { searchParams: { q?: string; id?: string; tab?: string; new?: string; edit?: string; err?: string; page?: string; type?: string; statement?: string } }) {
  await requirePerm('customers');
  const [canCreate, canEdit, canDelete] = await Promise.all([can('customers', 'create'), can('customers', 'edit'), can('customers', 'delete')]);
  const all = await db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt));
  const counts = await db.select({ c: schema.bookings.customerId }).from(schema.bookings);
  const q = (sp.q ?? '').toLowerCase();
  const list = all.filter((c) => (!q || `${c.id} ${c.name} ${c.phone} ${c.cnic ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q)) && (!sp.type || (sp.type === 'credit' ? c.isCredit : !c.isCredit)));
  const pg = paginate(list, sp.page);
  const base = { q: sp.q, type: sp.type };
  const sel = sp.id ? all.find((c) => c.id === sp.id) : undefined;
  const editing = sp.edit ? all.find((c) => c.id === sp.edit) : undefined;
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle="Customer profiles, history and credit (monthly account) customers">
        {canCreate && <Link href={href('/admin/customers', base, { new: 1 })} className="btn-primary"><Plus size={16} /> Credit Customer</Link>}
      </PageHeader>
      {sp.err && !sp.new && !sp.edit && <p className="mb-4 rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">{sp.err}</p>}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <form className="no-print flex flex-wrap gap-2 p-4" method="get">
            <input name="q" defaultValue={sp.q} placeholder="Search by customer ID, name, phone" className="input max-w-sm" />
            <select name="type" defaultValue={sp.type} className="input w-44"><option value="">All customers</option><option value="credit">Credit (monthly)</option><option value="walkin">Walk-in</option></select>
            <button className="btn-ghost">Search</button></form>
          <TableWrap><table className="tbl">
            <thead><tr><th>Customer ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Bookings</th><th>Address</th><th>Registered</th></tr></thead>
            <tbody>
              {pg.slice.length === 0 && <Empty cols={8} />}
              {pg.slice.map((c) => (
                <tr key={c.id} className={sel?.id === c.id ? 'bg-navy-soft' : ''}>
                  <td><Link className="link font-mono text-xs" href={href('/admin/customers', base, { id: c.id, page: sp.page })}>{c.id}</Link></td>
                  <td><Link href={href('/admin/customers', base, { id: c.id, page: sp.page })} className="flex items-center gap-2 font-medium"><Avatar name={c.name} />{c.name}{c.isCredit && <span className="badge bg-navy-soft text-navy">Credit</span>}</Link></td>
                  <td>{c.email ?? '—'}</td><td>{c.phone}</td><td><Badge status={c.status} /></td><td>{counts.filter((x) => x.c === c.id).length}</td><td className="max-w-[160px] truncate">{c.address ?? '—'}</td><td>{fmtDate(c.createdAt)}</td>
                </tr>))}
            </tbody></table></TableWrap>
          <Pagination {...pg} makeHref={(p) => href('/admin/customers', base, { page: p })} />
        </Card>
        <div>{sel ? <Profile c={sel} tab={sp.tab} base={{ ...base, page: sp.page }} canEdit={canEdit} canDelete={canDelete} statement={sp.statement} /> : (
          <div className="card flex flex-col items-center p-10 text-center text-muted"><UserRound size={40} className="mb-3 text-navy" /><p className="font-medium text-ink">Select customer</p><p className="text-sm">Choose a customer from the list to view their profile and complete history.</p></div>)}</div>
      </div>
      {(sp.new || editing) && (
        <Modal title={editing ? `Edit ${editing.name}` : 'Add customer'} closeHref={href('/admin/customers', base, editing ? { id: editing.id } : {})}>
          <form action={saveCustomer} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {sp.err && <p className="rounded-xl bg-bad-soft px-4 py-2 text-sm text-bad">{sp.err}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required><input name="name" required defaultValue={editing?.name} className="input" /></Field>
              <Field label="Phone" required><input name="phone" required defaultValue={editing?.phone} className="input" /></Field>
              <Field label="Email"><input name="email" type="email" defaultValue={editing?.email ?? ''} className="input" /></Field>
              <Field label="CNIC"><input name="cnic" defaultValue={editing?.cnic ?? ''} placeholder="00000-0000000-0" className="input" /></Field>
              <Field label="Address" className="sm:col-span-2"><input name="address" defaultValue={editing?.address ?? ''} className="input" /></Field>
              <Field label="Customer type"><select name="isCredit" defaultValue={editing ? (editing.isCredit ? '1' : '0') : '1'} className="input"><option value="1">Credit — monthly account, pays at month end</option><option value="0">Walk-in — pays per booking</option></select></Field>
              <Field label="Credit limit (PKR)"><input name="creditLimit" type="number" min={0} defaultValue={editing?.creditLimit ?? 0} className="input" /></Field>
              <ImageInput name="cnicFront" label="CNIC front" current={editing?.cnicFrontId} />
              <ImageInput name="cnicBack" label="CNIC back" current={editing?.cnicBackId} />
            </div>
            <div className="flex justify-end gap-2"><Link href="/admin/customers" className="btn-ghost">Cancel</Link><Submit>{editing ? 'Save' : 'Add'}</Submit></div>
          </form>
        </Modal>)}
    </div>
  );
}

async function Profile({ c, tab, base, canEdit, canDelete, statement }: { c: typeof schema.customers.$inferSelect; tab?: string; base: Record<string, string | undefined>; canEdit: boolean; canDelete: boolean; statement?: string }) {
  const tot = await customerTotals(c.id);
  const link = (o: Record<string, string | undefined>) => href('/admin/customers', base, { id: c.id, ...o });
  const bks = await db.select({ b: schema.bookings, v: schema.vehicles }).from(schema.bookings).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId)).where(eq(schema.bookings.customerId, c.id)).orderBy(desc(schema.bookings.startAt));
  const pays = await db.select().from(schema.payments).where(eq(schema.payments.customerId, c.id)).orderBy(desc(schema.payments.paidAt));
  const dmgs = await db.select().from(schema.damages).where(eq(schema.damages.customerId, c.id));
  const events = [
    ...bks.map(({ b, v }) => ({ at: b.createdAt, t: `Booking ${b.id}`, d: `${v?.model} · ${fmtDate(b.startAt)} – ${fmtDate(b.endAt)} · ${pkr(b.totalAmount)}`, s: b.status, href: `/admin/bookings/${b.id}` })),
    ...pays.map((p) => ({ at: p.paidAt, t: `Payment ${pkr(p.amount)}`, d: `${p.type.toLowerCase()} · ${p.method}${p.bookingId ? ` · ${p.bookingId}` : ''}`, s: 'PAID', href: `/admin/payments/receipt/${p.id}` })),
    ...dmgs.map((x) => ({ at: x.createdAt, t: `Damage: ${x.damageType}`, d: pkr(x.estimatedCost), s: x.status, href: `/admin/damage?view=${x.id}` })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const month = statement ?? pkMonth();
  const r = monthRange(month);
  const stmtBookings = statement ? await db.select({ b: schema.bookings, v: schema.vehicles }).from(schema.bookings).leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .where(and(eq(schema.bookings.customerId, c.id), gte(schema.bookings.startAt, r.start), lt(schema.bookings.startAt, r.end))) : [];
  const stmtBal = await bookingBalances(stmtBookings.map((x) => x.b.id));
  const dPaid = await damagePaid(dmgs.map((d) => d.id));
  void dPaid;
  return (
    <div className="card sticky top-20 overflow-hidden">
      <div className="relative border-b border-line bg-panel2 p-6 text-ink">
        <div className="absolute end-3 top-3 flex gap-1">{canEdit && <Link href={link({ edit: c.id, id: undefined })} className="rounded-lg border border-line bg-panel p-1.5 hover:bg-panel2"><Pencil size={14} /></Link>}</div>
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-panel text-2xl font-medium text-ink">{c.name.charAt(0)}</span>
        <p className="mt-3 text-lg font-medium text-ink">{c.name}</p>
        <div className="mt-1 flex items-center gap-2 text-xs"><Badge status={c.status} /><span className="text-muted">ID: {c.id}</span>{c.isCredit && <span className="badge bg-navy-soft text-navy font-medium">Credit</span>}</div>
      </div>
      <div className="flex border-b border-line">
        <Link href={link({ tab: undefined })} className={`flex-1 py-3 text-center text-sm font-medium ${tab !== 'activity' ? 'border-b-2 border-navy/40 text-navy' : 'text-muted'}`}>OVERVIEW</Link>
        <Link href={link({ tab: 'activity' })} className={`flex-1 py-3 text-center text-sm font-medium ${tab === 'activity' ? 'border-b-2 border-navy/40 text-navy' : 'text-muted'}`}>ACTIVITY</Link>
      </div>
      {tab !== 'activity' ? (
        <div className="space-y-2 p-4 text-sm">
          {[[Mail, 'Email', c.email], [Phone, 'Phone', c.phone], [IdCard, 'CNIC', c.cnic], [MapPin, 'Address', c.address], [CalendarDays, 'Joined', fmtDate(c.createdAt)]].map(([I, k, v]) => {
            const Icon = I as typeof Mail;
            return <div key={k as string} className="flex items-center gap-3 rounded-xl bg-panel2 p-3"><Icon size={16} className="text-navy" /><div><p className="text-[11px] text-muted">{k as string}</p><p className="font-medium">{(v as string) || '—'}</p></div></div>;
          })}
          {c.isCredit && <p className="rounded-xl bg-panel2 p-3 text-xs">Credit limit: <b>{pkr(c.creditLimit)}</b>{c.creditLimit > 0 && tot.pending > c.creditLimit && <span className="text-bad"> · over limit</span>}</p>}
          {c.status === 'BLOCKED' && c.blockReason && <p className="rounded-xl bg-bad-soft p-3 text-xs text-bad">Blocked: {c.blockReason}</p>}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="rounded-xl bg-ok-soft p-3"><p className="text-[11px] text-ok">Total paid</p><p className="text-lg font-medium">{pkr(tot.paid)}</p></div>
            <div className="rounded-xl bg-bad-soft p-3"><p className="text-[11px] text-bad">Pending</p><p className="text-lg font-medium">{pkr(tot.pending)}</p></div>
          </div>
          <div className="flex gap-2 pt-2">{[c.cnicFrontId, c.cnicBackId].map((id, i) => id && <a key={i} href={`/api/files/${id}`} target="_blank"><Thumb id={id} alt="CNIC" size={80} /></a>)}</div>
          <form method="get" className="flex items-end gap-2 border-t border-line pt-3"><input type="hidden" name="id" value={c.id} />
            <Field label="Monthly statement" className="flex-1"><input type="month" name="statement" defaultValue={month} className="input" /></Field><button className="btn-ghost"><FileText size={14} /> Open</button></form>
          {canEdit && (c.status === 'ACTIVE'
            ? <ConfirmForm action={setBlocked} hidden={{ id: c.id, block: '1', reason: 'Blocked by admin' }} message="Block this customer? They cannot be booked until unblocked." className="btn-ghost btn-sm w-full text-bad"><Ban size={14} /> Block customer</ConfirmForm>
            : <form action={setBlocked}><input type="hidden" name="id" value={c.id} /><button className="btn-ghost btn-sm w-full text-ok"><CheckCircle2 size={14} /> Unblock</button></form>)}
          {canDelete && tot.bookings === 0 && <ConfirmForm action={deleteCustomer} hidden={{ id: c.id }} message="Delete this customer?" className="btn-ghost btn-sm w-full text-bad"><Trash2 size={14} /> Delete</ConfirmForm>}
        </div>
      ) : (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
          {events.length === 0 && <p className="text-sm text-muted">No activity yet.</p>}
          {events.map((e, i) => <Link key={i} href={e.href} className="block rounded-xl bg-panel2 p-3 text-sm hover:ring-1 hover:ring-navy/20"><div className="flex justify-between gap-2"><span className="font-medium">{e.t}</span><Badge status={e.s} /></div><p className="text-xs text-muted">{e.d}</p><p className="text-[11px] text-muted">{fmtDateTime(e.at)}</p></Link>)}
        </div>)}
      {statement && (
        <Modal title={`Statement · ${c.name} · ${monthLabel(month)}`} closeHref={link({ statement: undefined })} wide>
          <div className="mb-3 flex justify-end"><PrintButton label="Print statement" /></div>
          <div className="print-area rounded-xl bg-white p-6 text-slate-900">
            <div className="mb-4 flex items-center gap-3 border-b-4 border-[#D4A52C] pb-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo.jpg" alt="" className="h-14 w-14 rounded-full" /><div><p className="text-lg font-medium text-[#0B2A5B]">Monthly statement — {monthLabel(month)}</p><p className="text-sm">{c.name} · {c.phone} · {c.id}</p></div></div>
            <table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-1">Booking</th><th>Car</th><th>Dates</th><th>Total</th><th>Fine</th><th>Paid</th><th>Balance</th></tr></thead><tbody>
              {stmtBookings.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-slate-500">No bookings this month</td></tr>}
              {stmtBookings.map(({ b, v }) => { const x = stmtBal.get(b.id)!; return <tr key={b.id} className="border-b"><td className="py-1 font-mono text-xs">{b.id}</td><td>{v?.model} ({v?.regNo})</td><td>{fmtDate(b.startAt)} – {fmtDate(b.endAt)}</td><td>{pkr(x.total)}</td><td>{pkr(x.fine)}</td><td>{pkr(x.paid)}</td><td className="font-medium">{pkr(x.pending)}</td></tr>; })}
            </tbody></table>
            <p className="mt-4 text-end text-lg font-medium">Amount due for {monthLabel(month)}: {pkr([...stmtBal.values()].reduce((s, x) => s + x.pending, 0))}</p>
          </div>
        </Modal>)}
    </div>
  );
}
