'use server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, schema } from '@/db';
import { sign, SESSION_COOKIE, cookieOpts } from '@/lib/session';
import { clearRateLimit, clientIp, hitRateLimit, isRateLimited, passwordVersion } from '@/lib/security';

// Used so a wrong email takes as long as a wrong password (no account discovery by timing)
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.pV7Q6x6Q0p3WJm0n2qvC6R4Y0j3a';

export async function login(_: unknown, fd: FormData) {
  const email = String(fd.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const password = String(fd.get('password') ?? '').slice(0, 200);
  const ipKey = `login:ip:${clientIp()}`, emailKey = `login:email:${email}`;
  if ((await isRateLimited(ipKey, 20, 15)) || (await isRateLimited(emailKey, 8, 15))) {
    return { error: 'Too many failed attempts. Please wait 15 minutes and try again.' };
  }
  const [u] = email ? await db.select().from(schema.users).where(eq(schema.users.email, email)) : [];
  const ok = await bcrypt.compare(password, u?.passwordHash ?? DUMMY_HASH);
  if (!u || !ok || u.status !== 'ACTIVE') {
    await hitRateLimit(ipKey); await hitRateLimit(emailKey);
    return { error: 'Wrong email or password.' };
  }
  await clearRateLimit(emailKey);
  await db.update(schema.users).set({ lastLogin: new Date() }).where(eq(schema.users.id, u.id));
  const token = await sign({ id: u.id, name: u.name, email: u.email, role: u.role, pv: passwordVersion(u.passwordHash) });
  cookies().set(SESSION_COOKIE, token, cookieOpts(7));
  redirect('/admin');
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect('/login');
}
