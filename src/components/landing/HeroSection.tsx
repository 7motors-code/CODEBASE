import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Showroom } from './Showroom';
import { TripSearch } from './TripSearch';
import type { ClassStats } from './car-classes';

interface HeroSectionProps {
  totalVehicles: number;
  graceHours: number;
  classStats: ClassStats;
}

export function HeroSection({ totalVehicles, graceHours, classStats }: HeroSectionProps) {
  return (
    <section className="relative">
      {/* Dark band */}
      <div className="bg-navy-dark text-white">
        <div className="mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 md:pb-36 md:pt-16 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="reveal min-w-0 lg:col-span-5">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                Islamabad · Rawalpindi · Lahore · Karachi
              </p>
              <h1 className="display mt-5 text-[44px] leading-[1.02] sm:text-[56px] lg:text-[68px]">
                Rent by the day, or just the <span className="text-gold">12 hours</span> you need
              </h1>
              <p className="mt-6 max-w-[34rem] text-lg leading-[1.6] text-white/75">
                Self-drive or with a driver. Every return gets a {graceHours}-hour grace window, and the rate on the car is the rate you pay.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#fleet" className="btn-accent btn-lg">
                  Browse the fleet
                  <ArrowRight size={18} strokeWidth={2} className="rtl:rotate-180" />
                </a>
                <Link href="/portal/my" className="btn-on-dark btn-lg">Track a booking</Link>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6 sm:gap-6">
                {totalVehicles > 0 ? <Fact value={String(totalVehicles)} label="cars listed" /> : <Fact value="4" label="car classes" />}
                <Fact value="12h" label="shortest rental" />
                <Fact value={`${graceHours}h`} label="return grace" />
              </dl>
            </div>

            <div className="reveal reveal-d1 min-w-0 lg:col-span-7">
              <Showroom stats={classStats} />
            </div>
          </div>
        </div>
      </div>

      {/* Booking widget overlapping the band */}
      <div className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 md:-mt-20 lg:px-8">
        <div className="reveal reveal-d2">
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
      <dd className="mt-0.5 text-[13px] text-white/60">{label}</dd>
    </div>
  );
}
