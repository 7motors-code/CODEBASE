import Link from 'next/link';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { Plus, Pencil, Trash2, CalendarRange, Paperclip } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { addMonths, fmtDate, MONTHS, pkDay, pkMonth, pkr } from '@/lib/format';
import { Card, Field, Kpi, Modal, PageHeader, Pagination, TableWrap, Empty, href, paginate } from '@/components/ui';
import { ConfirmForm, ImageInput, Submit } from '@/components/client';
import { LinesChart, Donut } from '@/components/Charts';
import { saveExpense, deleteExpense } from './actions';

const PALETTE = ['#0B2A5B', '#1E4A8F', '#4A6FA8', '#7C97C2', '#A9BCD9', '#D4A52C', '#A87C14', '#6C717D', '#C9CCD3'];

export default async function ExpensesPage({ searchParams: sp }: { searchParams: { from?: string; to?: string; new?: string; edit?: string; err?: string; page?: string; q?: string; category?: string } }) {
  await requirePerm('expenses');
  const [canCreate, canEdit, canDelete] = await Promise.all([can('expenses', 'create'), can('expenses', 'edit'), can('expenses', 'delete')]);
  const all = await db.select().from(schema.expenses).where(and(sp.from ? gte(schema.expenses.date, sp.from) : sql`true`, sp.to ? lte(schema.expenses.date, sp.to) : sql`true`)).orderBy(desc(schema.expenses.date), desc(schema.expenses.createdAt));
  const cats = await db.select().from(schema.lookups).where(eq(schema.lookups.kind, 'EXPENSE_CATEGORY')).orderBy(schema.lookups.name);
  // maintenance counts as expense too (shown separately)
  const maint = await db.select({ s: sql<number>`coalesce(sum(${schema.maintenance.cost}),0)::int` }).from(schema.maintenance).where(and(sp.from ? gte(schema.maintenance.date, sp.from) : sql`true`, sp.to ? lte(schema.maintenance.date, sp.to) : sql`true`));
  const q = (sp.q ?? '').toLowerCase();
  const list = all.filter((e) => (!q || `${e.id} ${e.description} ${e.category}`.toLowerCase().includes(q)) && (!sp.category || e.category === sp.category));
  const pg = paginate(list, sp.page);
  const total = all.reduce((s, e) => s + e.amount, 0);
  const byCat = new Map<string, number>(); all.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
  const catList = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const month = pkMonth();
  const months = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5));
  const allTime = await db.select({ date: schema.expenses.date, amount: schema.expenses.amount }).from(schema.expenses).where(gte(schema.expenses.date, months[0] + '-01'));
  const series = months.map((m) => ({ label: MONTHS[Number(m.slice(5)) - 1], expenses: allTime.filter((e) => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0) }));
  const avg = series.slice(0, 5).reduce((s, x) => s + x.expenses, 0) / 5;
  const thisM = series[5].expenses;
  const vsAvg = avg ? Math.round(((thisM - avg) / avg) * 100) : 0;
  const editing = sp.edit ? all.find((e) => e.id === sp.edit) ?? (await db.select().from(schema.expenses).where(eq(schema.expenses.id, sp.edit)))[0] : undefined;
  const base = { from: sp.from, to: sp.to, q: sp.q, category: sp.category };
  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" subtitle="Office running costs: salaries, rent, utilities and more">
        <form method="get" className="flex items-center gap-1"><CalendarRange size={16} className="text-muted" /><input type="date" name="from" defaultValue={sp.from} className="input py-1.5" /><span className="text-muted">–</span><input type="date" name="to" defaultValue={sp.to} className="input py-1.5" /><button className="btn-ghost btn-sm">Date range</button></form>
        {canCreate && <Link href={href('/admin/expenses', base, { new: 1 })} className="btn-primary"><Plus size={16} /> Add expense</Link>}
      </PageHeader>
      {sp.err && !sp.new && !sp.edit && <p className="rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">{sp.err}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi featured label="Total expenses" value={pkr(total)} tone="red" hint={<span className={vsAvg > 0 ? 'text-bad' : 'text-ok'}>This month {vsAvg >= 0 ? '+' : ''}{vsAvg}% vs 5-month average</span>} />
        <Kpi label="Biggest category" value={catList[0]?.[0] ?? '—'} tone="cyan" hint={catList[0] ? `${pkr(catList[0][1])} · high impact on monthly cost` : undefined} />
        <Kpi label="Total records" value={all.length} tone="green" hint="Tracked expenses" />
        <Kpi label="Maintenance (separate)" value={pkr(maint[0].s)} tone="yellow" hint={<Link href="/admin/maintenance" className="link">From Maintenance module</Link>} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Monthly expenses"><div className="p-3"><LinesChart data={series} lines={[{ key: 'expenses', name: 'Expenses', color: '#f43f5e' }]} height={240} /></div></Card>
        <Card title="Expense categories">
          <div className="grid items-center gap-2 p-3 sm:grid-cols-2"><Donut data={catList.map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))} height={220} />
            <div className="space-y-1 text-sm">{catList.length === 0 && <p className="text-muted">No expenses yet</p>}{catList.map(([n, v], i) => <div key={n} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{n}<span className="ms-auto font-medium">{pkr(v)}</span></div>)}</div></div>
        </Card>
      </div>
      <Card title="Recent expenses">
        <form className="no-print flex flex-wrap gap-2 p-4" method="get">{sp.from && <input type="hidden" name="from" value={sp.from} />}{sp.to && <input type="hidden" name="to" value={sp.to} />}
          <input name="q" defaultValue={sp.q} placeholder="Search description or ID" className="input max-w-sm" />
          <select name="category" defaultValue={sp.category} className="input w-48"><option value="">All categories</option>{cats.map((c) => <option key={c.id}>{c.name}</option>)}</select><button className="btn-ghost">Filter</button></form>
        <TableWrap><table className="tbl">
          <thead><tr><th>Date</th><th>Expense ID</th><th>Description</th><th>Category</th><th>Method</th><th>Amount</th><th className="text-end">Action</th></tr></thead>
          <tbody>
            {pg.slice.length === 0 && <Empty cols={7} />}
            {pg.slice.map((e) => (
              <tr key={e.id}><td>{fmtDate(e.date)}</td><td className="font-mono text-xs">{e.id}</td><td>{e.description ?? '—'}{e.receiptId && <a href={`/api/files/${e.receiptId}`} target="_blank" className="ms-2 inline-flex text-navy"><Paperclip size={13} /></a>}</td><td><span className="badge bg-panel2 text-ink">{e.category}</span></td><td>{e.method}</td><td className="font-medium text-bad">{pkr(e.amount)}</td>
                <td><div className="flex justify-end gap-1">{canEdit && e.source === 'MANUAL' && <Link className="btn-ghost btn-sm" href={href('/admin/expenses', base, { edit: e.id })}><Pencil size={13} /></Link>}
                  {canDelete && e.source === 'MANUAL' && <ConfirmForm action={deleteExpense} hidden={{ id: e.id }} message="Delete this expense?" className="btn-ghost btn-sm text-bad"><Trash2 size={13} /></ConfirmForm>}
                  {e.source !== 'MANUAL' && <span className="text-[11px] text-muted">{e.source === 'DRIVER' ? 'driver pay' : 'investor payout'}</span>}</div></td></tr>))}
          </tbody></table></TableWrap>
        <Pagination {...pg} makeHref={(p) => href('/admin/expenses', base, { page: p })} />
      </Card>
      {(sp.new || editing) && (
        <Modal title={editing ? `Edit ${editing.id}` : 'Add expense'} closeHref={href('/admin/expenses', base)}>
          <form action={saveExpense} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {sp.err && <p className="rounded-xl bg-bad-soft px-4 py-2 text-sm text-bad">{sp.err}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" required><input type="date" name="date" required defaultValue={editing?.date ?? pkDay()} className="input" /></Field>
              <Field label="Category" required><input name="category" list="ecats" required defaultValue={editing?.category} placeholder="Pick or type new" className="input" /><datalist id="ecats">{cats.map((c) => <option key={c.id} value={c.name} />)}</datalist></Field>
              <Field label="Amount (PKR)" required><input type="number" name="amount" min={1} required defaultValue={editing?.amount} className="input" /></Field>
              <Field label="Payment method"><select name="method" defaultValue={editing?.method ?? 'Cash'} className="input">{['Cash', 'Bank transfer', 'JazzCash', 'Easypaisa', 'Card', 'Cheque'].map((m) => <option key={m}>{m}</option>)}</select></Field>
            </div>
            <Field label="Description"><input name="description" defaultValue={editing?.description ?? ''} className="input" placeholder="e.g. November office rent" /></Field>
            <ImageInput name="receipt" label="Receipt (optional)" current={editing?.receiptId} accept="image/*,application/pdf" />
            <div className="flex justify-end gap-2"><Link href={href('/admin/expenses', base)} className="btn-ghost">Cancel</Link><Submit>{editing ? 'Save' : 'Add expense'}</Submit></div>
          </form>
        </Modal>)}
    </div>
  );
}
