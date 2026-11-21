import { SignJWT, jwtVerify } from 'jose';

export type SessionUser = { id: number; name: string; email: string; role: string; pv?: string };
export type PortalSession = { customerId: string; name: string; kind?: 'portal' };

let warned = false;
function secret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') {
    // Never sign sessions with a guessable key in production.
    throw new Error('AUTH_SECRET is missing or shorter than 32 characters. Set it in your environment variables.');
  }
  if (!warned) { console.warn('[auth] AUTH_SECRET not set (or too short) — using an insecure development key.'); warned = true; }
  return s || 'dev-insecure-secret-change-me-dev-insecure-secret';
}
const key = () => new TextEncoder().encode(secret());

export async function sign(payload: Record<string, unknown>, days = 7) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${days}d`).sign(key());
}
export async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    return payload as unknown as T;
  } catch {
    return null;
  }
}
export const SESSION_COOKIE = 'sm_session';
export const PORTAL_COOKIE = 'sm_portal';

export const cookieOpts = (maxAgeDays: number) => ({
  httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * maxAgeDays,
});
