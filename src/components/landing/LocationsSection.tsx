import { MapPin, MessageCircle, Phone } from 'lucide-react';

export interface Hub {
  id: string | number;
  name: string;
  city: string | null;
  address: string | null;
}

/** Used until the office adds its branches under Admin → Locations: cities only, no invented addresses. */
export const DEFAULT_HUBS: Hub[] = [
  { id: 'isb', name: 'Islamabad / Rawalpindi', city: null, address: null },
  { id: 'lhe', name: 'Lahore', city: null, address: null },
  { id: 'khi', name: 'Karachi', city: null, address: null },
];

interface LocationsSectionProps {
  hubs: Hub[];
  phone: string;
  telHref: string | null;
  whatsappHref: string | null;
}

export function LocationsSection({ hubs, phone, telHref, whatsappHref }: LocationsSectionProps) {
  return (
    <section id="locations" className="scroll-mt-20 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div data-reveal className="max-w-2xl">
            <h2 className="display text-[34px] leading-[1.08] text-ink md:text-5xl">Where to pick up</h2>
            <p className="mt-3 text-base leading-relaxed text-ink2">
              Collect from a branch or the airport, or ask for the car to be brought to your home, hotel or office.
            </p>
          </div>
          {(telHref || whatsappHref) && (
            <div className="flex flex-wrap gap-2">
              {telHref && (
                <a href={telHref} className="btn-ghost">
                  <Phone size={16} strokeWidth={1.5} className="text-muted" />
                  <span className="font-mono tabular-nums">{phone}</span>
                </a>
              )}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <MessageCircle size={16} strokeWidth={1.5} className="text-muted" />
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hubs.map((h, i) => (
            <li key={h.id} data-reveal style={{ ['--d' as string]: `${i * 80}ms` }} className="rounded-xl border border-line border-t-4 border-t-navy bg-panel p-6 shadow-xs transition-[box-shadow,border-color] duration-150 hover:border-t-gold hover:shadow-float">
              <div className="flex items-center gap-2.5">
                <MapPin size={18} strokeWidth={2} className="text-navy" aria-hidden />
                <h3 className="text-lg font-semibold text-ink">{h.name}</h3>
              </div>
              {h.address && <p className="mt-2 ps-[26px] text-sm leading-relaxed text-ink2">{h.address}</p>}
              {h.city && h.city !== h.name && <p className="mt-1 ps-[26px] text-[13px] text-muted">{h.city}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
