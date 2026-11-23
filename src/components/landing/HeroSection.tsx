import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroBackdrop } from './HeroBackdrop';
import { TripSearch } from './TripSearch';

interface HeroSectionProps {
  totalVehicles: number;
  graceHours: number;
}

export function HeroSection({ totalVehicles, graceHours }: HeroSectionProps) {
  return (
    <section className="relative" aria-labelledby="hero-heading">
      {/* Full-bleed photo band */}
      <div data-surface="dark" className="relative isolate overflow-hidden text-white">
        <HeroBackdrop />
        <div className="mx-auto flex min-h-[620px] max-w-7xl flex-col justify-center px-4 pb-36 pt-16 sm:px-6 md:min-h-[calc(100svh-4rem)] md:max-h-[920px] md:pb-44 lg:px-8">
          <div className="min-w-0 max-w-[40rem]">
            <h1 id="hero-heading" className="display text-[44px] leading-[1.02] sm:text-[58px] lg:text-[72px]">
              <span className="line-mask"><span>Rent by the day,</span></span>
              <span className="line-mask"><span style={{ animationDelay: '90ms' }}>or just the</span></span>
              <span className="line-mask"><span style={{ animationDelay: '180ms' }}><span className="ink-underline text-gold">12 hours</span> you need</span></span>
            </h1>
            <p className="reveal reveal-d4 mt-6 max-w-[34rem] text-lg leading-[1.6] text-white/90">
              Self-drive or with a driver. Every return gets a {graceHours}-hour grace window, and the rate on the car is the rate you pay.
            </p>
            <div className="reveal reveal-d5 mt-8 flex flex-wrap items-center gap-3">
              <a href="#fleet" className="btn-accent btn-lg group">
                Browse the fleet
                <ArrowRight size={18} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180" />
              </a>
              <Link href="/portal/my" className="btn-on-dark btn-lg backdrop-blur-sm">Track a booking</Link>
            </div>
            <dl className="reveal reveal-d5 mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6 sm:gap-6">
              {totalVehicles > 0 ? <Fact value={String(totalVehicles)} label="cars listed" /> : <Fact value="4" label="car classes" />}
              <Fact value="12h" label="shortest rental" />
              <Fact value={`${graceHours}h`} label="return grace" />
            </dl>
          </div>
        </div>
      </div>

      {/* Booking widget overlapping the photo band */}
      <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 sm:px-6 md:-mt-28 lg:px-8">
        <div className="reveal reveal-d5">
          <TripSearch graceHours={graceHours} />
        </div>
      </div>
    </section>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-mono text-2xl font-medium tabular-nums text-white">{value}</dd>
      <dd aria-hidden className="mt-0.5 text-[13px] text-white/85">{label}</dd>
    </div>
  );
}
