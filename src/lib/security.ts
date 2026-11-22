import 'server-only';
import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { db, schema } from '@/db';

/**
 * Only allow redirects to paths inside this app ("/admin/...").
 * Blocks "https://evil.com", "//evil.com" and "/\\evil.com" (open-redirect attacks).
 */
export function safeBack(v: FormDataEntryValue | null | undefined, fallback: string) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s.startsWith('/') || s.startsWith('//') || s.startsWith('/\\') || /[\s\x00-\x1f\x7f]/.test(s)) return fallback;
  return s;
}

/** Short fingerprint of a password hash. Stored in the session so changing a password signs out old sessions. */
export function passwordVersion(passwordHash: string) {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}

export function clientIp() {
  const h = headers();
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim();
}

/**
 * Database-backed rate limiter (works across serverless instances).
 * Returns true when the caller is over the limit. Fails open if the table is missing,
 * so a forgotten `npm run db:push` never locks everybody out.
 */
export async function isRateLimited(key: string, max: number, windowMinutes: number) {
  try {
    const since = new Date(Date.now() - windowMinutes * 60000);
    const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.rateLimits)
      .where(and(eq(schema.rateLimits.key, key), gte(schema.rateLimits.createdAt, since)));
    return (r?.n ?? 0) >= max;
  } catch (e) {
    console.error('[rate-limit] check failed', e);
    return false;
  }
}

export async function hitRateLimit(key: string) {
  try {
    await db.insert(schema.rateLimits).values({ key });
    // occasional cleanup of old rows
    if (Math.random() < 0.02) await db.delete(schema.rateLimits).where(lt(schema.rateLimits.createdAt, new Date(Date.now() - 86400000)));
  } catch (e) {
    console.error('[rate-limit] write failed', e);
  }
}

export async function clearRateLimit(key: string) {
  try { await db.delete(schema.rateLimits).where(eq(schema.rateLimits.key, key)); } catch { /* ignore */ }
}

/** Pick a value from an allow-list, else the default */
export function oneOf<T extends string>(v: FormDataEntryValue | null | undefined, allowed: readonly T[], def: T): T {
  const s = String(v ?? '');
  return (allowed as readonly string[]).includes(s) ? (s as T) : def;
}
