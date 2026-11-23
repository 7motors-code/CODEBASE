import Link from 'next/link';
import { eq, sql } from 'drizzle-orm';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { pkr } from '@/lib/format';
import { Badge, Card, Field, Modal, PageHeader, TableWrap, Empty } from '@/components/ui';
import { ConfirmForm, Submit } from '@/components/client';
import { saveLocation, deleteLocation } from './actions';

export default async function LocationsPage({ searchParams: sp }: { searchParams: { new?: string; edit?: string; err?: string } }) {
  await requirePerm('locations');
  const [canCreate, canEdit, canDelete] = await Promise.all([can('locations', 'create'), can('locations', 'edit'), can('locations', 'delete')]);
  const rows = await db.select().from(schema.locations).orderBy(schema.locations.name);
  const stats = await db.select({ id: schema.bookings.locationId, n: sql<number>`count(*)::int`, s: sql<number>`coalesce(sum(${schema.bookings.totalAmount}),0)::int` }).from(schema.bookings).where(sql`${schema.bookings.status} <> 'CANCELLED'`).groupBy(schema.bookings.locationId);
  const editing = sp.edit ? rows.find((r) => r.id === Number(sp.edit)) : undefined;
  void eq;
  return (
    <div className="space-y-6">
      <PageHeader title="Locations" subtitle="Cities, branches and pickup points used in bookings and reports">
        {canCreate && <Link href="/admin/locations?new=1" className="btn-primary"><Plus size={16} /> Add location</Link>}
      </PageHeader>
      <Card><TableWrap><table className="tbl">
        <thead><tr><th>Name</th><th>City</th><th>Address</th><th>Bookings</th><th>Revenue</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
        <tbody>
          {rows.length === 0 && <Empty cols={7} />}
          {rows.map((l) => { const st = stats.find((s) => s.id === l.id); return (
            <tr key={l.id}><td className="font-medium">{l.name}</td><td>{l.city ?? '—'}</td><td>{l.address ?? '—'}</td><td>{st?.n ?? 0}</td><td>{pkr(st?.s ?? 0)}</td><td><Badge status={l.active ? 'ACTIVE' : 'INACTIVE'} /></td>
              <td><div className="flex justify-end gap-1"><Link className="btn-ghost btn-sm" href={`/admin/bookings?location=${l.id}`}>Bookings</Link>{canEdit && <Link className="btn-ghost btn-sm" href={`/admin/locations?edit=${l.id}`}><Pencil size={13} /></Link>}
                {canDelete && <ConfirmForm action={deleteLocation} hidden={{ id: l.id }} message="Remove this location? Locations used by bookings are deactivated." className="btn-ghost btn-sm text-bad"><Trash2 size={13} /></ConfirmForm>}</div></td></tr>); })}
        </tbody></table></TableWrap></Card>
      {(sp.new || editing) && (
        <Modal title={editing ? `Edit ${editing.name}` : 'Add location'} closeHref="/admin/locations">
          <form action={saveLocation} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {sp.err && <p className="rounded-xl bg-bad-soft px-4 py-2 text-sm text-bad">{sp.err}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required><input name="name" required defaultValue={editing?.name} className="input" placeholder="e.g. Islamabad G-9 branch" /></Field>
              <Field label="City"><input name="city" defaultValue={editing?.city ?? ''} className="input" /></Field>
              <Field label="Address" className="sm:col-span-2"><input name="address" defaultValue={editing?.address ?? ''} className="input" /></Field>
              {editing && <Field label="Status"><select name="active" defaultValue={editing.active ? '1' : '0'} className="input"><option value="1">Active</option><option value="0">Inactive</option></select></Field>}
            </div>
            <div className="flex justify-end gap-2"><Link href="/admin/locations" className="btn-ghost">Cancel</Link><Submit>{editing ? 'Save' : 'Add'}</Submit></div>
          </form>
        </Modal>)}
    </div>
  );
}
