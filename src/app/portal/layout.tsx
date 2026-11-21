import Link from 'next/link';
import Image from 'next/image';
import { getSetting } from '@/lib/calc';
export const dynamic = 'force-dynamic';
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const business = await getSetting('business_name', 'Seven Motors');
  const phone = await getSetting('business_phone', '');
  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-navy-dark via-navy to-navy-light text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <Image src="/logo.jpg" alt="logo" width={48} height={48} className="rounded-full ring-2 ring-gold/60" />
          <Link href="/portal" className="text-xl font-extrabold text-gold-light">{business}</Link>
          <nav className="ms-auto flex gap-2 text-sm"><Link href="/portal" className="rounded-lg px-3 py-1.5 hover:bg-white/10">Cars</Link><Link href="/portal/my" className="rounded-lg px-3 py-1.5 hover:bg-white/10">My bookings</Link></nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="pb-8 text-center text-xs text-muted">{business}{phone && ` · ${phone}`} · Rent a car with confidence</footer>
    </div>
  );
}
