'use client';

import { useState } from 'react';
import { ShieldCheck, Clock, MapPin, Sparkles, ChevronRight, CheckCircle2, Car } from 'lucide-react';

export function HeroSection({
  onSearch,
  totalVehicles = 50,
}: {
  onSearch?: (criteria: { city: string; start: string; end: string; durationType: string }) => void;
  totalVehicles?: number;
}) {
  const [city, setCity] = useState('Islamabad');
  const [start, setStart] = useState(() => {
    const d = new Date(Date.now() + 2 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [end, setEnd] = useState(() => {
    const d = new Date(Date.now() + 26 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [durationType, setDurationType] = useState('DAY');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch({ city, start, end, durationType });
    const fleetEl = document.getElementById('fleet');
    if (fleetEl) fleetEl.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Specular Ambient Glow Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-40 right-10 -z-10 h-80 w-80 rounded-full bg-navy-light/40 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-20 left-10 -z-10 h-72 w-72 rounded-full bg-gold-dark/10 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Floating Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold-light backdrop-blur-md shadow-sm">
            <Sparkles size={13} className="text-gold" />
            <span>Pakistan&apos;s Premier Chauffeur & Self-Drive Luxury Fleet</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="mt-6 text-center">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
            Drive Excellence. <br />
            <span className="bg-gradient-to-r from-gold-light via-gold to-amber-200 bg-clip-text text-transparent">
              Without Compromise.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/70 sm:text-lg">
            Experience uncompromised luxury and immaculate fleet reliability across Islamabad, Lahore, and Karachi. 
            Transparent rates, zero hidden fines, and 60-second booking confirmation.
          </p>
        </div>

        {/* Floating Liquid Glass Booking Bar */}
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="glass-surface rounded-3xl p-5 shadow-2xl transition-all sm:p-7">
            <form onSubmit={handleSearchSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* City Selection */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70">
                  <MapPin size={13} className="text-gold" /> Pickup City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="liquid-glass-input w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white outline-none"
                >
                  <option value="Islamabad" className="bg-navy-dark text-white">Islamabad / RWP</option>
                  <option value="Islamabad Airport" className="bg-navy-dark text-white">Islamabad Airport (ISB)</option>
                  <option value="Lahore" className="bg-navy-dark text-white">Lahore (DHA / City)</option>
                  <option value="Karachi" className="bg-navy-dark text-white">Karachi (Clifton / Airport)</option>
                </select>
              </div>

              {/* Pickup Time */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70">
                  <Clock size={13} className="text-gold" /> Pickup Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="liquid-glass-input w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                  required
                />
              </div>

              {/* Return Time */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70">
                  <Clock size={13} className="text-gold" /> Return Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="liquid-glass-input w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                  required
                />
              </div>

              {/* Action Button */}
              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  className="btn-gold flex h-[42px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-lg shadow-gold/25"
                >
                  <Car size={16} />
                  <span>Explore Cars</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </form>

            {/* Quick Rental Type Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white/60">Rental Basis:</span>
                <button
                  type="button"
                  onClick={() => setDurationType('DAY')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    durationType === 'DAY'
                      ? 'bg-gold text-navy-dark shadow'
                      : 'border border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  24-Hour Full Day
                </button>
                <button
                  type="button"
                  onClick={() => setDurationType('12H')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    durationType === '12H'
                      ? 'bg-gold text-navy-dark shadow'
                      : 'border border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  12-Hour Shift
                </button>
              </div>
              <div className="flex items-center gap-4 text-white/70">
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={13} /> 1-Hour Return Grace
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={13} /> Free Cancellation
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          <div className="liquid-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{totalVehicles}+</p>
            <p className="text-xs font-semibold text-white/60">Active Fleet Vehicles</p>
          </div>
          <div className="liquid-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-gold">100%</p>
            <p className="text-xs font-semibold text-white/60">Verified Chauffeurs</p>
          </div>
          <div className="liquid-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">24 / 7</p>
            <p className="text-xs font-semibold text-white/60">Roadside Support</p>
          </div>
          <div className="liquid-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">4.9 ★</p>
            <p className="text-xs font-semibold text-white/60">Verified Google Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
