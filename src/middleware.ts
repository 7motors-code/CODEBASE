import { NextResponse, type NextRequest } from 'next/server';
import { verify, SESSION_COOKIE } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const s = await verify<{ id?: unknown; kind?: string }>(req.cookies.get(SESSION_COOKIE)?.value);
  // A customer-portal token is signed with the same key; it must never open /admin.
  if (!s || s.kind === 'portal' || typeof s.id !== 'number') return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*'] };
