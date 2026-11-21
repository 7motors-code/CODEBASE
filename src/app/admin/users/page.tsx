import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { Plus, Pencil } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can, getPerms } from '@/lib/auth';
import { getSetting } from '@/lib/calc';
import { fmtDateTime } from '@/lib/format';
import { EN } from '@/lib/i18n';
import { MODULE_KEYS, ROLES } from '@/lib/modules';
import { Badge, Card, Field, Modal, PageHeader, TableWrap, Empty, Avatar } from '@/components/ui';
import { Submit } from '@/components/client';
import { saveUser, savePermissions, saveSettings } from './actions';

export default async function UsersPage({ searchParams: sp }: { searchParams: { tab?: string; new?: string; edit?: string; err?: string; role?: string; saved?: string } }) {
  const me = await requirePerm('users');
  const [canCreate, canEdit] = await Promise.all([can('users', 'create'), can('users', 'edit')]);
  const users = await db.select().from(schema.users).orderBy(schema.users.name);
  const roles = Array.from(new Set([...ROLES, ...users.map((u) => u.role)]));
  const tab = sp.tab ?? 'users';
  const editing = sp.edit ? users.find((u) => u.id === Number(sp.edit)) : undefined;
  const role = sp.role && roles.includes(sp.role) ? sp.role : 'MANAGER';
  const perms = await getPerms(role);
  const logs = tab === 'log' ? await db.select().from(schema.activityLogs).orderBy(desc(schema.activityLogs.createdAt)).limit(200) : [];
  const settings = tab === 'settings' ? {
    business_name: await getSetting('business_name', 'Seven Motors'), business_phone: await getSetting('business_phone', ''), business_address: await getSetting('business_address', ''),
    fine_grace_hours: await getSetting('fine_grace_hours', '1'), default_investor_share: await getSetting('default_investor_share', '50'), agreement_terms: await getSetting('agreement_terms', ''),
  } : null;
  const T = (k: string, l: string) => <Link href={`/admin/users?tab=${k}`} className={`btn-sm btn ${tab === k ? 'bg-gold text-navy-dark' : 'btn-ghost'}`}>{l}</Link>;
  return (
    <div>
      <PageHeader title="User Management" subtitle="Staff logins, roles, permissions and business settings">
        {canCreate && tab === 'users' && <Link href="/admin/users?new=1" className="btn-gold"><Plus size={16} /> Add user</Link>}
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">{T('users', 'Users')}{T('roles', 'Roles & permissions')}{T('settings', 'Business settings')}{T('log', 'Activity log')}</div>
      {sp.saved && <p className="mb-4 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">Saved.</p>}

      {tab === 'users' && <Card><TableWrap><table className="tbl">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Last login</th><th></th></tr></thead>
        <tbody>{users.map((u) => <tr key={u.id}><td><span className="flex items-center gap-2 font-semibold"><Avatar name={u.name} />{u.name}{u.id === me.id && <span className="text-xs text-muted">(you)</span>}</span></td><td>{u.email}</td><td>{u.phone ?? '—'}</td><td><span className="badge bg-gold/15 text-gold">{u.role}</span></td><td><Badge status={u.status} /></td><td>{fmtDateTime(u.lastLogin)}</td>
          <td className="text-end">{canEdit && <Link href={`/admin/users?edit=${u.id}`} className="btn-ghost btn-sm"><Pencil size={13} /></Link>}</td></tr>)}</tbody></table></TableWrap></Card>}

      {tab === 'roles' && (
        <Card title="Permission matrix" actions={<form method="get" className="flex gap-2"><input type="hidden" name="tab" value="roles" /><select name="role" defaultValue={role} className="input py-1">{roles.filter((r) => r !== 'ADMIN').map((r) => <option key={r}>{r}</option>)}</select><button className="btn-ghost btn-sm">Open</button></form>}>
          <form action={savePermissions}>
            <input type="hidden" name="role" value={role} />
            <TableWrap><table className="tbl"><thead><tr><th>Module</th><th>View</th><th>Create</th><th>Edit</th><th>Delete</th></tr></thead><tbody>
              {MODULE_KEYS.map((m) => <tr key={m}><td className="font-semibold">{EN[m]}</td>{(['view', 'create', 'edit', 'delete'] as const).map((a) => <td key={a}><input type="checkbox" name={`${m}.${a}`} defaultChecked={perms[m][a]} disabled={!canEdit} className="h-4 w-4 accent-[#D4A52C]" /></td>)}</tr>)}
            </tbody></table></TableWrap>
            <div className="flex items-center justify-between p-4 text-xs text-muted"><span>ADMIN always has full access. To create a custom role, type a new role name when adding a user, then set its permissions here.</span>{canEdit && <Submit>Save {role} permissions</Submit>}</div>
          </form>
        </Card>)}

      {tab === 'settings' && settings && (
        <Card title="Business settings"><form action={saveSettings} className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Business name (shown on sidebar, agreements and reports)"><input name="business_name" defaultValue={settings.business_name} className="input" /></Field>
          <Field label="Business phone"><input name="business_phone" defaultValue={settings.business_phone} className="input" /></Field>
          <Field label="Business address" className="md:col-span-2"><input name="business_address" defaultValue={settings.business_address} className="input" /></Field>
          <Field label="Late return grace period (hours)"><input name="fine_grace_hours" type="number" min={0} step="0.5" defaultValue={settings.fine_grace_hours} className="input" /></Field>
          <Field label="Default investor share (%)"><input name="default_investor_share" type="number" min={0} max={100} defaultValue={settings.default_investor_share} className="input" /></Field>
          <Field label="Rental agreement terms (one per line)" className="md:col-span-2"><textarea name="agreement_terms" rows={7} defaultValue={settings.agreement_terms} className="input" /></Field>
          {canEdit && <div className="md:col-span-2 flex justify-end"><Submit>Save settings</Submit></div>}
        </form></Card>)}

      {tab === 'log' && <Card title="Activity log (latest 200)"><TableWrap><table className="tbl"><thead><tr><th>When</th><th>User</th><th>Action</th><th>Record</th><th>Details</th></tr></thead><tbody>
        {logs.length === 0 && <Empty cols={5} />}
        {logs.map((l) => <tr key={l.id}><td className="whitespace-nowrap">{fmtDateTime(l.createdAt)}</td><td>{l.userName}</td><td className="capitalize">{l.action}</td><td>{l.entity} <span className="font-mono text-xs text-muted">{l.entityId}</span></td><td className="text-muted">{l.details ?? ''}</td></tr>)}
      </tbody></table></TableWrap></Card>}

      {(sp.new || editing) && (
        <Modal title={editing ? `Edit ${editing.name}` : 'Add User'} closeHref="/admin/users">
          <form action={saveUser} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {sp.err && <p className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm text-rose-300">{sp.err}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required><input name="name" required defaultValue={editing?.name} className="input" /></Field>
              <Field label="Email (login)" required><input name="email" type="email" required defaultValue={editing?.email} className="input" /></Field>
              <Field label="Phone"><input name="phone" defaultValue={editing?.phone ?? ''} className="input" /></Field>
              <Field label="Role"><input name="role" list="roles" defaultValue={editing?.role ?? 'STAFF'} className="input uppercase" /><datalist id="roles">{roles.map((r) => <option key={r} value={r} />)}</datalist></Field>
              <Field label={editing ? 'New password (leave blank to keep)' : 'Password'} required={!editing}><input name="password" type="password" minLength={8} required={!editing} className="input" /></Field>
              {editing && <Field label="Status"><select name="status" defaultValue={editing.status} className="input"><option>ACTIVE</option><option>INACTIVE</option></select></Field>}
            </div>
            <div className="flex justify-end gap-2"><Link href="/admin/users" className="btn-ghost">Cancel</Link><Submit>{editing ? 'Save' : 'Add user'}</Submit></div>
          </form>
        </Modal>)}
    </div>
  );
}
