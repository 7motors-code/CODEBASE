import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';

interface LandingFooterProps {
  businessName: string;
  phone: string;
  telHref: string | null;
  address: string;
}

const COLUMNS = [
  {
    title: 'Rent',
    links: [
      { href: '#fleet', label: 'The fleet' },
      { href: '#how-it-works', label: 'How renting works' },
      { href: '#concierge', label: 'Group bookings' },
    ],
  },
  {
    title: 'Your booking',
    links: [
      { href: '/portal/my', label: 'Track a booking' },
      { href: '/portal', label: 'Customer portal' },
      { href: '#locations', label: 'Pickup locations' },
    ],
  },
] as const;

export function LandingFooter({ businessName, phone, telHref, address }: LandingFooterProps) {
  return (
    <footer className="bg-[#050f24] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <BrandMark name={businessName} caption="Car rental" size={40} tone="white" />
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Daily and 12-hour car rental in Islamabad, Rawalpindi, Lahore and Karachi.
            </p>
            {(telHref || address) && (
              <div className="mt-4 space-y-1 text-sm">
                {telHref && <a href={telHref} className="block font-mono tabular-nums text-gold hover:text-gold-light">{phone}</a>}
                {address && <p className="text-white/65">{address}</p>}
              </div>
            )}
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-white/65 transition-colors duration-150 hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[13px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {businessName}</p>
          <Link href="/login" className="transition-colors duration-150 hover:text-white">Staff login</Link>
        </div>
      </div>
    </footer>
  );
}
