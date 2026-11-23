import Link from 'next/link';
import { getSetting } from '@/lib/calc';
import { BrandMark } from '@/components/BrandMark';
import { buildContact } from '@/lib/contact';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const [business, phone] = await Promise.all([getSetting('business_name', 'Seven Motors'), getSetting('business_phone', '')]);
  const contact = buildContact(phone);
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/"><BrandMark name={business} caption="Customer portal" size={32} /></Link>
          <nav aria-label="Portal" className="ms-auto flex items-center gap-1 text-sm">
            <Link href="/portal" className="rounded-md px-3 py-2 text-ink2 transition-colors duration-150 hover:bg-panel2 hover:text-ink">Cars</Link>
            <Link href="/portal/my" className="rounded-md px-3 py-2 text-ink2 transition-colors duration-150 hover:bg-panel2 hover:text-ink">My bookings</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t border-line py-6 text-center text-[13px] text-muted">
        {business}
        {contact.telHref && <> · <a href={contact.telHref} className="font-mono tabular-nums hover:text-ink">{contact.phone}</a></>}
      </footer>
    </div>
  );
}
