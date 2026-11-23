import Link from 'next/link';
import { getSetting } from '@/lib/calc';
import { BrandMark } from '@/components/BrandMark';
import { buildContact } from '@/lib/contact';
import { PortalNav } from './PortalNav';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const [business, phone] = await Promise.all([getSetting('business_name', 'Seven Motors'), getSetting('business_phone', '')]);
  const contact = buildContact(phone);
  return (
    // The portal is English-only, so it stays LTR even when the staff panel is set to Urdu.
    <div lang="en" dir="ltr" className="flex min-h-screen flex-col bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-navy-dark focus:shadow-float">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link href="/" className="min-w-0" aria-label={`${business} home`}><BrandMark name={business} caption="Customer portal" size={32} /></Link>
          <PortalNav />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 outline-none sm:px-6">{children}</main>
      <footer className="border-t border-line py-6 text-center text-[13px] text-ink2">
        {business}
        {contact.telHref && <> · <a href={contact.telHref} className="font-mono tabular-nums hover:text-ink">{contact.phone}</a></>}
      </footer>
    </div>
  );
}
