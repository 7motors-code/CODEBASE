import { Showroom } from './Showroom';
import type { ClassStats } from './car-classes';

/** The four car classes with live rates, moved out of the hero. */
export function ClassesSection({ stats }: { stats: ClassStats }) {
  return (
    <section className="pt-20 md:pt-24" aria-labelledby="classes-heading">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        <div data-reveal className="lg:col-span-4">
          <h2 id="classes-heading" className="display text-[34px] leading-[1.08] text-ink md:text-5xl">Pick a class</h2>
          <p className="mt-3 text-base leading-relaxed text-ink2">
            Sedans for the city, SUVs for the motorway and the north, pickups for site work, and luxury for weddings and guests. Rates come from the cars listed today.
          </p>
        </div>
        <div data-reveal="scale" style={{ ['--d' as string]: '120ms' }} className="min-w-0 lg:col-span-8">
          <Showroom stats={stats} />
        </div>
      </div>
    </section>
  );
}
