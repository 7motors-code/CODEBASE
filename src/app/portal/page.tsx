import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { vehicleClash } from '@/lib/calc';
import { parsePk, pkInput, pkr } from '@/lib/format';
import { Modal, Plate } from '@/components/ui';
import { RequestForm } from './RequestForm';

type SP = { start?: string; end?: string; car?: string; category?: string };

/** /portal URL that keeps the visitor's dates and type filter. */
function portalHref(sp: SP, over: Partial<SP>) {
  const u = new URLSearchParams();
  Object.entries({ start: sp.start, end: sp.end, category: sp.category, ...over }).forEach(([k, v]) => { if (v) u.set(k, v); });
  const s = u.toString();
  return s ? `/portal?${s}` : '/portal';
}

export default async function Portal({ searchParams: sp }: { searchParams: SP }) {
  const cars = await db.select().from(schema.vehicles).where(eq(schema.vehicles.active, true)).orderBy(schema.vehicles.rateDay);
  const start = parsePk(sp.start ?? ''), end = parsePk(sp.end ?? '');
  const badRange = !!(sp.start && sp.end && start && end && end <= start);
  const checking = !!(start && end && end > start);
  // One availability check per car, run together rather than one after another.
  const clashes = checking ? await Promise.all(cars.map((c) => vehicleClash(c.id, start!, end!))) : [];
  const free = new Map(cars.map((c, i) => [c.id, !checking || !clashes[i]]));
  const cats = Array.from(new Set(cars.map((c) => c.category)));
  const list = cars.filter((c) => !sp.category || c.category === sp.category);
  const carId = Number(sp.car);
  const chosen = sp.car && Number.isInteger(carId) ? cars.find((c) => c.id === carId) : undefined;
  const now = pkInput(new Date(Date.now() + 3600000));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-medium tracking-[-0.01em] text-ink">Find a car</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink2">Pick your dates to see which cars are free, then send a request. The office calls you to confirm.</p>
        <form method="get" className="card mt-6 grid gap-3 p-4 md:grid-cols-[1fr_1fr_200px_auto]">
          <label className="block"><span className="label">Pickup</span><input type="datetime-local" name="start" min={now} defaultValue={sp.start ?? now} className="input" /></label>
          <label className="block"><span className="label">Return</span><input type="datetime-local" name="end" min={sp.start ?? now} defaultValue={sp.end} className="input" /></label>
          <label className="block"><span className="label">Type</span><select name="category" defaultValue={sp.category} className="input"><option value="">All types</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></label>
          <button className="btn-primary self-end">Check availability</button>
        </form>
        {badRange && <p role="alert" className="mt-3 rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">The return time must be after the pick-up time.</p>}
        {checking && <p role="status" className="mt-3 text-[13px] text-ink2">Showing which cars are free for your dates.</p>}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <h2 className="text-[15px] font-medium text-ink">{cars.length === 0 ? 'No cars are listed online right now' : 'No cars of this type are listed'}</h2>
          <p className="mt-1 text-sm text-ink2">Call the office and they will tell you what is available.</p>
          {sp.category && <Link href={portalHref(sp, { category: undefined })} className="btn-ghost mt-5">Show all types</Link>}
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const ok = free.get(c.id) ?? true;
            const photo = c.cardPhotoId ?? c.photoId;
            return (
              <li key={c.id} className="card overflow-hidden">
                {photo
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={photo.startsWith('/') ? photo : `/api/files/${photo}`} alt="" loading="lazy" decoding="async" className={`aspect-[16/10] w-full bg-[#101216] object-cover ${ok ? '' : 'opacity-50 grayscale'}`} />
                  : <div aria-hidden className="flex aspect-[16/10] items-center justify-center bg-panel2 text-sm text-muted">{c.model}</div>}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 truncate text-[15px] font-medium text-ink">{c.model}</h2><Plate reg={c.regNo} />
                  </div>
                  <p className="mt-1 text-[13px] text-ink2">{[c.category, c.color].filter(Boolean).join(' · ')}</p>
                  <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="font-mono text-lg font-medium tabular-nums text-ink"><bdi dir="ltr">{pkr(c.rateDay)}</bdi><span className="ms-1 font-sans text-[13px] font-normal text-ink2">/ day</span></p>
                      <p className="font-mono text-[13px] tabular-nums text-ink2"><bdi dir="ltr">{pkr(c.rate12h)}</bdi><span className="ms-1 font-sans">/ 12h</span></p>
                    </div>
                    {ok
                      ? <Link href={portalHref(sp, { car: String(c.id), start: sp.start ?? now })} aria-label={`Request ${c.model}`} className="btn-ghost">Request</Link>
                      : <span className="text-[13px] font-medium text-bad">Not free on these dates</span>}
                  </div>
                </div>
              </li>);
          })}
        </ul>
      )}

      {chosen && (
        <Modal title={`Request ${chosen.model}`} closeHref={portalHref(sp, { car: undefined })}>
          <p className="-mt-2 mb-4 font-mono text-[13px] tabular-nums text-ink2"><bdi dir="ltr">{pkr(chosen.rateDay)}</bdi> / day · <bdi dir="ltr">{pkr(chosen.rate12h)}</bdi> / 12h</p>
          <RequestForm vehicleId={chosen.id} rates={{ rateDay: chosen.rateDay, rate12h: chosen.rate12h }} start={sp.start ?? now} end={sp.end ?? ''} min={now} />
        </Modal>
      )}
    </div>
  );
}
