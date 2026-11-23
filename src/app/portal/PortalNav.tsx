'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [{ href: '/portal', label: 'Cars' }, { href: '/portal/my', label: 'My bookings' }] as const;

/** Portal navigation; marks the current page for screen readers and visually. */
export function PortalNav() {
  const path = usePathname();
  return (
    <nav aria-label="Portal" className="ms-auto flex shrink-0 items-center gap-1 text-sm">
      {LINKS.map((l) => {
        const on = path === l.href;
        return (
          <Link key={l.href} href={l.href} aria-current={on ? 'page' : undefined}
            className={`rounded-md px-2.5 py-2 transition-colors duration-150 sm:px-3 ${on ? 'bg-panel2 font-medium text-ink' : 'text-ink2 hover:bg-panel2 hover:text-ink'}`}>
            {l.label}
          </Link>);
      })}
    </nav>
  );
}
