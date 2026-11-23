'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Phone, X } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

const NAV_LINKS = [
  { href: '#fleet', label: 'Fleet' },
  { href: '#how-it-works', label: 'How renting works' },
  { href: '#locations', label: 'Locations' },
  { href: '#concierge', label: 'Group bookings' },
] as const;

interface LandingNavProps {
  businessName: string;
  phone: string;
  telHref: string | null;
}

export function LandingNav({ businessName, phone, telHref }: LandingNavProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b bg-navy-dark text-white transition-shadow duration-150 ${
        scrolled ? 'border-white/10 shadow-float' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label={`${businessName} home`} className="shrink-0">
          <BrandMark name={businessName} size={34} tone="white" priority />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-white/75 transition-colors duration-150 hover:bg-white/10 hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1">
          {telHref && (
            <a href={telHref} className="hidden items-center gap-2 rounded-md px-3 py-2 font-mono text-[13px] tabular-nums text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white lg:flex">
              <Phone size={16} strokeWidth={1.5} className="text-gold" />
              {phone}
            </a>
          )}
          <Link href="/login" className="hidden rounded-md px-3 py-2 text-sm text-white/75 transition-colors duration-150 hover:bg-white/10 hover:text-white sm:block">
            Staff login
          </Link>
          <a href="#fleet" className="btn-accent btn-sm ms-1 hidden h-9 px-4 text-sm sm:inline-flex">
            Book a car
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="btn h-9 w-9 px-0 text-white hover:bg-white/10 md:hidden"
          >
            {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-panel px-4 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex h-11 items-center rounded-md px-3 text-[15px] text-ink hover:bg-panel2">
              {l.label}
            </a>
          ))}
          <Link href="/portal/my" onClick={() => setOpen(false)} className="flex h-11 items-center rounded-md px-3 text-[15px] text-ink hover:bg-panel2">
            Track a booking
          </Link>
          <Link href="/login" onClick={() => setOpen(false)} className="flex h-11 items-center rounded-md px-3 text-[15px] text-ink2 hover:bg-panel2">
            Staff login
          </Link>
          <div className="mt-3 grid gap-2">
            <a href="#fleet" onClick={() => setOpen(false)} className="btn-accent btn-lg w-full">Book a car</a>
            {telHref && <a href={telHref} className="btn-ghost btn-lg w-full font-mono tabular-nums">{phone}</a>}
          </div>
        </nav>
      )}
    </header>
  );
}
