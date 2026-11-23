'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { VehicleCard } from './VehicleCard';
import { BookingModal } from './BookingModal';
import { FleetEmpty } from './FleetEmpty';
import { CLASS_EVENT, PICKUP_HUBS, SEARCH_EVENT, type TripDetail } from './options';

export interface VehicleCardData {
  id: number;
  model: string;
  category: string;
  color: string | null;
  rateDay: number;
  rate12h: number;
  photoId: string | null;
  cardPhotoId: string | null;
  meterReading: number;
  regNo: string;
}

type SortKey = 'recommended' | 'price-asc' | 'price-desc';
const PAGE = 6;
const ALL = 'All';

interface FleetExplorerProps {
  vehicles: VehicleCardData[];
  phone: string;
  telHref: string | null;
  whatsappHref: string | null;
}

export function FleetExplorer({ vehicles, phone, telHref, whatsappHref }: FleetExplorerProps) {
  const [category, setCategory] = useState<string>(ALL);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [sortBy, setSortBy] = useState<SortKey>('recommended');
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<VehicleCardData | null>(null);
  const [trip, setTrip] = useState<TripDetail | null>(null);

  useEffect(() => {
    const onTrip = (e: Event) => setTrip((e as CustomEvent<TripDetail>).detail);
    const onClass = (e: Event) => { setCategory((e as CustomEvent<string>).detail); setLimit(PAGE); };
    window.addEventListener(SEARCH_EVENT, onTrip);
    window.addEventListener(CLASS_EVENT, onClass);
    return () => {
      window.removeEventListener(SEARCH_EVENT, onTrip);
      window.removeEventListener(CLASS_EVENT, onClass);
    };
  }, []);

  const categories = useMemo(() => {
    const listed = Array.from(new Set(vehicles.map((v) => v.category)));
    return [ALL, ...listed, ...(category !== ALL && !listed.includes(category) ? [category] : [])];
  }, [vehicles, category]);

  const filtered = useMemo(() => {
    const byCategory = category === ALL ? vehicles : vehicles.filter((v) => v.category === category);
    const byQuery = deferredQuery
      ? byCategory.filter((v) => `${v.model} ${v.category} ${v.color ?? ''} ${v.regNo}`.toLowerCase().includes(deferredQuery))
      : byCategory;
    if (sortBy === 'price-asc') return [...byQuery].sort((a, b) => a.rateDay - b.rateDay);
    if (sortBy === 'price-desc') return [...byQuery].sort((a, b) => b.rateDay - a.rateDay);
    return byQuery;
  }, [vehicles, category, deferredQuery, sortBy]);

  const visible = filtered.slice(0, limit);
  const hubLabel = trip ? PICKUP_HUBS.find((h) => h.value === trip.city)?.label : null;

  const reset = () => {
    setCategory(ALL);
    setQuery('');
    setLimit(PAGE);
  };

  return (
    <section id="fleet" className="scroll-mt-20 pb-20 pt-16 md:pb-24 md:pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="display text-[34px] leading-[1.08] text-ink md:text-5xl">The fleet</h2>
            <p className="mt-3 text-base leading-relaxed text-ink2">
              {vehicles.length > 0
                ? 'Every car with its plate, its kilometres and both rates. Send a request and the office confirms it by phone.'
                : 'Tell us the class and the dates. The office confirms what is free by phone.'}
            </p>
          </div>
          {vehicles.length > 0 && <p className="text-[13px] text-muted" aria-live="polite">
            {hubLabel ? <>Pickup in <span className="text-ink">{hubLabel}</span> · </> : null}
            <span className="font-mono tabular-nums text-ink">{filtered.length}</span> of{' '}
            <span className="font-mono tabular-nums">{vehicles.length}</span> cars
          </p>}
        </div>

        {/* Filters */}
        {vehicles.length > 0 && <div className="mt-8 flex min-w-0 flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Category" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            {categories.map((c) => {
              const on = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => { setCategory(c); setLimit(PAGE); }}
                  className={`h-9 shrink-0 rounded-md px-3 text-sm transition-colors duration-150 ${
                    on ? 'bg-navy-dark font-medium text-white' : 'text-ink2 hover:bg-panel2 hover:text-ink'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <label className="relative flex-1 lg:w-64 lg:flex-none">
              <span className="sr-only">Search</span>
              <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="input ps-9" />
            </label>
            <label>
              <span className="sr-only">Sort</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="input w-auto">
                <option value="recommended">Recommended</option>
                <option value="price-asc">Lowest rate</option>
                <option value="price-desc">Highest rate</option>
              </select>
            </label>
          </div>
        </div>}

        {vehicles.length === 0 ? (
          <FleetEmpty category={null} phone={phone} telHref={telHref} whatsappHref={whatsappHref} />
        ) : visible.length === 0 ? (
          deferredQuery ? (
            <div className="mt-10 rounded-xl border border-dashed border-line px-6 py-16 text-center">
              <p className="text-[15px] font-medium text-ink">No cars match “{query.trim()}”</p>
              <p className="mt-1 text-sm text-muted">Try a model, colour or registration number</p>
              <button type="button" onClick={reset} className="btn-ghost mt-5">Clear search</button>
            </div>
          ) : (
            <FleetEmpty category={category === ALL ? null : category} phone={phone} telHref={telHref} whatsappHref={whatsappHref} onShowAll={reset} />
          )
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((car) => <VehicleCard key={car.id} car={car} onSelect={setSelected} />)}
          </div>
        )}

        {filtered.length > limit && (
          <div className="mt-10 flex justify-center">
            <button type="button" onClick={() => setLimit((n) => n + PAGE)} className="btn-ghost">
              Show more
              <span className="font-mono text-[13px] tabular-nums text-muted">{filtered.length - limit}</span>
            </button>
          </div>
        )}
      </div>

      {selected && (
        <BookingModal car={selected} trip={trip} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
