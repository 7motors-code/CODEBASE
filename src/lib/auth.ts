import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { cache } from 'react';
import { db, schema } from '@/db';
import { SESSION_COOKIE, PORTAL_COOKIE, verify, type SessionUser, type PortalSession } from './session';
import { MODULE_KEYS, defaultPerm, type Action, type ModuleKey } from './modules';
import { passwordVersion } from './security';

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const s = await verify<SessionUser>(cookies().get(SESSION_COOKIE)?.value);
  // A customer-portal token is signed with the same key; never accept it as staff.
  if (!s || typeof s.id !== 'number' || (s as { kind?: string }).kind === 'portal') return null;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, s.id));
  if (!u || u.status !== 'ACTIVE') return null;
  // Password changed since this session was issued → session is no longer valid
  if (s.pv !== passwordVersion(u.passwordHash)) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role };
});

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect('/login');
  return u;
}

export type PermMap = Record<ModuleKey, Record<Action, boolean>>;

export const getPerms = cache(async (role: string): Promise<PermMap> => {
  if (role === 'ADMIN') {
    const out = {} as PermMap;
    for (const m of MODULE_KEYS) out[m] = defaultPerm('ADMIN', m);
    return out;
  }
  const rows = await db.select().from(schema.rolePermissions).where(eq(schema.rolePermissions.role, role));
  const out = {} as PermMap;
  for (const m of MODULE_KEYS) {
    const r = rows.find((x) => x.module === m);
    out[m] = r ? { view: r.canView, create: r.canCreate, edit: r.canEdit, delete: r.canDelete } : defaultPerm(role, m);
  }
  return out;
});

export async function can(mod: ModuleKey, action: Action = 'view') {
  const u = await getUser();
  if (!u) return false;
  return (await getPerms(u.role))[mod][action];
}

/** Use at the top of pages and server actions */
export async function requirePerm(mod: ModuleKey, action: Action = 'view') {
  const u = await requireUser();
  const p = await getPerms(u.role);
  if (!p[mod][action]) {
    if (action === 'view') redirect('/admin/forbidden');
    throw new Error('You do not have permission to do this.');
  }
  return u;
}

export async function log(action: string, entity: string, entityId?: string | number | null, details?: string) {
  const u = await getUser();
  await db.insert(schema.activityLogs).values({
    userId: u?.id ?? null, userName: u?.name ?? 'Customer portal', action, entity,
    entityId: entityId == null ? null : String(entityId), details: details ?? null,
  });
}

export async function getPortal(): Promise<PortalSession | null> {
  const s = await verify<PortalSession>(cookies().get(PORTAL_COOKIE)?.value);
  if (!s?.customerId) return null;
  // Blocked or deleted customers lose portal access immediately
  const [c] = await db.select({ status: schema.customers.status }).from(schema.customers).where(eq(schema.customers.id, s.customerId));
  if (!c || c.status === 'BLOCKED') return null;
  return s;
}
