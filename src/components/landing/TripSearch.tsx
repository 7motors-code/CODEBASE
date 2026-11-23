'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { PICKUP_HUBS, SEARCH_EVENT, localInput, type DurationType, type TripDetail } from './options';

/** Pickup hub + dates. Hands the trip to the fleet section below. */
export function TripSearch({ graceHours }: { graceHours: number }) {
  const [city, setCity] = useState<string>(PICKUP_HUBS[0].value);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [durationType, setDurationType] = useState<DurationType>('DAY');

  // Dates depend on the visitor's clock, so set them after hydration.
  useEffect(() => {
    setStart(localInput(2));
    setEnd(localInput(26));
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const detail: TripDetail = { city, start, end, durationType };
    window.dispatchEvent(new CustomEvent<TripDetail>(SEARCH_EVENT, { detail }));
    document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-panel p-2 shadow-modal" aria-label="Find a car">
      <p className="px-4 pb-1 pt-3 text-lg font-bold tracking-[-0.01em] text-ink">Find a car</p>
      <div className="grid gap-2 md:grid-cols-[1.1fr_1fr_1fr_auto]">
        <Cell label="Pickup">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="input border-0 bg-transparent shadow-none focus:ring-0">
            {PICKUP_HUBS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </Cell>
        <Cell label="From">
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required className="input border-0 bg-transparent shadow-none focus:ring-0" />
        </Cell>
        <Cell label="Until">
          <input type="datetime-local" value={end} min={start} onChange={(e) => setEnd(e.target.value)} required className="input border-0 bg-transparent shadow-none focus:ring-0" />
        </Cell>
        <button type="submit" className="btn-accent btn-lg h-auto min-h-12 md:px-7">
          <Search size={18} strokeWidth={1.75} />
          Show cars
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 pb-1 pt-3">
        <div role="radiogroup" aria-label="Rental basis" className="inline-flex rounded-lg bg-panel2 p-0.5">
          {([['DAY', '24-hour day'], ['12H', '12-hour shift']] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={durationType === v}
              onClick={() => setDurationType(v)}
              className={`h-8 rounded-md px-3 text-[13px] transition-colors duration-150 ${
                durationType === v ? 'bg-panel font-medium text-ink shadow-xs' : 'text-ink2 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-muted">No pre-payment · {graceHours}-hour grace on every return</p>
      </div>
    </form>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-lg px-1 pt-1.5 transition-colors duration-150 focus-within:bg-panel2 hover:bg-panel2/60">
      <span className="block px-3 text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
