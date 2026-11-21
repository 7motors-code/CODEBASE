import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { Plus, Eye, Pencil, Trash2, DollarSign, Percent, Wrench, Wallet, TrendingUp, Calculator, CheckCircle2 } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { getSetting, investorSummary, V_STATUS_LABEL } from '@/lib/calc';
import { addMonths, fmtDateTime, monthLabel, pkMonth, pkr } from '@/lib/format';
import { Avatar, Badge, Card, Field, Kpi, Modal, PageHeader, TableWrap, Empty } from '@/components/ui';
import { ConfirmForm, PrintButton, Submit } from '@/components/client';
import { saveInvestor, markPaid, deleteInvestor } from './actions';

export default async function InvestorsPage({ searchParams: sp }: { searchParams: { q?: string; new?: string; edit?: string; view?: string; month?: string; err?: string } }) {
  await requirePerm('investors');
  const [canCreate, canEdit, canDelete] = await Promise.all([can('investors', 'create'), can('investors', 'edit'), can('investors', 'delete')]);
  const investors = await db.select().from(schema.investors).orderBy(schema.investors.name);
  const cars = await db.select().from(schema.vehicles).where(eq(schema.vehicles.active, true)).orderBy(schema.vehicles.model);
  const q = (sp.q ?? '').toLowerCase();
  const list = investors.filter((i) => !q || `${i.name} ${i.phone} ${i.cnic}`.toLowerCase().includes(q));
  const editing = sp.edit ? investors.find((i) => i.id === Number(sp.edit)) : undefined;
  const defShare = await getSetting('default_investor_share', '50');
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : pkMonth();
  const s = sp.view ? await investorSummary(Number(sp.view), month) : null;
  const assigned = cars.filter((c) => c.investorId).length;
  return (
    <div>
      <PageHeader title="Investor Management" subtitle="Manage investors, their cars and monthly payouts">
        {canCreate && <Link href="/admin/investors?new=1" className="btn-gold"><Plus size={16} /> Add investor</Link>}
      </PageHeader>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Total investors" value={investors.length} />
        <Kpi label="Vehicles assigned" value={assigned} tone="blue" />
        <Kpi label="With vehicles" value={investors.filter((i) => cars.some((c) => c.investorId === i.id)).length} tone="green" />
      </div>
      <Card>
        <form className="no-print flex gap-2 p-4" method="get"><input name="q" defaultValue={sp.q} placeholder="Search investors…" className="input max-w-md" /><button className="btn-ghost">Search</button></form>
        <TableWrap><table className="tbl">
          <thead><tr><th>Name</th><th>Phone</th><th>CNIC</th><th>Address</th><th>Share</th><th>Vehicles</th><th className="text-end">Actions</th></tr></thead>
          <tbody>
            {list.length === 0 && <Empty cols={7} />}
            {list.map((i) => (
              <tr key={i.id}><td><span className="flex items-center gap-2 font-semibold"><Avatar name={i.name} />{i.name}</span></td><td>{i.phone ?? '—'}</td><td className="text-xs">{i.cnic ?? '—'}</td><td>{i.address ?? '—'}</td><td>{Number(i.sharePercent)}%</td>
                <td><div className="flex flex-wrap gap-1">{cars.filter((c) => c.investorId === i.id).map((c) => <span key={c.id} className="badge bg-panel2 text-ink">{c.model} ({c.regNo})</span>)}</div></td>
                <td><div className="flex justify-end gap-1">
                  <Link className="btn-ghost btn-sm" href={`/admin/investors?view=${i.id}`}><Eye size={13} /></Link>
                  {canEdit && <Link className="btn-ghost btn-sm" href={`/admin/investors?edit=${i.id}`}><Pencil size={13} /></Link>}
                  {canDelete && <ConfirmForm action={deleteInvestor} hidden={{ id: i.id }} message={`Delete investor ${i.name}? Their cars become company owned.`} className="btn-ghost btn-sm text-rose-400"><Trash2 size={13} /></ConfirmForm>}
                </div></td></tr>))}
          </tbody></table></TableWrap>
      </Card>

      {(sp.new || editing) && (
        <Modal title={editing ? `Edit ${editing.name}` : 'Add Investor'} closeHref="/admin/investors">
          <form action={saveInvestor} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {sp.err && <p className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm text-rose-300">{sp.err}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required><input name="name" required defaultValue={editing?.name} className="input" /></Field>
              <Field label="Phone"><input name="phone" defaultValue={editing?.phone ?? ''} className="input" /></Field>
              <Field label="CNIC"><input name="cnic" defaultValue={editing?.cnic ?? ''} className="input" /></Field>
              <Field label="Profit share %"><input name="sharePercent" type="number" min={0} max={100} step="0.5" defaultValue={editing ? Number(editing.sharePercent) : defShare} className="input" /></Field>
              <Field label="Address" className="sm:col-span-2"><input name="address" defaultValue={editing?.address ?? ''} className="input" /></Field>
              <Field label="Bank details" className="sm:col-span-2"><input name="bankDetails" defaultValue={editing?.bankDetails ?? ''} placeholder="Bank, account title, IBAN" className="input" /></Field>
            </div>
            <Field label="Assigned vehicles">
              <div className="grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-line bg-panel2 p-3 sm:grid-cols-2">
                {cars.map((c) => { const other = c.investorId && c.investorId !== editing?.id ? investors.find((i) => i.id === c.investorId)?.name : null;
                  return <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="vehicleIds" value={c.id} defaultChecked={!!editing && c.investorId === editing.id} className="accent-[#D4A52C]" />{c.model} ({c.regNo}){other && <span className="text-xs text-amber-400">· {other}</span>}</label>; })}
              </div></Field>
            <div className="flex justify-end gap-2"><Link href="/admin/investors" className="btn-ghost">Cancel</Link><Submit>{editing ? 'Save' : 'Add'}</Submit></div>
          </form>
        </Modal>)}

      {s && (
        <Modal title={`${s.investor.name} · ${monthLabel(month)}`} closeHref="/admin/investors" wide>
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Link className="btn-ghost btn-sm" href={`/admin/investors?view=${s.investor.id}&month=${addMonths(month, -1)}`}>‹ Prev</Link>
              <form method="get" className="flex gap-1"><input type="hidden" name="view" value={s.investor.id} /><input type="month" name="month" defaultValue={month} className="input py-1" /><button className="btn-ghost btn-sm">Go</button></form>
              <Link className="btn-ghost btn-sm" href={`/admin/investors?view=${s.investor.id}&month=${addMonths(month, 1)}`}>Next ›</Link>
            </div>
            <PrintButton label="Print statement" />
          </div>
          <div className="print-area">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Kpi label="Booking revenue" value={pkr(s.revenue)} hint="Full booking total — paid or not" icon={<DollarSign size={16} />} tone="blue" />
              <Kpi label="Investor share" value={pkr(s.share)} hint={`${s.pct}% of revenue`} icon={<Percent size={16} />} tone="purple" />
              <Kpi label="Maintenance" value={pkr(-s.maintenance)} hint="Deducted from investor share" icon={<Wrench size={16} />} tone="red" />
              <Kpi label="Investor payable" value={pkr(s.payable)} hint={s.payout ? `Paid ${fmtDateTime(s.payout.paidAt)}` : 'Due at month end'} icon={<Wallet size={16} />} tone="green" />
              <Kpi label="Your revenue" value={pkr(s.office)} hint="Office keeps after payout" icon={<TrendingUp size={16} />} tone="yellow" />
            </div>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl bg-panel2 p-3 text-sm"><Calculator size={16} className="text-gold" /> How it&apos;s calculated: <b>{pkr(s.revenue)}</b> × <b className="text-sky-400">{s.pct}%</b> − <b className="text-rose-400">{pkr(s.maintenance)}</b> = <b className="text-emerald-400">{pkr(s.payable)}</b></p>
            <h3 className="mb-2 mt-6 font-bold">Profit by car</h3>
            <div className="space-y-2">
              {s.perCar.length === 0 && <p className="text-sm text-muted">No cars assigned to this investor.</p>}
              {s.perCar.map((x) => (
                <div key={x.car.id} className="rounded-xl border border-line bg-panel2 p-4">
                  <div className="flex items-center gap-2"><p className="font-bold">{x.car.model} ({x.car.regNo})</p><Badge status={x.status} label={V_STATUS_LABEL[x.status]} /><span className="text-xs text-muted">{x.bookings} booking(s)</span></div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <p><span className="block text-[10px] uppercase text-muted">Revenue</span>{pkr(x.revenue)}</p>
                    <p><span className="block text-[10px] uppercase text-muted">Share ({s.pct}%)</span><span className="text-sky-400">{pkr(x.share)}</span></p>
                    <p><span className="block text-[10px] uppercase text-muted">Maintenance</span><span className="text-rose-400">{pkr(-x.maintenance)}</span></p>
                    <p><span className="block text-[10px] uppercase text-muted">Payable</span><span className="font-bold text-emerald-400">{pkr(x.payable)}</span></p>
                  </div>
                </div>))}
            </div>
            {s.investor.bankDetails && <p className="mt-4 text-sm text-muted">Bank: {s.investor.bankDetails}</p>}
          </div>
          {canEdit && !s.payout && s.perCar.length > 0 && (
            <form action={markPaid} className="no-print mt-5 flex items-end justify-end gap-2 border-t border-line pt-4">
              <input type="hidden" name="investorId" value={s.investor.id} /><input type="hidden" name="month" value={month} />
              <Field label="Paid by"><select name="method" className="input">{['Bank transfer', 'Cash', 'JazzCash', 'Easypaisa'].map((m) => <option key={m}>{m}</option>)}</select></Field>
              <Submit><CheckCircle2 size={16} /> Mark {monthLabel(month)} as paid ({pkr(s.payable)})</Submit>
            </form>)}
          {s.payout && <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">Payout of {pkr(s.payout.payable)} recorded on {fmtDateTime(s.payout.paidAt)} and added to Expenses.</p>}
        </Modal>)}
    </div>
  );
}
