import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { Plus, Pencil, Trash2, Wrench, CheckCircle2, AlertOctagon, CalendarClock, Hammer } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { fmtDate, pkDay, pkr } from '@/lib/format';
import { Badge, Card, Field, Kpi, Modal, PageHeader, Pagination, TableWrap, Empty, href, paginate, Plate } from '@/components/ui';
import { ConfirmForm, Submit } from '@/components/client';
import { saveMaintenance, setMaintenanceStatus, deleteMaintenance } from './actions';

export default async function MaintenancePage({ searchParams: sp }: { searchParams: { q?: string; status?: string; new?: string; edit?: string; err?: string; page?: string } }) {
  await requirePerm('maintenance');
  const [canCreate, canEdit, canDelete] = await Promise.all([can('maintenance', 'create'), can('maintenance', 'edit'), can('maintenance', 'delete')]);
  const today = pkDay();
  const rows = await db.select({ m: schema.maintenance, v: schema.vehicles }).from(schema.maintenance)
    .leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.maintenance.vehicleId)).orderBy(desc(schema.maintenance.date));
  const eff = (m: typeof rows[number]['m']) => (m.status === 'SCHEDULED' && m.date < today ? 'OVERDUE' : m.status);
  const q = (sp.q ?? '').toLowerCase();
  const list = rows.filter(({ m, v }) => (!q || `${m.id} ${v?.model} ${v?.regNo} ${m.types.join(' ')} ${eff(m)}`.toLowerCase().includes(q)) && (!sp.status || eff(m) === sp.status));
  const pg = paginate(list, sp.page);
  const n = (s: string) => rows.filter((r) => eff(r.m) === s).length;
  const vehicles = await db.select().from(schema.vehicles).where(eq(schema.vehicles.active, true)).orderBy(schema.vehicles.model);
  const types = await db.select().from(schema.lookups).where(eq(schema.lookups.kind, 'MAINT_TYPE')).orderBy(schema.lookups.name);
  const editing = sp.edit ? rows.find((r) => r.m.id === sp.edit)?.m : null;
  const totalCost = rows.reduce((s, r) => s + r.m.cost, 0);
  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" subtitle={`Track vehicle maintenance and its cost · total spent ${pkr(totalCost)}`}>
        {canCreate && <Link href="/admin/maintenance?new=1" className="btn-primary"><Plus size={16} /> Add maintenance</Link>}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/maintenance?status=OVERDUE"><Kpi featured label="Overdue" value={n('OVERDUE')} tone="red" icon={<AlertOctagon size={18} />} /></Link>
        <Link href="/admin/maintenance?status=IN_PROGRESS"><Kpi label="In progress" value={n('IN_PROGRESS')} tone="orange" icon={<Hammer size={18} />} /></Link>
        <Link href="/admin/maintenance?status=SCHEDULED"><Kpi label="Scheduled" value={n('SCHEDULED')} tone="cyan" icon={<CalendarClock size={18} />} /></Link>
        <Link href="/admin/maintenance?status=COMPLETED"><Kpi label="Completed" value={n('COMPLETED')} tone="green" icon={<CheckCircle2 size={18} />} /></Link>
      </div>
      <Card>
        <form className="no-print flex gap-2 p-4" method="get">{sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" defaultValue={sp.q} placeholder="Search by vehicle, reg no, type or status" className="input max-w-md" /><button className="btn-ghost">Search</button>
          {sp.status && <Link href="/admin/maintenance" className="btn-ghost">Clear filter</Link>}</form>
        <TableWrap><table className="tbl">
          <thead><tr><th>ID</th><th>Vehicle</th><th>Type</th><th>Scheduled date</th><th>Meter</th><th>Status</th><th>Cost</th><th className="text-end">Action</th></tr></thead>
          <tbody>
            {pg.slice.length === 0 && <Empty cols={8} />}
            {pg.slice.map(({ m, v }) => (
              <tr key={m.id}><td className="font-mono text-xs">{m.id}</td><td className="font-medium">{v?.model}{v?.regNo && <span className="mt-1 block font-normal"><Plate reg={v.regNo} /></span>}</td>
                <td>{m.types.join(', ')}</td><td>{fmtDate(m.date)}</td><td className="text-xs">{m.meterReading?.toLocaleString() ?? '—'}{m.nextOilChangeKm && <span className="block text-muted">next oil {m.nextOilChangeKm.toLocaleString()}</span>}</td>
                <td><Badge status={eff(m)} /></td><td className="font-medium">{pkr(m.cost)}</td>
                <td><div className="flex flex-wrap justify-end gap-1">
                  {canEdit && m.status === 'SCHEDULED' && <form action={setMaintenanceStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="IN_PROGRESS" /><button className="btn-ghost btn-sm"><Wrench size={13} /> Send to workshop</button></form>}
                  {canEdit && m.status === 'IN_PROGRESS' && <form action={setMaintenanceStatus} className="flex gap-1"><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="COMPLETED" /><input name="cost" type="number" defaultValue={m.cost} className="input w-24 py-1 text-xs" title="Final cost" /><button className="btn-primary btn-sm"><CheckCircle2 size={13} /> Mark complete</button></form>}
                  {canEdit && <Link href={`/admin/maintenance?edit=${m.id}`} className="btn-ghost btn-sm" aria-label={`Edit maintenance record ${m.id}`}><Pencil size={13} aria-hidden /></Link>}
                  {canDelete && <ConfirmForm action={deleteMaintenance} hidden={{ id: m.id }} message="Delete this maintenance record?" className="btn-ghost btn-sm text-bad" ariaLabel={`Delete maintenance record ${m.id}`}><Trash2 size={13} /></ConfirmForm>}
                </div></td></tr>))}
          </tbody></table></TableWrap>
        <Pagination {...pg} makeHref={(p) => href('/admin/maintenance', { q: sp.q, status: sp.status }, { page: p })} />
      </Card>
      {(sp.new || editing) && (
        <Modal title={editing ? `Edit ${editing.id}` : 'Add maintenance expense'} closeHref="/admin/maintenance">
          <form action={saveMaintenance} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {sp.err && <p role="alert" className="rounded-xl bg-bad-soft px-4 py-2 text-sm text-bad">{sp.err}</p>}
            <Field label="Vehicle" required><select name="vehicleId" required defaultValue={editing?.vehicleId ?? ''} className="input"><option value="">Select vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.model} ({v.regNo}) · meter {v.meterReading.toLocaleString()} km</option>)}</select></Field>
            <Field label="Maintenance type (pick one or more)" required>
              <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-panel2 p-3">{types.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5 rounded-lg bg-panel px-2 py-1 text-sm"><input type="checkbox" name="types" value={t.name} defaultChecked={editing?.types.includes(t.name)} className="accent-[#D4A52C]" />{t.name}</label>))}
                <input name="newType" placeholder="+ add new type" className="input w-40 py-1" /></div></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current meter reading (km)"><input name="meterReading" type="number" defaultValue={editing?.meterReading ?? ''} className="input" /></Field>
              <Field label="Maintenance date" required><input name="date" type="date" required defaultValue={editing?.date ?? today} className="input" /></Field>
              <Field label="Cost (PKR)"><input name="cost" type="number" min={0} defaultValue={editing?.cost ?? 0} className="input" /></Field>
              <Field label="Next oil change (km)"><input name="nextOilChangeKm" type="number" defaultValue={editing?.nextOilChangeKm ?? ''} className="input" /></Field>
            </div>
            <Field label="Notes"><input name="notes" defaultValue={editing?.notes ?? ''} className="input" placeholder="Workshop name, parts" /></Field>
            {!editing && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="sendNow" value="1" className="accent-[#D4A52C]" /> Car is going to the workshop now (status In Progress)</label>}
            <div className="flex justify-end gap-2"><Link href="/admin/maintenance" className="btn-ghost">Cancel</Link><Submit>{editing ? 'Save' : 'Add'}</Submit></div>
          </form>
        </Modal>)}
    </div>
  );
}
