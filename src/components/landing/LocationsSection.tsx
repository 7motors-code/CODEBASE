import { MapPin, Navigation, Phone, Check } from 'lucide-react';

export function LocationsSection() {
  const hubs = [
    {
      city: 'Islamabad / Rawalpindi',
      tag: 'Headquarters & Airport Hub',
      address: 'Main Blue Area & Islamabad International Airport (ISB) VIP Terminal',
      hours: 'Open 24 Hours / 7 Days',
      phone: '051-2800007',
      features: ['Airport Meet & Greet', 'Protocol Convoys', 'Northern Areas Passports'],
    },
    {
      city: 'Lahore',
      tag: 'Punjab Hub',
      address: 'DHA Phase 5 Commercial & Allama Iqbal International Airport',
      hours: 'Open 24 Hours / 7 Days',
      phone: '042-35800007',
      features: ['DHA Delivery in 30 Mins', 'Executive Chauffeurs', 'Wedding Fleet'],
    },
    {
      city: 'Karachi',
      tag: 'Southern Coast Hub',
      address: 'Clifton Block 4 & Jinnah International Airport (Terminal 1)',
      hours: 'Open 24 Hours / 7 Days',
      phone: '021-35800007',
      features: ['Corporate Monthly Leases', 'Armed Escorts On-Demand', 'City Transfers'],
    },
  ];

  return (
    <section id="locations" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">Branch Network</span>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            Prime Pickup Hubs & Doorstep Delivery
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70">
            Pick up your car directly at the airport terminal upon landing or have our concierge deliver it to your residence, hotel, or office.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {hubs.map((hub, idx) => (
            <div key={idx} className="liquid-card flex flex-col justify-between rounded-2xl p-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-gold-light">
                    {hub.tag}
                  </span>
                  <Navigation size={14} className="text-white/40" />
                </div>

                <h3 className="mt-4 text-xl font-bold text-white">{hub.city}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/70">{hub.address}</p>

                <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs text-white/60">
                  <p className="flex items-center gap-2">
                    <span className="text-gold font-semibold">Hours:</span> {hub.hours}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-gold font-semibold">Hotline:</span> {hub.phone}
                  </p>
                </div>

                <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-[11px] text-white/80">
                  {hub.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <a
                  href={`tel:${hub.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  <Phone size={13} />
                  <span>Call {hub.city.split(' ')[0]} Office</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
