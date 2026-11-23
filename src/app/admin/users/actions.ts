'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { int, str } from '@/lib/format';
import { MODULE_KEYS } from '@/lib/modules';
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
    }
  }
  const status = id === me.id ? 'ACTIVE' : oneOf(fd.get('status'), ['ACTIVE', 'INACTIVE'] as const, 'ACTIVE');
  const data = { name: name.slice(0, 100), email, phone: str(fd.get('phone')), role, status };
  if (id) await db.update(schema.users).set({ ...data, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) }).where(eq(schema.users.id, id));
  else await db.insert(schema.users).values({ ...data, passwordHash: await bcrypt.hash(password, 10) });
  await log(id ? 'update' : 'create', 'user', id || email, role);
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function savePermissions(fd: FormData) {
  const me = await requirePerm('users', 'edit');
  const role = String(fd.get('role') ?? '').toUpperCase().replace(/[^A-Z_]/g, '');
  if (!role || role === 'ADMIN') redirect('/admin/users?tab=roles');
  // A non-admin must not widen the permissions of their own role
  if (me.role !== 'ADMIN' && role === me.role) redirect(`/admin/users?tab=roles&role=${role}`);
  for (const m of MODULE_KEYS) {
    const v = { canView: fd.get(`${m}.view`) === 'on', canCreate: fd.get(`${m}.create`) === 'on', canEdit: fd.get(`${m}.edit`) === 'on', canDelete: fd.get(`${m}.delete`) === 'on' };
    await db.insert(schema.rolePermissions).values({ role, module: m, ...v }).onConflictDoUpdate({ target: [schema.rolePermissions.role, schema.rolePermissions.module], set: v });
  }
  await log('update permissions', 'role', role);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/users?tab=roles&role=${role}&saved=1`);
}

export async function saveSettings(fd: FormData) {
  await requirePerm('users', 'edit');
  for (const key of ['business_name', 'business_phone', 'business_address', 'fine_grace_hours', 'default_investor_share', 'agreement_terms']) {
    const value = String(fd.get(key) ?? '');
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
  await cacheDelPattern('setting:*');
  await log('update', 'settings');
  revalidatePath('/admin', 'layout');
  redirect('/admin/users?tab=settings&saved=1');
}
