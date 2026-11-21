import { NextResponse, type NextRequest } from 'next/server';
import { verify, SESSION_COOKIE } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const s = await verify(req.cookies.get(SESSION_COOKIE)?.value);
  if (!s) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*'] };
