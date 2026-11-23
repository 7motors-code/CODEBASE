'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { int, str } from '@/lib/format';
import { MODULE_KEYS, ROLES } from '@/lib/modules';
import { oneOf } from '@/lib/security';
import { cacheDelPattern } from '@/lib/redis';

export async function saveUser(fd: FormData) {
  const id = int(fd.get('id'));
  const me = await requirePerm('users', id ? 'edit' : 'create');
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const name = String(fd.get('name') ?? '').trim();
  const password = String(fd.get('password') ?? '');
  const role = String(fd.get('role') ?? 'STAFF').toUpperCase().replace(/[^A-Z_]/g, '') || 'STAFF';
  const back = `/admin/users?${id ? `edit=${id}` : 'new=1'}`;
  // Only built-in roles or roles that already have a permission set can be assigned.
  if (!(ROLES as readonly string[]).includes(role)) {
    const [known] = await db.select({ role: schema.rolePermissions.role }).from(schema.rolePermissions).where(eq(schema.rolePermissions.role, role)).limit(1);
    if (!known) redirect(`${back}&err=Unknown+role`);
  }
  if (!name || !email) redirect(`${back}&err=Name+and+email+are+required`);
  if (!id && password.length < 8) redirect(`${back}&err=Password+must+be+at+least+8+characters`);
  if (password && password.length < 8) redirect(`${back}&err=Password+must+be+at+least+8+characters`);
  const [dup] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (dup && dup.id !== id) redirect(`${back}&err=That+email+is+already+used`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`${back}&err=Enter+a+valid+email`);
  if (password.length > 200) redirect(`${back}&err=Password+is+too+long`);
  if (id === me.id && role !== 'ADMIN' && me.role === 'ADMIN') redirect(`${back}&err=You+cannot+remove+your+own+admin+role`);
  // Only an Admin may create Admins or change an Admin's account (stops a manager promoting themselves).
  if (me.role !== 'ADMIN') {
    if (role === 'ADMIN') redirect(`${back}&err=Only+an+Admin+can+give+the+Admin+role`);
    if (id) {
      const [target] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, id));
      if (target?.role === 'ADMIN') redirect(`${back}&err=Only+an+Admin+can+change+an+Admin+account`);
      // No self-promotion, and no taking over other accounts by resetting their password.
      if (id === me.id && role !== me.role) redirect(`${back}&err=You+cannot+change+your+own+role`);
      if (id !== me.id && password) redirect(`${back}&err=Only+an+Admin+can+reset+another+user%27s+password`);
    }
  }
  const status = id === me.id ? 'ACTIVE' : oneOf(fd.get('status'), ['ACTIVE', 'INACTIVE'] as const, 'ACTIVE');
  const data = { name: name.slice(0, 100), email: email.slice(0, 200), phone: str(fd.get('phone'))?.slice(0, 20) ?? null, role, status };
  if (id) await db.update(schema.users).set({ ...data, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) }).where(eq(schema.users.id, id));
  else await db.insert(schema.users).values({ ...data, passwordHash: await bcrypt.hash(password, 10) });
  await log(id ? 'update' : 'create', 'user', id || email, role);
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function savePermissions(fd: FormData) {
  const me = await requirePerm('users', 'edit');
  // Permission matrix changes are Admin-only: anyone else could grant a role
  // everything and then move themselves into it.
  if (me.role !== 'ADMIN') throw new Error('Only an Admin can change role permissions.');
  const role = String(fd.get('role') ?? '').toUpperCase().replace(/[^A-Z_]/g, '').slice(0, 40);
  if (!role || role === 'ADMIN') redirect('/admin/users?tab=roles');
  for (const m of MODULE_KEYS) {
    const v = { canView: fd.get(`${m}.view`) === 'on', canCreate: fd.get(`${m}.create`) === 'on', canEdit: fd.get(`${m}.edit`) === 'on', canDelete: fd.get(`${m}.delete`) === 'on' };
    await db.insert(schema.rolePermissions).values({ role, module: m, ...v }).onConflictDoUpdate({ target: [schema.rolePermissions.role, schema.rolePermissions.module], set: v });
  }
  await log('update permissions', 'role', role);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/users?tab=roles&role=${role}&saved=1`);
}

export async function saveSettings(fd: FormData) {
  const me = await requirePerm('users', 'edit');
  if (me.role !== 'ADMIN') throw new Error('Only an Admin can change business settings.');
  const grace = Number(fd.get('fine_grace_hours'));
  const share = Number(fd.get('default_investor_share'));
  if (!Number.isFinite(grace) || grace < 0 || grace > 48) redirect('/admin/users?tab=settings&err=Grace+hours+must+be+between+0+and+48');
  if (!Number.isFinite(share) || share < 0 || share > 100) redirect('/admin/users?tab=settings&err=Investor+share+must+be+between+0+and+100');
  const values: Record<string, string> = {
    business_name: String(fd.get('business_name') ?? '').trim().slice(0, 100),
    business_phone: String(fd.get('business_phone') ?? '').trim().slice(0, 20),
    business_address: String(fd.get('business_address') ?? '').trim().slice(0, 300),
    fine_grace_hours: String(Math.round(grace)),
    default_investor_share: String(share),
    agreement_terms: String(fd.get('agreement_terms') ?? '').slice(0, 20000),
  };
  for (const [key, value] of Object.entries(values)) {
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
  await cacheDelPattern('setting:*');
  await log('update', 'settings');
  revalidatePath('/admin', 'layout');
  redirect('/admin/users?tab=settings&saved=1');
}
