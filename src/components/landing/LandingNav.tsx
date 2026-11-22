'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Shield, Search, ArrowRight, Car } from 'lucide-react';
import { toggleTheme } from '@/app/prefs-actions';

export function LandingNav({ businessName = 'Seven Motors' }: { businessName?: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-navy-dark/75 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gold to-gold-dark p-0.5 shadow-lg shadow-gold/20">
            <Image
              src="/logo.jpg"
              alt="Seven Motors"
              width={40}
              height={40}
              className="h-full w-full rounded-[10px] object-cover"
              priority
            />
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-white group-hover:text-gold-light transition-colors">
              {businessName.toUpperCase()}
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-gold/90">
              Luxury & Fleet Rentals
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden items-center gap-1 md:flex">
          <a href="#fleet" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition">
            Fleet
          </a>
          <a href="#experience" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition">
            Experience
          </a>
          <a href="#locations" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition">
            Locations
          </a>
          <a href="#concierge" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition">
            VIP Protocol
          </a>
          <Link href="/portal/my" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gold-light hover:bg-white/10 transition">
            <Search size={13} />
            Track Booking
          </Link>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Quick Call Button */}
          <a
            href="tel:+923000000000"
            className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 sm:flex transition"
          >
            <Phone size={13} className="text-gold" />
            <span>0300-SEVEN-M</span>
          </a>

          {/* Theme Toggle Form */}
          <form action={toggleTheme}>
            <button
              type="submit"
              title="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs text-white/80 hover:bg-white/10 transition"
            >
              🌓
            </button>
          </form>

          {/* Admin Link */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent px-3.5 py-2 text-xs font-bold text-gold-light hover:border-gold hover:brightness-125 transition"
          >
            <Shield size={13} />
            <span className="hidden sm:inline">Staff</span> Portal
          </Link>
        </div>
      </div>
    </header>
  );
}
