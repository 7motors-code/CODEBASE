interface RentalExample { model: string; rateDay: number; rate12h: number }

interface ExperienceSectionProps {
  graceHours: number;
  /** Cheapest listed car, used for the worked example. Null hides prices. */
  example: RentalExample | null;
}

const money = (n: number) => `PKR ${n.toLocaleString('en-PK')}`;

const POINTS = [
  {
    title: 'Pay for the hours you use',
    body: 'Take a car for a 12-hour shift or a full 24-hour day. Both rates are printed on every car, so the quote matches the bill.',
  },
  {
    title: 'A grace window on every return',
    body: 'Stuck on the motorway or at a signal on Jinnah Avenue? Returns inside the grace window are not charged as late.',
  },
  {
    title: 'Self-drive or with a driver',
    body: 'Drive yourself, or book one of our drivers for airport runs, weddings and intercity trips.',
  },
  {
    title: 'Paperwork on WhatsApp',
    body: 'Your booking reference, agreement and payment receipts come from the same office system our staff use.',
  },
] as const;

export function ExperienceSection({ graceHours, example }: ExperienceSectionProps) {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-navy-dark py-20 text-white md:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-5">
          <h2 className="display text-[34px] leading-[1.08] md:text-5xl">How renting <span className="text-gold">works</span></h2>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Two rates, one grace window, no surprises at the counter.
          </p>
          <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {POINTS.map((p) => (
              <div key={p.title} className="py-5">
                <dt className="text-base font-semibold text-white">{p.title}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-white/65">{p.body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-7">
          <RentalClock graceHours={graceHours} example={example} />
        </div>
      </div>
    </section>
  );
}

/**
 * A worked example of a rental, drawn as a timeline:
 * pick up 09:00, shift ends 21:00, grace runs on, full day ends 09:00.
 */
function RentalClock({ graceHours, example }: { graceHours: number; example: RentalExample | null }) {
  const PICKUP = 9;
  const SPAN = 26; // hours shown on the track
  const pct = (h: number) => `${(h / SPAN) * 100}%`;
  const fmt = (h: number) => `${String((PICKUP + h) % 24).padStart(2, '0')}:00`;
  const ticks = [0, 6, 12, 18, 24];

  return (
    <figure className="rounded-2xl bg-panel p-6 text-ink shadow-modal sm:p-8">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-base font-semibold text-ink">{example ? `${example.model}, picked up at 09:00` : 'A car picked up at 09:00'}</span>
        <span className="text-[13px] text-muted">Example rental</span>
      </figcaption>

      <div className="mt-10 space-y-8" aria-hidden>
        <Track label="12-hour shift" rate={example ? money(example.rate12h) : null} end={12} grace={graceHours} pct={pct} />
        <Track label="24-hour day" rate={example ? money(example.rateDay) : null} end={24} grace={graceHours} pct={pct} />
      </div>

      <div className="relative mt-4 h-5 font-mono text-xs tabular-nums text-muted" aria-hidden>
        {ticks.map((t) => (
          <span key={t} className={`absolute ${t === 0 ? '' : '-translate-x-1/2'}`} style={{ left: pct(t) }}>{fmt(t)}</span>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-[13px] text-ink2">
        <Legend swatch="bg-navy" label="Rental time" />
        <Legend swatch="bg-gold" label={`Grace window, ${graceHours} hour${graceHours === 1 ? '' : 's'}`} />
        <Legend swatch="bg-line" label="Charged as late after this" />
      </div>

      <p className="sr-only">
        Picked up at 09:00. A 12-hour shift ends at 21:00 with grace until {fmt(12 + graceHours)}. A 24-hour day ends at 09:00 the next morning with grace until {fmt(24 + graceHours)}.
      </p>
    </figure>
  );
}

interface TrackProps {
  label: string;
  rate: string | null;
  end: number;
  grace: number;
  pct: (h: number) => string;
}

function Track({ label, rate, end, grace, pct }: TrackProps) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between text-sm">
        <span className="text-ink">{label}</span>
        {rate && <span className="font-mono tabular-nums text-ink2">{rate}</span>}
      </div>
      <div className="relative h-4 rounded-full bg-line">
        <div className="absolute inset-y-0 start-0 rounded-s-full bg-navy" style={{ width: pct(end) }} />
        <div className="absolute inset-y-0 rounded-e-full bg-gold" style={{ left: pct(end), width: pct(grace) }} />
        <span className="absolute -top-1 h-5 w-0.5 rounded-full bg-ink" style={{ left: `calc(${pct(end)} - 1px)` }} />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
